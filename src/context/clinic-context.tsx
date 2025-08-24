
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

// Types
export type PatientStatus = 'waiting' | 'called' | 'in_consult' | 'prescribed' | 'sent_to_pharmacy' | 'dispensed';
export type PrescriptionStatus = 'pending' | 'dispensed';
export type RegistrationType = 'Added' | 'Renewed' | 'Continued';

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

const CLINIC_ID = 'default-clinic'; // This can be dynamic in a real multi-tenant app

// Helper function to get data from localStorage
const getFromLocalStorage = <T>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
};

// Helper function to set data to localStorage
const setInLocalStorage = <T>(key: string, value: T) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, JSON.stringify(value));
};


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
    addDoctor: (doctor: Omit<Doctor, 'id'>) => Promise<Doctor | undefined>;
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

    // Load initial data from localStorage
    useEffect(() => {
        setLoading(true);
        const todayStr = new Date().toISOString().split('T')[0];

        const storedPatients = getFromLocalStorage<Patient[]>(`${CLINIC_ID}_patients`, []);
        const storedDoctors = getFromLocalStorage<Doctor[]>(`${CLINIC_ID}_doctors`, []);
        const storedWaitingList = getFromLocalStorage<WaitingPatient[]>(`${CLINIC_ID}_waitingList`, []).filter(p => p.visitDate === todayStr);
        const storedPharmacyQueue = getFromLocalStorage<Prescription[]>(`${CLINIC_ID}_pharmacyQueue`, []);
        
        setPatients(storedPatients);
        setDoctors(storedDoctors);
        setWaitingList(storedWaitingList);
        setPharmacyQueue(storedPharmacyQueue);

        setLoading(false);
    }, []);

    const saveData = (key: 'patients' | 'doctors' | 'waitingList' | 'pharmacyQueue', data: any) => {
        const fullKey = `${CLINIC_ID}_${key}`;
        setInLocalStorage(fullKey, data);
        switch(key) {
            case 'patients': setPatients(data); break;
            case 'doctors': setDoctors(data); break;
            case 'waitingList': setWaitingList(data); break;
            case 'pharmacyQueue': setPharmacyQueue(data); break;
        }
    }
    
    const addDoctor = async (doctorData: Omit<Doctor, 'id'>): Promise<Doctor | undefined> => {
        const newDoctor: Doctor = {
            id: `doc_${Date.now()}`,
            ...doctorData
        };
        const updatedDoctors = [...doctors, newDoctor];
        saveData('doctors', updatedDoctors);
        return newDoctor;
    };
    
    const updateDoctor = async (doctorId: string, doctorData: Partial<Omit<Doctor, 'id'>>) => {
        const updatedDoctors = doctors.map(doc => doc.id === doctorId ? {...doc, ...doctorData} : doc);
        saveData('doctors', updatedDoctors);
    };

    const deleteDoctor = async (doctorId: string) => {
        const updatedDoctors = doctors.filter(doc => doc.id !== doctorId);
        saveData('doctors', updatedDoctors);
    };
    
    const addPatient = async (patientData: Omit<Patient, 'id' | 'lastVisit' | 'avatarUrl' | 'registrationType'>): Promise<Patient | undefined> => {
        try {
            const newPatient: Patient = {
                id: `pat_${Date.now()}`,
                ...patientData,
                lastVisit: new Date().toISOString(),
                avatarUrl: `https://placehold.co/100x100?text=${patientData.name.charAt(0)}`,
                registrationType: 'Added',
            };
            const updatedPatients = [...patients, newPatient];
            saveData('patients', updatedPatients);
            toast({
                title: 'Patient Added',
                description: `${patientData.name} has been registered.`
            });
            return newPatient;
        } catch (error) {
            console.error("Error adding patient: ", error);
            toast({ title: "Error", description: "Failed to add patient.", variant: "destructive" });
            return undefined;
        }
    };
    

    const addPatientToWaitingList = async (patientId: string, doctorId: string) => {
        const patient = patients.find(p => p.id === patientId);
        const doctor = doctors.find(d => d.id === doctorId);

        if (patient && doctor) {
            if (waitingList.some(p => p.patientId === patientId && p.status !== 'dispensed')) {
                toast({ title: 'Already Waiting', description: `${patient.name} is already in the waiting list.`, variant: 'destructive' });
                return;
            }
             const newWaitingPatient: WaitingPatient = {
                id: `wait_${Date.now()}`,
                patientId,
                patientName: patient.name,
                gender: patient.gender,
                age: patient.age,
                avatarUrl: patient.avatarUrl,
                doctorId,
                doctorName: doctor.name,
                status: 'waiting',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                visitDate: new Date().toISOString().split('T')[0],
            };
            const updatedWaitingList = [...waitingList, newWaitingPatient];
            saveData('waitingList', updatedWaitingList);
            toast({
                title: 'Added to Waitlist',
                description: `${patient.name} is now waiting for Dr. ${doctor.name}.`
            });
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
        
        let newWaitingList = [...waitingList];

        // Handle "consulted" status for previous patient when a new one is called
        if (status === 'in_consult') {
            const previousPatientIndex = newWaitingList.findIndex(p => p.status === 'in_consult' && p.doctorId === patientToUpdate.doctorId);
            if (previousPatientIndex > -1 && newWaitingList[previousPatientIndex].id !== waitingPatientId) {
                newWaitingList[previousPatientIndex].status = 'prescribed';
                toast({
                    title: 'Status Updated',
                    description: `${newWaitingList[previousPatientIndex].patientName}'s status is now 'Consulted'.`,
                });
            }
        }
        
        const currentPatientIndex = newWaitingList.findIndex(p => p.id === waitingPatientId);
        if (currentPatientIndex > -1) {
            newWaitingList[currentPatientIndex].status = status;
        }

        saveData('waitingList', newWaitingList);

        if (status === 'called') {
            addNotification(`Dr. ${patientToUpdate.doctorName} is calling for ${patientToUpdate.patientName}.`);
        }
        
        if (status === 'sent_to_pharmacy') {
            const newPrescription: Prescription = {
                id: `presc_${Date.now()}`,
                patientName: patientToUpdate.patientName,
                doctor: patientToUpdate.doctorName,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                items,
                status: 'pending',
            };
            saveData('pharmacyQueue', [...pharmacyQueue, newPrescription]);
            toast({ title: 'Sent to Pharmacy', description: `${patientToUpdate.patientName}'s prescription has been sent.` });
        } else {
             toast({
                title: 'Status Updated',
                description: `${patientToUpdate.patientName}'s status is now ${status.replace(/_/g, ' ')}.`,
            });
        }
    };

    const updatePatientRegistration = async (patientId: string, type: RegistrationType) => {
        const patient = patients.find(p => p.id === patientId);
        if (!patient) return;
        
        const updatedPatients = patients.map(p => 
            p.id === patientId 
            ? { ...p, registrationType: type, lastVisit: new Date().toISOString() } 
            : p
        );
        saveData('patients', updatedPatients);
        toast({
            title: 'Patient Updated',
            description: `${patient.name} has been marked as ${type}.`
        });
    }
    
    const updatePrescriptionStatus = async (prescriptionId: string, status: PrescriptionStatus) => {
        const prescription = pharmacyQueue.find(p => p.id === prescriptionId);
        if (!prescription) return;
        
        const updatedQueue = pharmacyQueue.map(p => p.id === prescriptionId ? { ...p, status } : p);
        saveData('pharmacyQueue', updatedQueue);
        
        if (status === 'dispensed') {
            const waitingPatientToEnd = waitingList.find(p => p.patientName === prescription.patientName && p.status !== 'dispensed');
            if (waitingPatientToEnd) {
                const updatedWaitingList = waitingList.map(p => p.id === waitingPatientToEnd.id ? { ...p, status: 'dispensed'} : p);
                saveData('waitingList', updatedWaitingList);
            }
             toast({ title: 'Patient Processed', description: `${prescription.patientName} has been marked as Done.` });
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
