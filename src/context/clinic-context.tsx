

'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { User, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, addDoc, updateDoc, deleteDoc, query, where, onSnapshot, Unsubscribe, serverTimestamp, Timestamp, writeBatch, getDocs, enableNetwork, disableNetwork } from 'firebase/firestore';
import Papa from 'papaparse';
import { resolveClinicId } from '@/lib/clinicIdentity';


// Types
export type PatientStatus = 'waiting' | 'called' | 'in_consult' | 'prescribed' | 'sent_to_pharmacy' | 'dispensed';
export type PrescriptionStatus = 'pending' | 'dispensed';
export type OnlineStatus = 'online' | 'offline' | 'reconnected';

export interface FirestoreDocument {
    id: string;
}

export interface PatientHistory {
    date: string; // ISO String
    doctorName: string;
    notes: string;
}

export type Patient = {
  id: string;
  name: string;
  phone: string;
  gender: 'Male' | 'Female' | 'Other';
  age: number;
  avatarUrl: string;
  history: PatientHistory[];
};

export type NewPatientData = Omit<Patient, 'id' | 'avatarUrl' | 'history'>;


export interface Doctor extends FirestoreDocument {
    name: string;
    specialization: string;
    avatarUrl: string;
    initials: string;
    pincode: string;
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

export interface BillDetails {
  items: { item: string, price: number }[];
  taxInfo: {
    type: string;
    percentage: number;
    amount: number;
  };
  appointmentFee: number;
  roundOff: number;
  total: number;
}


export interface Prescription extends FirestoreDocument {
  waitingPatientId: string;
  patientName: string;
  doctor: string;
  time: string;
  items: string[];
  status: PrescriptionStatus;
  advice?: string;
  visitDate: string; // YYYY-MM-DD
  billDetails?: BillDetails;
  dueDate?: Timestamp;
}

export interface ClinicSettings {
    clinicName: string;
    clinicAddress: string;
    receiptValidityDays: number;
    currency: string;
    logoUrl?: string;
    logoSvg?: string;
    taxType: string;
    taxPercentage: number;
    appointmentFee: number;
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
    authLoading: boolean;
    clinicId: string | null;
    onlineStatus: OnlineStatus;
    login: (email: string, password: string) => Promise<User | null>;
    signup: (username: string, password: string) => Promise<User | null>;
    logout: () => Promise<void>;
    addPatient: (patient: NewPatientData) => Promise<void>;
    getPatientById: (patientId: string) => Promise<Patient | null>;
    addPatientToWaitingList: (patient: Patient, doctorId: string) => void;
    updatePatientStatus: (waitingPatientId: string, status: PatientStatus, items?: string[], advice?: string) => void;
    updatePrescriptionStatus: (prescriptionId: string, status: PrescriptionStatus, billDetails?: BillDetails, dueDate?: Date) => void;
    addDoctor: (doctor: Omit<Doctor, 'id' | 'initials' | 'avatarUrl' | 'pincode'>) => Promise<void>;
    updateDoctor: (doctorId: string, doctorData: Partial<Omit<Doctor, 'id' | 'initials' | 'avatarUrl'>>) => void;
    verifyDoctorPincode: (doctorId: string, pincode: string) => Promise<boolean>;
    deleteDoctor: (doctorId: string) => void;
    dismissNotification: (id: number) => void;
    updateSettings: (newSettings: Partial<ClinicSettings>) => void;
    exportDoctorsToCSV: () => Promise<void>;
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
    const [authLoading, setAuthLoading] = useState(true);
    const [onlineStatus, setOnlineStatus] = useState<OnlineStatus>('online');
    
    // Listen to browser online/offline events
    useEffect(() => {
        const handleOnline = () => {
            enableNetwork(db);
            setOnlineStatus('reconnected');
            setTimeout(() => setOnlineStatus('online'), 3000);
        };
        const handleOffline = () => {
            disableNetwork(db);
            setOnlineStatus('offline');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Check initial status
        if (!navigator.onLine) {
            handleOffline();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);


    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            setAuthLoading(true);
            if (currentUser) {
                setUser(currentUser);
                const resolvedId = await resolveClinicId(auth, db);
                setClinicId(resolvedId);
            } else {
                setUser(null);
                setClinicId(null);
                setPatients([]);
                setDoctors([]);
                setWaitingList([]);
                setPharmacyQueue([]);
                setSettings(null);
            }
             setAuthLoading(false);
        });
        return () => unsubscribeAuth();
    }, []);
    

    useEffect(() => {
        if (!clinicId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        
        const listeners: Unsubscribe[] = [];
        const todayStr = new Date().toISOString().split('T')[0];

        try {
            const settingsUnsub = onSnapshot(doc(db, 'clinics', clinicId), (snapshot) => {
                if (snapshot.exists()) {
                    setSettings(snapshot.data() as ClinicSettings);
                }
            }, (error) => {
                console.error("Error fetching settings:", error);
                toast({ title: 'Error', description: 'Could not load clinic settings.', variant: 'destructive'});
            });
            listeners.push(settingsUnsub);
            
            const patientsUnsub = onSnapshot(collection(db, 'clinics', clinicId, 'patients'), (snapshot) => {
                const patientsData = snapshot.docs.map(p => ({ id: p.id, ...p.data() } as Patient));
                setPatients(patientsData);
            }, (error) => {
                console.error("Error fetching patients:", error);
                toast({ title: 'Error', description: 'Could not load patient list.', variant: 'destructive'});
            });
            listeners.push(patientsUnsub);

            const doctorsUnsub = onSnapshot(collection(db, 'clinics', clinicId, 'doctors'), (snapshot) => {
                const doctorsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Doctor));
                setDoctors(doctorsData);
            }, (error) => {
                console.error("Error fetching doctors:", error);
                toast({ title: 'Error', description: 'Could not load doctor list.', variant: 'destructive'});
            });
            listeners.push(doctorsUnsub);

            const waitingListQuery = query(collection(db, 'clinics', clinicId, 'waitingList'), where('visitDate', '==', todayStr));
            const waitingListUnsub = onSnapshot(waitingListQuery, (snapshot) => {
                const waitingListData = snapshot.docs.map(wl => ({ id: wl.id, ...wl.data() } as WaitingPatient));
                setWaitingList(waitingListData);
            }, (error) => {
                console.error("Error fetching waiting list:", error);
                toast({ title: 'Real-time Error', description: 'Could not get waiting list updates.', variant: 'destructive'});
            });
            listeners.push(waitingListUnsub);

            const pharmacyQuery = query(collection(db, 'clinics', clinicId, 'pharmacyQueue'), where('visitDate', '==', todayStr));
            const pharmacyUnsub = onSnapshot(pharmacyQuery, (snapshot) => {
                const pharmacyData = snapshot.docs.map(pq => ({ id: pq.id, ...pq.data() } as Prescription));
                setPharmacyQueue(pharmacyData);
            }, (error) => {
                console.error("Error fetching pharmacy queue:", error);
                toast({ title: 'Real-time Error', description: 'Could not get pharmacy queue updates.', variant: 'destructive'});
            });
            listeners.push(pharmacyUnsub);

        } catch (error) {
            console.error("Failed to subscribe to clinic data:", error);
            toast({ title: 'Error', description: 'Could not load your clinic data.', variant: 'destructive'});
        } finally {
            setLoading(false);
        }

        return () => {
            listeners.forEach(unsub => unsub());
        };
    }, [clinicId, toast]);
    
    // AUTH FUNCTIONS
    const signup = async (username: string, password: string): Promise<User | null> => {
        const email = `${username.trim()}@medichain.app`;
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;

        // Create clinic document with user's UID as the ID
        const clinicRef = doc(db, 'clinics', newUser.uid);
        const defaultSettings: ClinicSettings = {
            clinicName: `${username}'s Clinic`,
            clinicAddress: '123 Health St, Medville',
            receiptValidityDays: 30,
            currency: '₹',
            taxType: 'GST',
            taxPercentage: 5,
            appointmentFee: 100,
            logoSvg: `<svg width="150" height="50" viewBox="0 0 150 50" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="150" height="50" rx="8" fill="hsl(210 40% 60%)"/>
<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="PT Sans, sans-serif" font-size="20" fill="white" font-weight="bold">
MediChain
</text>
</svg>
`
        };
        await setDoc(clinicRef, defaultSettings);
        return newUser;
    };

    const login = async (email: string, password: string): Promise<User | null> => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    };

    const logout = async () => {
        await signOut(auth);
    };
    
    const getPatientById = async (patientId: string): Promise<Patient | null> => {
        if (!clinicId) return null;
        try {
            const patientRef = doc(db, 'clinics', clinicId, 'patients', patientId);
            const patientSnap = await getDoc(patientRef);
            if (patientSnap.exists()) {
                return { id: patientSnap.id, ...patientSnap.data() } as Patient;
            }
            return null;
        } catch (error) {
            console.error("Error fetching patient by ID:", error);
            toast({ title: 'Database Error', description: "Could not fetch patient's details.", variant: 'destructive' });
            return null;
        }
    };
    
    // DATA FUNCTIONS
    const addDoctor = async (doctorData: Omit<Doctor, 'id' | 'initials' | 'avatarUrl' | 'pincode'>) => {
        if (!clinicId) return;
         const newDoctorData = {
          ...doctorData,
          pincode: '1111',
          initials: doctorData.name.split(' ').map(n => n[0]).join('').toUpperCase(),
          avatarUrl: `https://placehold.co/100x100.png?text=${doctorData.name.charAt(0)}`,
        }
        await addDoc(collection(db, 'clinics', clinicId, 'doctors'), newDoctorData);
    };
    
    const updateDoctor = (doctorId: string, doctorData: Partial<Omit<Doctor, 'id' | 'avatarUrl' | 'initials'>>) => {
        if (!clinicId) return;
        const docRef = doc(db, 'clinics', clinicId, 'doctors', doctorId);
     
        const currentDoctor = doctors.find(d => d.id === doctorId);
        if (!currentDoctor) throw new Error("Doctor not found");
        
        const updatedData: Partial<Doctor> = {...doctorData};
        if (doctorData.name && doctorData.name !== currentDoctor.name) {
            updatedData.initials = doctorData.name.split(' ').map(n => n[0]).join('').toUpperCase();
            updatedData.avatarUrl = `https://placehold.co/100x100.png?text=${doctorData.name.charAt(0)}`;
        }
        updateDoc(docRef, updatedData);
    };
    
    const verifyDoctorPincode = async (doctorId: string, pincode: string): Promise<boolean> => {
        if (!clinicId) return false;
        try {
            const docRef = doc(db, 'clinics', clinicId, 'doctors', doctorId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const doctor = docSnap.data() as Doctor;
                return doctor.pincode === pincode;
            }
            return false;
        } catch (error) {
            console.error('Error verifying PIN:', error);
            return false;
        }
    };

    const deleteDoctor = (doctorId: string) => {
        if (!clinicId) return;
        deleteDoc(doc(db, 'clinics', clinicId, 'doctors', doctorId));
    };
    
    const addPatient = async (patientData: NewPatientData) => {
        if (!clinicId) return;
        const newPatientData = {
            ...patientData,
            avatarUrl: `https://placehold.co/100x100?text=${patientData.name.charAt(0)}`,
            history: [],
        }
        const docRef = await addDoc(collection(db, 'clinics', clinicId, 'patients'), newPatientData);
        toast({ title: 'Patient Added', description: `${newPatientData.name} has been registered.` });
    };
    
    const addPatientToWaitingList = async (patient: Patient, doctorId: string) => {
        if (!clinicId || !patient || !patient.id) return;

        const doctor = doctors.find(d => d.id === doctorId);
        if (!doctor) return;

        const isPatientActive = waitingList.some(p => p.patientId === patient.id && p.status !== 'dispensed');
        if (isPatientActive) {
            toast({ title: 'Already Waiting', description: `${patient.name} is still in the active clinic queue.`, variant: 'destructive' });
            return;
        }

        const newWaitingPatientData: Omit<WaitingPatient, 'id'> = {
            patientId: patient.id,
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
        
        const batch = writeBatch(db);
        
        const waitingListRef = doc(collection(db, 'clinics', clinicId, 'waitingList'));
        batch.set(waitingListRef, newWaitingPatientData);
        
        const newHistoryEntry: PatientHistory = {
            date: new Date().toISOString(),
            doctorName: doctor.name,
            notes: 'Added to waiting list for consultation.'
        };
        const patientRef = doc(db, 'clinics', clinicId, 'patients', patient.id);
        const patientDoc = await getDoc(patientRef);
        const existingPatientData = patientDoc.data() as Patient;
        const updatedHistory = [...(existingPatientData.history || []), newHistoryEntry];
        batch.update(patientRef, { history: updatedHistory });

        await batch.commit();

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

        const waitingListRef = doc(db, 'clinics', clinicId, 'waitingList', waitingPatientId);
        updateDoc(waitingListRef, updateData);

        if (status === 'called') {
            addNotification(`Dr. ${patientToUpdate.doctorName} is calling for ${patientToUpdate.patientName}.`);
        }
        
        if (status === 'sent_to_pharmacy') {
            // Create prescription
            const newPrescriptionData: Omit<Prescription, 'id'> = {
                waitingPatientId: waitingPatientId,
                patientName: patientToUpdate.patientName,
                doctor: patientToUpdate.doctorName,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                items,
                advice,
                status: 'pending',
                visitDate: new Date().toISOString().split('T')[0],
            };
            addDoc(collection(db, 'clinics', clinicId, 'pharmacyQueue'), newPrescriptionData);
            
            // Add consultation details to patient history
            const batch = writeBatch(db);
            const patientRef = doc(db, 'clinics', clinicId, 'patients', patientToUpdate.patientId);
            const patientDoc = await getDoc(patientRef);
            if (patientDoc.exists()) {
                const historyNote = `Consultation complete. Prescription: ${items.join(', ')}. ${advice ? `Advice: ${advice}` : ''}`;
                const newHistoryEntry: PatientHistory = {
                    date: new Date().toISOString(),
                    doctorName: patientToUpdate.doctorName,
                    notes: historyNote
                };
                const existingPatientData = patientDoc.data() as Patient;
                const updatedHistory = [...(existingPatientData.history || []), newHistoryEntry];
                batch.update(patientRef, { history: updatedHistory });
                await batch.commit();
            }
            
            toast({ title: 'Sent to Pharmacy', description: `${patientToUpdate.patientName}'s prescription has been sent.` });
        } else if (status !== 'in_consult') {
            toast({ title: 'Status Updated', description: `${patientToUpdate.patientName}'s status is now ${status.replace(/_/g, ' ')}.`, });
        }
    };
    
    const updatePrescriptionStatus = async (prescriptionId: string, status: PrescriptionStatus, billDetails?: BillDetails, dueDate?: Date) => {
        if (!clinicId) return;
        const prescriptionRef = doc(db, 'clinics', clinicId, 'pharmacyQueue', prescriptionId);
        const prescriptionDoc = await getDoc(prescriptionRef);

        if (!prescriptionDoc.exists()) return;
        const prescription = prescriptionDoc.data() as Prescription;
        
        const updateData: Partial<Prescription> = { status };
        if (billDetails) {
            updateData.billDetails = billDetails;
        }
        if (dueDate) {
            updateData.dueDate = Timestamp.fromDate(dueDate);
        }

        await updateDoc(prescriptionRef, updateData);
        
        if (status === 'dispensed') {
            const waitingPatientRef = doc(db, 'clinics', clinicId, 'waitingList', prescription.waitingPatientId);
            await updateDoc(waitingPatientRef, { status: 'dispensed' });
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
    
     const updateSettings = (newSettings: Partial<ClinicSettings>) => {
        if (!clinicId) return;
        const settingsRef = doc(db, 'clinics', clinicId);
        updateDoc(settingsRef, newSettings);
    };

    const exportDoctorsToCSV = async () => {
      if (doctors.length === 0) {
        toast({
          title: 'No Data',
          description: `There is no data to export for doctors.`,
        });
        return;
      }
      const csv = Papa.unparse(doctors);
      const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'doctors.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const contextValue = { 
        user,
        patients,
        doctors, 
        waitingList, 
        pharmacyQueue: pharmacyQueue.filter(p => p.status === 'pending'), 
        notifications,
        settings,
        loading,
        authLoading,
        clinicId,
        onlineStatus,
        login,
        signup,
        logout,
        addPatient,
        getPatientById,
        addPatientToWaitingList,
        updatePatientStatus,
        updatePrescriptionStatus,
        addDoctor,
        updateDoctor,
        verifyDoctorPincode,
        deleteDoctor,
        dismissNotification,
        updateSettings,
        exportDoctorsToCSV,
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

    