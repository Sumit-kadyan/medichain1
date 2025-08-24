
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

// Types
export type PatientStatus = 'waiting' | 'called' | 'in_consult' | 'prescribed' | 'sent_to_pharmacy' | 'dispensed';
export type PrescriptionStatus = 'pending' | 'dispensed';

export interface FirestoreDocument {
    id: string;
}

export interface Patient extends FirestoreDocument {
    name: string;
    phone: string;
    gender: 'Male' | 'Female' | 'Other';
    age: number;
    avatarUrl: string;
    doctorId: string;
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

const CLINIC_ID = 'default-clinic'; // This can be dynamic in a real multi-tenant app

// Helper function to get data from localStorage
const getFromLocalStorage = <T>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    const item = window.localStorage.getItem(key);
    try {
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.error(`Failed to parse localStorage item ${key}:`, e);
        return defaultValue;
    }
};

// Helper function to set data to localStorage
const setInLocalStorage = <T>(key: string, value: T) => {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error(`Failed to set localStorage item ${key}:`, e);
    }
};


interface ClinicContextType {
    patients: Patient[];
    doctors: Doctor[];
    waitingList: WaitingPatient[];
    pharmacyQueue: Prescription[];
    notifications: Notification[];
    settings: ClinicSettings;
    loading: boolean;
    addPatient: (patient: Omit<Patient, 'id' | 'avatarUrl'>) => Promise<Patient | undefined>;
    addPatientToWaitingList: (patientId: string) => void;
    updatePatientStatus: (waitingPatientId: string, status: PatientStatus, items?: string[], advice?: string) => void;
    updatePrescriptionStatus: (prescriptionId: string, status: PrescriptionStatus) => void;
    addDoctor: (doctor: Omit<Doctor, 'id'>) => Promise<Doctor | undefined>;
    updateDoctor: (doctorId: string, doctorData: Partial<Omit<Doctor, 'id'>>) => Promise<void>;
    deleteDoctor: (doctorId: string) => Promise<void>;
    dismissNotification: (id: number) => void;
    updateSettings: (newSettings: Partial<ClinicSettings>) => void;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const ClinicProvider = ({ children }: { children: ReactNode }) => {
    const { toast } = useToast();
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

    // Load initial data from localStorage
    useEffect(() => {
        setLoading(true);
        const todayStr = new Date().toISOString().split('T')[0];

        const storedPatients = getFromLocalStorage<Patient[]>(`${CLINIC_ID}_patients`, []);
        const storedDoctors = getFromLocalStorage<Doctor[]>(`${CLINIC_ID}_doctors`, []);
        const storedWaitingList = getFromLocalStorage<WaitingPatient[]>(`${CLINIC_ID}_waitingList`, []).filter(p => p.visitDate === todayStr);
        const storedPharmacyQueue = getFromLocalStorage<Prescription[]>(`${CLINIC_ID}_pharmacyQueue`, []).filter(p => storedWaitingList.some(wp => wp.id === p.waitingPatientId));
        const storedSettings = getFromLocalStorage<ClinicSettings>(`${CLINIC_ID}_settings`, settings);
        
        setPatients(storedPatients);
        setDoctors(storedDoctors);
        setWaitingList(storedWaitingList);
        setPharmacyQueue(storedPharmacyQueue);
        setSettings(storedSettings);

        setLoading(false);
    }, []);

    const saveData = <K extends keyof Omit<ClinicContextType, 'loading' | 'notifications' | 'addPatient' | 'addPatientToWaitingList' | 'updatePatientStatus' | 'updatePrescriptionStatus' | 'addDoctor' | 'updateDoctor' | 'deleteDoctor' | 'dismissNotification' | 'updateSettings' >>(key: K, data: any) => {
        const fullKey = `${CLINIC_ID}_${String(key)}`;
        setInLocalStorage(fullKey, data);
        
        switch(key) {
            case 'patients': setPatients(data as Patient[]); break;
            case 'doctors': setDoctors(data as Doctor[]); break;
            case 'waitingList': setWaitingList(data as WaitingPatient[]); break;
            case 'pharmacyQueue': setPharmacyQueue(data as Prescription[]); break;
            case 'settings': setSettings(data as ClinicSettings); break;
        }
    }

     const updateSettings = (newSettings: Partial<ClinicSettings>) => {
        const updatedSettings = { ...settings, ...newSettings };
        saveData('settings', updatedSettings);
    };
    
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
    
    const addPatient = async (patientData: Omit<Patient, 'id' | 'avatarUrl'>): Promise<Patient | undefined> => {
        try {
            const newPatient: Patient = {
                id: `pat_${Date.now()}`,
                ...patientData,
                avatarUrl: `https://placehold.co/100x100?text=${patientData.name.charAt(0)}`,
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
    
    const addPatientToWaitingList = async (patientId: string) => {
        const patient = patients.find(p => p.id === patientId);
        if (!patient || !patient.doctorId) return;

        const doctor = doctors.find(d => d.id === patient.doctorId);
        if (!doctor) return;

        const isPatientActive = waitingList.some(p => 
            p.patientId === patientId && 
            p.status !== 'dispensed' && p.status !== 'prescribed'
        );

        if (isPatientActive) {
            toast({ title: 'Already Waiting', description: `${patient.name} is still in the active clinic queue.`, variant: 'destructive' });
            return;
        }

        const newWaitingPatient: WaitingPatient = {
            id: `wait_${Date.now()}`,
            patientId,
            patientName: patient.name,
            gender: patient.gender,
            age: patient.age,
            avatarUrl: patient.avatarUrl,
            doctorId: patient.doctorId,
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
    };
    
    const addNotification = (message: string) => {
        const newNotification = { id: Date.now(), message };
        setNotifications(prev => [...prev, newNotification]);
    }
    
    const dismissNotification = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }

    const updatePatientStatus = async (waitingPatientId: string, status: PatientStatus, items: string[] = [], advice?: string) => {
        const patientToUpdate = waitingList.find(p => p.id === waitingPatientId);
        if (!patientToUpdate) return;
        
        const newWaitingList = waitingList.map(p => p.id === waitingPatientId ? {...p, status, advice } : p);
        saveData('waitingList', newWaitingList);

        if (status === 'called') {
            addNotification(`Dr. ${patientToUpdate.doctorName} is calling for ${patientToUpdate.patientName}.`);
        }
        
        if (status === 'sent_to_pharmacy') {
            const newPrescription: Prescription = {
                id: `presc_${Date.now()}`,
                waitingPatientId: waitingPatientId,
                patientName: patientToUpdate.patientName,
                doctor: patientToUpdate.doctorName,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                items,
                advice,
                status: 'pending',
            };
            saveData('pharmacyQueue', [...pharmacyQueue, newPrescription]);
            toast({ title: 'Sent to Pharmacy', description: `${patientToUpdate.patientName}'s prescription has been sent.` });
        } else if (status !== 'in_consult') {
             toast({
                title: 'Status Updated',
                description: `${patientToUpdate.patientName}'s status is now ${status.replace(/_/g, ' ')}.`,
            });
        }
    };
    
    const updatePrescriptionStatus = async (prescriptionId: string, status: PrescriptionStatus) => {
        let finalWaitingList = [...waitingList];
        let dispensedPatientName = '';

        const updatedQueue = pharmacyQueue.map(p => {
            if (p.id === prescriptionId) {
                if (status === 'dispensed') {
                    dispensedPatientName = p.patientName;
                    finalWaitingList = finalWaitingList.map(wp => 
                        wp.id === p.waitingPatientId ? { ...wp, status: 'dispensed' } : wp
                    );
                }
                return { ...p, status };
            }
            return p;
        });

        // Use the new finalWaitingList for saving
        saveData('waitingList', finalWaitingList);
        saveData('pharmacyQueue', updatedQueue);
        
        if (status === 'dispensed' && dispensedPatientName) {
            toast({ title: 'Patient Processed', description: `${dispensedPatientName} has been marked as Done.` });
        }
    };

    return (
        <ClinicContext.Provider value={{ 
            patients, 
            doctors, 
            waitingList, 
            pharmacyQueue, 
            notifications,
            settings,
            loading,
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
