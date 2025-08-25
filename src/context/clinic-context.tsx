
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { User, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, addDoc, getDocs, updateDoc, deleteDoc, query, where, Timestamp } from 'firebase/firestore';


// Types
export type PatientStatus = 'waiting' | 'called' | 'in_consult' | 'prescribed' | 'sent_to_pharmacy' | 'dispensed';
export type PrescriptionStatus = 'pending' | 'dispensed';

export interface FirestoreDocument {
    id: string;
}

export interface PatientHistory {
    date: string; // ISO String
    doctorName: string;
    notes: string;
}

export interface Patient extends FirestoreDocument {
    name: string;
    phone: string;
    gender: 'Male' | 'Female' | 'Other';
    age: number;
    avatarUrl: string;
    history: PatientHistory[];
}

export interface Doctor extends FirestoreDocument {
    name: string;
    specialization: string;
    avatarUrl: string;
    initials: string;
}

export interface WaitingPatient extends FirestoreDocument {
    patientId: string;
    patientName: string;
    gender: 'Male' | 'Female' | 'Other',
    age: number,
    avatarUrl: string;
    doctorId: string;
    doctorName: string;
    status: PatientStatus;
    time: string;
    visitDate: string; // YYYY-MM-DD
    advice?: string;
}

export interface Prescription extends FirestoreDocument {
  waitingPatientId: string;
  patientName: string;
  doctor: string;
  time: string;
  items: string[];
  status: PrescriptionStatus;
  advice?: string;
}

export interface ClinicSettings {
    clinicName: string;
    clinicAddress: string;
    receiptValidityDays: number;
}

type Notification = {
    id: number;
    message: string;
};

interface ClinicContextType {
    user: User | null;
    patients: Patient[];
    doctors: Doctor[];
    waitingList: WaitingPatient[];
    pharmacyQueue: Prescription[];
    notifications: Notification[];
    settings: ClinicSettings;
    loading: boolean;
    clinicId: string | null;
    signup: (email: string, password: string, clinicName: string, username: string) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    addPatient: (patient: Omit<Patient, 'id' | 'avatarUrl' | 'history'>) => Promise<Patient | undefined>;
    addPatientToWaitingList: (patientId: string, doctorId: string) => void;
    updatePatientStatus: (waitingPatientId: string, status: PatientStatus, items?: string[], advice?: string) => void;
    updatePrescriptionStatus: (prescriptionId: string, status: PrescriptionStatus) => void;
    addDoctor: (doctor: Omit<Doctor, 'id'>) => Promise<Doctor | undefined>;
    updateDoctor: (doctorId: string, doctorData: Partial<Omit<Doctor, 'id'>>) => Promise<void>;
    deleteDoctor: (doctorId: string) => Promise<void>;
    dismissNotification: (id: number) => void;
    updateSettings: (newSettings: Partial<ClinicSettings>) => Promise<void>;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const ClinicProvider = ({ children }: { children: ReactNode }) => {
    const { toast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [clinicId, setClinicId] = useState<string | null>(null);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [waitingList, setWaitingList] = useState<WaitingPatient[]>([]);
    const [pharmacyQueue, setPharmacyQueue] = useState<Prescription[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [settings, setSettings] = useState<ClinicSettings>({
        clinicName: 'MediChain Clinic',
        clinicAddress: '123 Health St, Wellness City',
        receiptValidityDays: 30,
    });
    const [loading, setLoading] = useState(true);

    const loadClinicData = async (uid: string) => {
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            
            // Fetch Settings
            const settingsDoc = await getDoc(doc(db, 'clinics', uid));
            if (settingsDoc.exists()) {
                setSettings(settingsDoc.data() as ClinicSettings);
            }

            // Fetch Doctors
            const doctorsSnapshot = await getDocs(collection(db, 'clinics', uid, 'doctors'));
            const doctorsData = doctorsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Doctor));
            setDoctors(doctorsData);

            // Fetch Patients
            const patientsSnapshot = await getDocs(collection(db, 'clinics', uid, 'patients'));
            const patientsData = patientsSnapshot.docs.map(p => ({ id: p.id, ...p.data() } as Patient));
            setPatients(patientsData);
            
            // Fetch Today's Waiting List
            const waitingListQuery = query(collection(db, 'clinics', uid, 'waitingList'), where('visitDate', '==', todayStr));
            const waitingListSnapshot = await getDocs(waitingListQuery);
            const waitingListData = waitingListSnapshot.docs.map(wl => ({ id: wl.id, ...wl.data() } as WaitingPatient));
            setWaitingList(waitingListData);

            // Fetch Today's Pharmacy Queue
            const waitingListIds = waitingListData.map(p => p.id);
            if (waitingListIds.length > 0) {
                 const pharmacyQuery = query(collection(db, 'clinics', uid, 'pharmacyQueue'), where('waitingPatientId', 'in', waitingListIds));
                 const pharmacySnapshot = await getDocs(pharmacyQuery);
                 const pharmacyData = pharmacySnapshot.docs.map(pq => ({ id: pq.id, ...pq.data() } as Prescription));
                 setPharmacyQueue(pharmacyData);
            } else {
                setPharmacyQueue([]);
            }

        } catch (error) {
            console.error("Failed to load clinic data:", error);
            toast({ title: 'Error', description: 'Could not load your clinic data.', variant: 'destructive'});
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setLoading(true);
            if (user) {
                setUser(user);
                setClinicId(user.uid);
                await loadClinicData(user.uid);
            } else {
                setUser(null);
                setClinicId(null);
                setPatients([]);
                setDoctors([]);
                setWaitingList([]);
                setPharmacyQueue([]);
                setSettings({ clinicName: '', clinicAddress: '', receiptValidityDays: 30 });
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    
    // AUTH FUNCTIONS
    const signup = async (email: string, password: string, clinicName: string, username: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const { user } = userCredential;
        // Create clinic document
        const newSettings: ClinicSettings = {
            clinicName,
            clinicAddress: 'Not set',
            receiptValidityDays: 30,
        };
        await setDoc(doc(db, 'clinics', user.uid), { ...newSettings, username });
        // The onAuthStateChanged listener will handle setting user, clinicId, and loading data.
    };

    const login = async (username: string, password: string) => {
        const email = `${username}@medichain.app`;
        await signInWithEmailAndPassword(auth, email, password);
    };

    const logout = async () => {
        await signOut(auth);
    };
    
    // DATA FUNCTIONS
    const addDoctor = async (doctorData: Omit<Doctor, 'id'>): Promise<Doctor | undefined> => {
        if (!clinicId) throw new Error("Not authenticated");
        const docRef = await addDoc(collection(db, 'clinics', clinicId, 'doctors'), doctorData);
        const newDoctor = { id: docRef.id, ...doctorData };
        setDoctors(prev => [...prev, newDoctor]);
        return newDoctor;
    };
    
    const updateDoctor = async (doctorId: string, doctorData: Partial<Omit<Doctor, 'id'>>) => {
        if (!clinicId) throw new Error("Not authenticated");
        const docRef = doc(db, 'clinics', clinicId, 'doctors', doctorId);
        await updateDoc(docRef, doctorData);
        setDoctors(prev => prev.map(d => d.id === doctorId ? {...d, ...doctorData} as Doctor : d));
    };

    const deleteDoctor = async (doctorId: string) => {
        if (!clinicId) return;
        await deleteDoc(doc(db, 'clinics', clinicId, 'doctors', doctorId));
        setDoctors(prev => prev.filter(d => d.id !== doctorId));
    };
    
    const addPatient = async (patientData: Omit<Patient, 'id' | 'avatarUrl' | 'history'>): Promise<Patient | undefined> => {
        if (!clinicId) return undefined;
        const newPatientData = {
            ...patientData,
            avatarUrl: `https://placehold.co/100x100?text=${patientData.name.charAt(0)}`,
            history: [],
        }
        const docRef = await addDoc(collection(db, 'clinics', clinicId, 'patients'), newPatientData);
        const newPatient: Patient = { id: docRef.id, ...newPatientData };
        setPatients(prev => [...prev, newPatient]);

        toast({ title: 'Patient Added', description: `${newPatient.name} has been registered.` });
        return newPatient;
    };
    
    const addPatientToWaitingList = async (patientId: string, doctorId: string) => {
        if (!clinicId) return;
        const patient = patients.find(p => p.id === patientId);
        if (!patient) return;

        const doctor = doctors.find(d => d.id === doctorId);
        if (!doctor) return;

        const isPatientActive = waitingList.some(p => p.patientId === patientId && p.status !== 'dispensed' && p.status !== 'prescribed');
        if (isPatientActive) {
            toast({ title: 'Already Waiting', description: `${patient.name} is still in the active clinic queue.`, variant: 'destructive' });
            return;
        }

        const newWaitingPatientData: Omit<WaitingPatient, 'id'> = {
            patientId,
            patientName: patient.name,
            gender: patient.gender,
            age: patient.age,
            avatarUrl: patient.avatarUrl,
            doctorId: doctorId,
            doctorName: doctor.name,
            status: 'waiting',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            visitDate: new Date().toISOString().split('T')[0],
        };
        const docRef = await addDoc(collection(db, 'clinics', clinicId, 'waitingList'), newWaitingPatientData);
        setWaitingList(prev => [...prev, {id: docRef.id, ...newWaitingPatientData}]);
        
        // Update patient history
        const newHistoryEntry: PatientHistory = {
            date: new Date().toISOString(),
            doctorName: doctor.name,
            notes: 'Added to waiting list for consultation.'
        };
        const updatedHistory = [...patient.history, newHistoryEntry];
        await updateDoc(doc(db, 'clinics', clinicId, 'patients', patientId), { history: updatedHistory });
        setPatients(prev => prev.map(p => p.id === patientId ? {...p, history: updatedHistory} : p));

        toast({ title: 'Added to Waitlist', description: `${patient.name} is now waiting for Dr. ${doctor.name}.` });
    };

    const updatePatientStatus = async (waitingPatientId: string, status: PatientStatus, items: string[] = [], advice?: string) => {
        if (!clinicId) return;
        const patientToUpdate = waitingList.find(p => p.id === waitingPatientId);
        if (!patientToUpdate) return;
        
        const updateData: Partial<WaitingPatient> = { status };
        if (advice) {
            updateData.advice = advice;
        }

        await updateDoc(doc(db, 'clinics', clinicId, 'waitingList', waitingPatientId), updateData);
        setWaitingList(prev => prev.map(p => p.id === waitingPatientId ? {...p, ...updateData} : p));

        if (status === 'called') {
            addNotification(`Dr. ${patientToUpdate.doctorName} is calling for ${patientToUpdate.patientName}.`);
        }
        
        if (status === 'sent_to_pharmacy') {
            const newPrescriptionData: Omit<Prescription, 'id'> = {
                waitingPatientId: waitingPatientId,
                patientName: patientToUpdate.patientName,
                doctor: patientToUpdate.doctorName,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                items,
                advice,
                status: 'pending',
            };
            const presRef = await addDoc(collection(db, 'clinics', clinicId, 'pharmacyQueue'), newPrescriptionData);
            setPharmacyQueue(prev => [...prev, { id: presRef.id, ...newPrescriptionData }]);
            toast({ title: 'Sent to Pharmacy', description: `${patientToUpdate.patientName}'s prescription has been sent.` });
        } else if (status !== 'in_consult') {
             toast({ title: 'Status Updated', description: `${patientToUpdate.patientName}'s status is now ${status.replace(/_/g, ' ')}.`, });
        }
    };
    
    const updatePrescriptionStatus = async (prescriptionId: string, status: PrescriptionStatus) => {
        if (!clinicId) return;
        const prescription = pharmacyQueue.find(p => p.id === prescriptionId);
        if (!prescription) return;
        
        await updateDoc(doc(db, 'clinics', clinicId, 'pharmacyQueue', prescriptionId), { status });
        
        if (status === 'dispensed') {
            await updateDoc(doc(db, 'clinics', clinicId, 'waitingList', prescription.waitingPatientId), { status: 'dispensed' });
            setWaitingList(prev => prev.map(p => p.id === prescription.waitingPatientId ? {...p, status: 'dispensed' } : p));
             toast({ title: 'Patient Processed', description: `${prescription.patientName} has been marked as Done.` });
        }
        setPharmacyQueue(prev => prev.map(p => p.id === prescriptionId ? { ...p, status } : p));
    };

    const addNotification = (message: string) => {
        const newNotification = { id: Date.now(), message };
        setNotifications(prev => [...prev, newNotification]);
    }
    
    const dismissNotification = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }
    
     const updateSettings = async (newSettings: Partial<ClinicSettings>) => {
        if (!clinicId) throw new Error("Not authenticated");
        const settingsRef = doc(db, 'clinics', clinicId);
        await updateDoc(settingsRef, newSettings);
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    return (
        <ClinicContext.Provider value={{ 
            user,
            patients, 
            doctors, 
            waitingList, 
            pharmacyQueue, 
            notifications,
            settings,
            loading,
            clinicId,
            signup,
            login,
            logout,
            addPatient,
            addPatientToWaitingList,
            updatePatientStatus,
            updatePrescriptionStatus,
            addDoctor,
            updateDoctor,
            deleteDoctor,
            dismissNotification,
            updateSettings,
        }}>
            {children}
        </ClinicContext.Provider>
    );
};

export const useClinicContext = () => {
    const context = useContext(ClinicContext);
    if (context === undefined) {
        throw new Error('useClinicContext must be used within a ClinicProvider');
    }
    return context;
};

    
