
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { User, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, addDoc, updateDoc, deleteDoc, query, where, onSnapshot, Unsubscribe, serverTimestamp } from 'firebase/firestore';


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
    settings: ClinicSettings | null;
    loading: boolean;
    clinicId: string | null;
    signup: (email: string, password: string, clinicName: string, username: string) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    addPatient: (patient: Omit<Patient, 'id' | 'avatarUrl' | 'history'>) => Promise<Patient | undefined>;
    addPatientToWaitingList: (patientId: string, doctorId: string) => Promise<void>;
    updatePatientStatus: (waitingPatientId: string, status: PatientStatus, items?: string[], advice?: string) => Promise<void>;
    updatePrescriptionStatus: (prescriptionId: string, status: PrescriptionStatus) => Promise<void>;
    addDoctor: (doctor: Omit<Doctor, 'id' | 'initials' | 'avatarUrl'>) => Promise<void>;
    updateDoctor: (doctorId: string, doctorData: Partial<Omit<Doctor, 'id' | 'initials' | 'avatarUrl'>>) => Promise<void>;
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
    const [settings, setSettings] = useState<ClinicSettings | null>(null);
    const [loading, setLoading] = useState(true);

     useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            setLoading(true);
            if (user) {
                setUser(user);
                setClinicId(user.uid);
            } else {
                setUser(null);
                setClinicId(null);
                // Clear all data on logout
                setPatients([]);
                setDoctors([]);
                setWaitingList([]);
                setPharmacyQueue([]);
                setSettings(null);
                setLoading(false);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!clinicId) {
            setLoading(false);
            return;
        };

        setLoading(true);
        const todayStr = new Date().toISOString().split('T')[0];
        let activeListeners: Unsubscribe[] = [];

        try {
            const unsubscribers = [
                onSnapshot(doc(db, 'clinics', clinicId), (doc) => {
                    if (doc.exists()) {
                        setSettings(doc.data() as ClinicSettings);
                    }
                }),
                onSnapshot(collection(db, 'clinics', clinicId, 'doctors'), (snapshot) => {
                    const doctorsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Doctor));
                    setDoctors(doctorsData);
                }),
                onSnapshot(collection(db, 'clinics', clinicId, 'patients'), (snapshot) => {
                    const patientsData = snapshot.docs.map(p => ({ id: p.id, ...p.data() } as Patient));
                    setPatients(patientsData);
                }),
                 onSnapshot(query(collection(db, 'clinics', clinicId, 'waitingList'), where('visitDate', '==', todayStr)), (snapshot) => {
                    const waitingListData = snapshot.docs.map(wl => ({ id: wl.id, ...wl.data() } as WaitingPatient));
                    setWaitingList(waitingListData);
                }),
                onSnapshot(query(collection(db, 'clinics', clinicId, 'pharmacyQueue'), where('status', '==', 'pending')), (snapshot) => {
                    const pharmacyData = snapshot.docs.map(pq => ({ id: pq.id, ...pq.data() } as Prescription));
                    setPharmacyQueue(pharmacyData);
                }),
            ];
            activeListeners = unsubscribers;
        } catch (error) {
            console.error("Failed to subscribe to clinic data:", error);
            toast({ title: 'Error', description: 'Could not load your clinic data.', variant: 'destructive'});
        } finally {
            setLoading(false);
        }

        // Cleanup listeners on clinicId change or unmount
        return () => {
            activeListeners.forEach(unsub => unsub());
        };
    }, [clinicId, toast]);
    
    // AUTH FUNCTIONS
    const signup = async (email: string, password: string, clinicName: string, username: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const { user } = userCredential;
        const newSettings: ClinicSettings = {
            clinicName,
            clinicAddress: 'Not set',
            receiptValidityDays: 30,
        };
        await setDoc(doc(db, 'clinics', user.uid), { ...newSettings, username });
    };

    const login = async (username: string, password: string) => {
        const email = `${username}@medichain.app`;
        await signInWithEmailAndPassword(auth, email, password);
    };

    const logout = async () => {
        await signOut(auth);
    };
    
    // DATA FUNCTIONS
    const addDoctor = async (doctorData: Omit<Doctor, 'id' | 'initials' | 'avatarUrl'>) => {
        if (!clinicId) throw new Error("Not authenticated");
        const newDoctorData = {
          ...doctorData,
          initials: doctorData.name.split(' ').map(n => n[0]).join('').toUpperCase(),
          avatarUrl: `https://placehold.co/100x100.png?text=${doctorData.name.charAt(0)}`,
        }
        await addDoc(collection(db, 'clinics', clinicId, 'doctors'), newDoctorData);
    };
    
    const updateDoctor = async (doctorId: string, doctorData: Partial<Omit<Doctor, 'id'>>) => {
        if (!clinicId) throw new Error("Not authenticated");
        const docRef = doc(db, 'clinics', clinicId, 'doctors', doctorId);
        
        const currentDoctor = doctors.find(d => d.id === doctorId);
        if (!currentDoctor) throw new Error("Doctor not found");
        
        const updatedData: Partial<Doctor> = {...doctorData};
        if (doctorData.name && doctorData.name !== currentDoctor.name) {
            updatedData.initials = doctorData.name.split(' ').map(n => n[0]).join('').toUpperCase();
            updatedData.avatarUrl = `https://placehold.co/100x100.png?text=${doctorData.name.charAt(0)}`;
        }
        await updateDoc(docRef, updatedData);
    };

    const deleteDoctor = async (doctorId: string) => {
        if (!clinicId) return;
        await deleteDoc(doc(db, 'clinics', clinicId, 'doctors', doctorId));
    };
    
    const addPatient = async (patientData: Omit<Patient, 'id' | 'avatarUrl' | 'history'>): Promise<Patient | undefined> => {
        if (!clinicId) throw new Error("Not authenticated");
        const newPatientData = {
            ...patientData,
            avatarUrl: `https://placehold.co/100x100?text=${patientData.name.charAt(0)}`,
            history: [],
        }
        const docRef = await addDoc(collection(db, 'clinics', clinicId, 'patients'), newPatientData);
        toast({ title: 'Patient Added', description: `${newPatientData.name} has been registered.` });
        return { id: docRef.id, ...newPatientData };
    };
    
    const addPatientToWaitingList = async (patientId: string, doctorId: string) => {
        if (!clinicId) throw new Error("Not authenticated");
        const patient = patients.find(p => p.id === patientId);
        if (!patient) throw new Error("Patient not found");

        const doctor = doctors.find(d => d.id === doctorId);
        if (!doctor) throw new Error("Doctor not found");

        const isPatientActive = waitingList.some(p => p.patientId === patientId && p.status !== 'dispensed');
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
        await addDoc(collection(db, 'clinics', clinicId, 'waitingList'), newWaitingPatientData);
        
        const newHistoryEntry: PatientHistory = {
            date: new Date().toISOString(),
            doctorName: doctor.name,
            notes: 'Added to waiting list for consultation.'
        };
        const updatedHistory = [...patient.history, newHistoryEntry];
        await updateDoc(doc(db, 'clinics', clinicId, 'patients', patientId), { history: updatedHistory });

        toast({ title: 'Added to Waitlist', description: `${patient.name} is now waiting for Dr. ${doctor.name}.` });
    };

    const updatePatientStatus = async (waitingPatientId: string, status: PatientStatus, items: string[] = [], advice?: string) => {
        if (!clinicId) throw new Error("Not authenticated");
        const patientToUpdate = waitingList.find(p => p.id === waitingPatientId);
        if (!patientToUpdate) return;
        
        const updateData: Partial<WaitingPatient> = { status };
        if (advice) {
            updateData.advice = advice;
        }

        await updateDoc(doc(db, 'clinics', clinicId, 'waitingList', waitingPatientId), updateData);

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
            await addDoc(collection(db, 'clinics', clinicId, 'pharmacyQueue'), newPrescriptionData);
            toast({ title: 'Sent to Pharmacy', description: `${patientToUpdate.patientName}'s prescription has been sent.` });
        } else if (status !== 'in_consult') {
             toast({ title: 'Status Updated', description: `${patientToUpdate.patientName}'s status is now ${status.replace(/_/g, ' ')}.`, });
        }
    };
    
    const updatePrescriptionStatus = async (prescriptionId: string, status: PrescriptionStatus) => {
        if (!clinicId) throw new Error("Not authenticated");
        const prescription = pharmacyQueue.find(p => p.id === prescriptionId);
        if (!prescription) return;
        
        await updateDoc(doc(db, 'clinics', clinicId, 'pharmacyQueue', prescriptionId), { status });
        
        if (status === 'dispensed') {
            await updateDoc(doc(db, 'clinics', clinicId, 'waitingList', prescription.waitingPatientId), { status: 'dispensed' });
            toast({ title: 'Patient Processed', description: `${prescription.patientName} has been marked as Done.` });
        }
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
    };

    const contextValue = { 
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
    };

    return (
        <ClinicContext.Provider value={contextValue}>
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
