
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { 
    collection, 
    onSnapshot, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc,
    query,
    where,
    writeBatch,
    Timestamp,
    getDocs
} from 'firebase/firestore';

// Types
export type PatientStatus = 'waiting' | 'called' | 'in_consult' | 'prescribed' | 'sent_to_pharmacy' | 'dispensed';
export type PrescriptionStatus = 'pending' | 'dispensed';
export type RegistrationType = 'Added' | 'Renewed' | 'Continued';

// Firestore documents will have an `id` field.
export interface FirestoreDocument {
    id: string;
}

export interface Patient extends FirestoreDocument {
    name: string;
    phone: string;
    gender: 'Male' | 'Female' | 'Other';
    age: number;
    lastVisit: string; // Storing as ISO string
    avatarUrl: string;
    registrationType: RegistrationType;
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
}

export interface Prescription extends FirestoreDocument {
  patientName: string;
  doctor: string;
  time: string;
  items: string[];
  status: PrescriptionStatus;
}


type Notification = {
    id: number;
    message: string;
};

// This will be used to scope all data to a specific clinic.
// In a multi-tenant app, this would be determined by user authentication.
const CLINIC_ID = 'default-clinic';

// Context
interface ClinicContextType {
    patients: Patient[];
    doctors: Doctor[];
    waitingList: WaitingPatient[];
    pharmacyQueue: Prescription[];
    activePatient: WaitingPatient | undefined;
    notifications: Notification[];
    receiptValidityDays: number;
    loading: boolean;
    addPatient: (patient: Omit<Patient, 'id' | 'lastVisit' | 'avatarUrl' | 'registrationType'>) => Promise<Patient | undefined>;
    addPatientToWaitingList: (patientId: string, doctorId: string) => void;
    updatePatientStatus: (waitingPatientId: string, status: PatientStatus, items?: string[]) => void;
    updatePatientRegistration: (patientId: string, type: RegistrationType) => void;
    updatePrescriptionStatus: (prescriptionId: string, status: PrescriptionStatus) => void;
    addDoctor: (doctor: Omit<Doctor, 'id'>) => Promise<void>;
    updateDoctor: (doctorId: string, doctorData: Partial<Omit<Doctor, 'id'>>) => Promise<void>;
    deleteDoctor: (doctorId: string) => Promise<void>;
    setActivePatientId: (patientId: string | null) => void;
    dismissNotification: (id: number) => void;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const ClinicProvider = ({ children }: { children: ReactNode }) => {
    const { toast } = useToast();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [waitingList, setWaitingList] = useState<WaitingPatient[]>([]);
    const [pharmacyQueue, setPharmacyQueue] = useState<Prescription[]>([]);
    const [activePatientId, setActivePatientId] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [receiptValidityDays, setReceiptValidityDays] = useState(30);
    const [loading, setLoading] = useState(true);

    const activePatient = waitingList.find(p => p.id === activePatientId);
    
    // --- Firestore Listeners ---
    useEffect(() => {
        setLoading(true);
        const todayStr = new Date().toISOString().split('T')[0];

        const collectionsToFetch = [
            collection(db, 'clinics', CLINIC_ID, 'patients'),
            collection(db, 'clinics', CLINIC_ID, 'doctors'),
            query(collection(db, 'clinics', CLINIC_ID, 'waitingList'), where('visitDate', '==', todayStr)),
            collection(db, 'clinics', CLINIC_ID, 'pharmacyQueue'),
        ];
        
        // Fetch initial data to set loading state correctly
        const fetchInitialData = async () => {
            try {
                const initialSnapshots = await Promise.all(collectionsToFetch.map(coll => getDocs(coll)));
                // We can set initial data here if needed, but for now, just waiting is enough
            } catch (error) {
                console.error("Error fetching initial data:", error);
                toast({ title: "Error", description: "Could not load clinic data.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();

        const unsubscribes = [
            onSnapshot(collection(db, 'clinics', CLINIC_ID, 'patients'), (snapshot) => {
                const patientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
                setPatients(patientsData);
            }),
            onSnapshot(collection(db, 'clinics', CLINIC_ID, 'doctors'), (snapshot) => {
                const doctorsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Doctor));
                setDoctors(doctorsData);
            }),
            onSnapshot(query(collection(db, 'clinics', CLINIC_ID, 'waitingList'), where('visitDate', '==', todayStr)), (snapshot) => {
                const waitingListData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WaitingPatient));
                setWaitingList(waitingListData);
            }),
             onSnapshot(collection(db, 'clinics', CLINIC_ID, 'pharmacyQueue'), (snapshot) => {
                const pharmacyQueueData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prescription));
                setPharmacyQueue(pharmacyQueueData);
            }),
        ];

        return () => unsubscribes.forEach(unsub => unsub());
    }, [toast]);


    const addDoctor = async (doctorData: Omit<Doctor, 'id'>) => {
        await addDoc(collection(db, 'clinics', CLINIC_ID, 'doctors'), doctorData);
    };
    
    const updateDoctor = async (doctorId: string, doctorData: Partial<Omit<Doctor, 'id'>>) => {
        const doctorDocRef = doc(db, 'clinics', CLINIC_ID, 'doctors', doctorId);
        await updateDoc(doctorDocRef, doctorData);
    };

    const deleteDoctor = async (doctorId: string) => {
        await deleteDoc(doc(db, 'clinics', CLINIC_ID, 'doctors', doctorId));
    };
    
    const addPatient = async (patientData: Omit<Patient, 'id' | 'lastVisit' | 'avatarUrl' | 'registrationType'>): Promise<Patient | undefined> => {
        try {
            const newPatientData = {
                ...patientData,
                lastVisit: new Date().toISOString(),
                avatarUrl: `https://placehold.co/100x100?text=${patientData.name.charAt(0)}`,
                registrationType: 'Added' as RegistrationType,
            };
            const docRef = await addDoc(collection(db, 'clinics', CLINIC_ID, 'patients'), newPatientData);
            toast({
                title: 'Patient Added',
                description: `${patientData.name} has been registered.`
            });
            return { id: docRef.id, ...newPatientData };
        } catch (error) {
            console.error("Error adding patient: ", error);
            toast({ title: "Error", description: "Failed to add patient.", variant: "destructive" });
            return undefined;
        }
    };
    

    const addPatientToWaitingList = async (patientId: string, doctorId: string) => {
        const patient = patients.find(p => p.id === patientId);
        const doctor = doctors.find(d => d.id === doctorId);
        const todayStr = new Date().toISOString().split('T')[0];

        if (patient && doctor) {
            if (waitingList.some(p => p.patientId === patientId && p.status !== 'dispensed')) {
                toast({ title: 'Already Waiting', description: `${patient.name} is already in the waiting list.`, variant: 'destructive' });
                return;
            }
             const newWaitingPatient: Omit<WaitingPatient, 'id'> = {
                patientId,
                patientName: patient.name,
                gender: patient.gender,
                age: patient.age,
                avatarUrl: patient.avatarUrl,
                doctorId,
                doctorName: doctor.name,
                status: 'waiting',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                visitDate: todayStr,
            };
            try {
                await addDoc(collection(db, 'clinics', CLINIC_ID, 'waitingList'), newWaitingPatient);
                 toast({
                    title: 'Added to Waitlist',
                    description: `${patient.name} is now waiting for Dr. ${doctor.name}.`
                });
            } catch (error) {
                console.error("Error adding to waiting list: ", error);
                toast({ title: "Error", description: "Failed to add to waiting list.", variant: "destructive" });
            }
        }
    };
    
    const addNotification = (message: string) => {
        const newNotification = { id: Date.now(), message };
        setNotifications(prev => [...prev, newNotification]);
    }
    
    const dismissNotification = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }

    const updatePatientStatus = async (waitingPatientId: string, status: PatientStatus, items: string[] = []) => {
        const patientToUpdate = waitingList.find(p => p.id === waitingPatientId);
        if (!patientToUpdate) return;
        
        try {
            const batch = writeBatch(db);
            const patientDocRef = doc(db, 'clinics', CLINIC_ID, 'waitingList', waitingPatientId);
            batch.update(patientDocRef, { status });

            // Handle "consulted" status for previous patient when a new one is called
            if (status === 'in_consult') {
                const previousPatient = waitingList.find(p => p.status === 'in_consult' && p.doctorId === patientToUpdate.doctorId);
                if (previousPatient && previousPatient.id !== waitingPatientId) {
                    const prevPatientDocRef = doc(db, 'clinics', CLINIC_ID, 'waitingList', previousPatient.id);
                    batch.update(prevPatientDocRef, { status: 'prescribed' });
                    toast({
                        title: 'Status Updated',
                        description: `${previousPatient.patientName}'s status is now 'Consulted'.`,
                    });
                }
            }
            
            await batch.commit();

            if (status === 'called') {
                addNotification(`Dr. ${patientToUpdate.doctorName} is calling for ${patientToUpdate.patientName}.`);
            }
            
            if (status === 'sent_to_pharmacy') {
                const newPrescriptionData = {
                    patientName: patientToUpdate.patientName,
                    doctor: patientToUpdate.doctorName,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    items,
                    status: 'pending',
                };
                await addDoc(collection(db, 'clinics', CLINIC_ID, 'pharmacyQueue'), newPrescriptionData);
                toast({ title: 'Sent to Pharmacy', description: `${patientToUpdate.patientName}'s prescription has been sent.` });
            } else {
                 toast({
                    title: 'Status Updated',
                    description: `${patientToUpdate.patientName}'s status is now ${status.replace(/_/g, ' ')}.`,
                });
            }
        } catch (error) {
            console.error("Error updating patient status: ", error);
            toast({ title: "Error", description: "Failed to update patient status.", variant: "destructive" });
        }
    };

    const updatePatientRegistration = async (patientId: string, type: RegistrationType) => {
        const patient = patients.find(p => p.id === patientId);
        if (!patient) return;
        try {
            const patientDocRef = doc(db, 'clinics', CLINIC_ID, 'patients', patientId);
            await updateDoc(patientDocRef, { 
                registrationType: type, 
                lastVisit: new Date().toISOString() 
            });
            toast({
                title: 'Patient Updated',
                description: `${patient.name} has been marked as ${type}.`
            });
        } catch (error) {
            console.error("Error updating patient registration: ", error);
            toast({ title: "Error", description: "Failed to update patient registration.", variant: "destructive" });
        }
    }
    
    const updatePrescriptionStatus = async (prescriptionId: string, status: PrescriptionStatus) => {
        const prescription = pharmacyQueue.find(p => p.id === prescriptionId);
        if (!prescription) return;
        
        try {
            const batch = writeBatch(db);
            const prescriptionDocRef = doc(db, 'clinics', CLINIC_ID, 'pharmacyQueue', prescriptionId);
            batch.update(prescriptionDocRef, { status });

            if (status === 'dispensed') {
                const waitingPatientToEnd = waitingList.find(p => p.patientName === prescription.patientName && p.status !== 'dispensed');
                if (waitingPatientToEnd) {
                    const waitingPatientDocRef = doc(db, 'clinics', CLINIC_ID, 'waitingList', waitingPatientToEnd.id);
                    batch.update(waitingPatientDocRef, { status: 'dispensed' });
                }
                 toast({ title: 'Patient Processed', description: `${prescription.patientName} has been marked as Done.` });
            }
             await batch.commit();

        } catch (error) {
            console.error("Error updating prescription status: ", error);
            toast({ title: "Error", description: "Failed to update prescription status.", variant: "destructive" });
        }
    };

    return (
        <ClinicContext.Provider value={{ 
            patients, 
            doctors, 
            waitingList, 
            pharmacyQueue, 
            activePatient,
            notifications,
            receiptValidityDays,
            loading,
            addPatient,
            addPatientToWaitingList,
            updatePatientStatus,
            updatePatientRegistration,
            updatePrescriptionStatus,
            addDoctor,
            updateDoctor,
            deleteDoctor,
            setActivePatientId,
            dismissNotification
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
