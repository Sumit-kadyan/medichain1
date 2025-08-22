
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

// Types
export type PatientStatus = 'waiting' | 'called' | 'in_consult' | 'prescribed' | 'sent_to_pharmacy' | 'dispensed';
export type PrescriptionStatus = 'pending' | 'dispensed';
export type RegistrationType = 'Added' | 'Renewed' | 'Continued';


export interface Patient {
    id: string;
    name: string;
    phone: string;
    gender: 'Male' | 'Female' | 'Other';
    age: number;
    lastVisit: string;
    avatarUrl: string;
    registrationType: RegistrationType;
}

export interface Doctor {
    id: string;
    name: string;
    specialization: string;
    avatarUrl: string;
    initials: string;
}

export interface WaitingPatient {
    id: string;
    patientId: string;
    patientName: string;
    gender: 'Male' | 'Female' | 'Other',
    age: number,
    avatarUrl: string;
    doctorId: string;
    doctorName: string;
    status: PatientStatus;
    time: string;
}

export interface Prescription {
  id: string;
  patientName: string;
  doctor: string;
  time: string;
  items: string[];
  status: PrescriptionStatus;
}

// Initial Data
const initialPatients: Patient[] = [
  { id: 'p1', name: 'Liam Johnson', phone: '555-0101', gender: 'Male', age: 28, lastVisit: '2024-07-29', avatarUrl: 'https://placehold.co/100x100/A6B1E1/FFFFFF.png', registrationType: 'Added' },
  { id: 'p2', name: 'Olivia Smith', phone: '555-0102', gender: 'Female', age: 45, lastVisit: '2024-07-20', avatarUrl: 'https://placehold.co/100x100/F4A261/FFFFFF.png', registrationType: 'Continued' },
  { id: 'p3', name: 'Noah Williams', phone: '555-0103', gender: 'Male', age: 12, lastVisit: '2024-06-15', avatarUrl: 'https://placehold.co/100x100/E76F51/FFFFFF.png', registrationType: 'Added' },
  { id: 'p4', name: 'Emma Brown', phone: '555-0104', gender: 'Female', age: 62, lastVisit: '2024-07-28', avatarUrl: 'https://placehold.co/100x100/2A9D8F/FFFFFF.png', registrationType: 'Renewed' },
  { id: 'p5', name: 'James Wilson', phone: '555-0105', gender: 'Male', age: 35, lastVisit: '2024-05-10', avatarUrl: 'https://placehold.co/100x100/264653/FFFFFF.png', registrationType: 'Added' },
];

const initialDoctors: Doctor[] = [
  { id: 'd1', name: 'Dr. John Smith', specialization: 'Cardiology', avatarUrl: 'https://placehold.co/100x100/6699CC/FFFFFF.png', initials: 'JS' },
  { id: 'd2', name: 'Dr. Emily White', specialization: 'Pediatrics', avatarUrl: 'https://placehold.co/100x100/8FBC8F/FFFFFF.png', initials: 'EW' },
  { id: 'd3', name: 'Dr. Michael Brown', specialization: 'Neurology', avatarUrl: 'https://placehold.co/100x100/F0F8FF/333333.png', initials: 'MB' },
];

type Notification = {
    id: number;
    message: string;
};

// Context
interface ClinicContextType {
    patients: Patient[];
    doctors: Doctor[];
    waitingList: WaitingPatient[];
    pharmacyQueue: Prescription[];
    activePatient: WaitingPatient | undefined;
    notifications: Notification[];
    receiptValidityDays: number;
    addPatient: (patient: Omit<Patient, 'id' | 'lastVisit' | 'avatarUrl' | 'registrationType'>) => Patient;
    addPatientToWaitingList: (patientId: string, doctorId: string) => void;
    updatePatientStatus: (waitingPatientId: string, status: PatientStatus, items?: string[]) => void;
    updatePatientRegistration: (patientId: string, type: RegistrationType) => void;
    updatePrescriptionStatus: (prescriptionId: string, status: PrescriptionStatus) => void;
    addDoctor: (doctor: Omit<Doctor, 'id'>) => void;
    deleteDoctor: (doctorId: string) => void;
    setActivePatientId: (patientId: string | null) => void;
    dismissNotification: (id: number) => void;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const ClinicProvider = ({ children }: { children: ReactNode }) => {
    const { toast } = useToast();
    const [patients, setPatients] = useState<Patient[]>(initialPatients);
    const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors);
    const [waitingList, setWaitingList] = useState<WaitingPatient[]>([]);
    const [pharmacyQueue, setPharmacyQueue] = useState<Prescription[]>([]);
    const [activePatientId, setActivePatientId] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [receiptValidityDays, setReceiptValidityDays] = useState(30);

    const activePatient = waitingList.find(p => p.id === activePatientId);
    
    const addDoctor = (doctorData: Omit<Doctor, 'id'>) => {
        const newDoctor: Doctor = { ...doctorData, id: `doc-${Date.now()}`};
        setDoctors(prev => [...prev, newDoctor]);
    };

    const deleteDoctor = (doctorId: string) => {
        setDoctors(prev => prev.filter(d => d.id !== doctorId));
    };
    
    const addPatient = (patientData: Omit<Patient, 'id' | 'lastVisit' | 'avatarUrl' | 'registrationType'>): Patient => {
        const newPatient: Patient = {
            id: `p-${Date.now()}`,
            ...patientData,
            lastVisit: new Date().toISOString().split('T')[0],
            avatarUrl: `https://placehold.co/100x100?text=${patientData.name.charAt(0)}`,
            registrationType: 'Added',
        };
        setPatients(prev => [...prev, newPatient]);
        toast({
            title: 'Patient Added',
            description: `${newPatient.name} has been registered.`
        })
        return newPatient;
    };
    

    const addPatientToWaitingList = (patientId: string, doctorId: string) => {
        const patient = patients.find(p => p.id === patientId);
        const doctor = doctors.find(d => d.id === doctorId);

        if (patient && doctor) {
            if (waitingList.some(p => p.patientId === patientId && p.status !== 'dispensed')) {
                toast({ title: 'Already Waiting', description: `${patient.name} is already in the waiting list.`, variant: 'destructive' });
                return;
            }
            const newWaitingPatient: WaitingPatient = {
                id: `wp-${Date.now()}`,
                patientId,
                patientName: patient.name,
                gender: patient.gender,
                age: patient.age,
                avatarUrl: patient.avatarUrl,
                doctorId,
                doctorName: doctor.name,
                status: 'waiting',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setWaitingList(prev => [...prev, newWaitingPatient]);
            toast({
                title: 'Added to Waitlist',
                description: `${patient.name} is now waiting for Dr. ${doctor.name}.`
            })
        }
    };
    
    const addNotification = (message: string) => {
        const newNotification = { id: Date.now(), message };
        setNotifications(prev => [...prev, newNotification]);
    }
    
    const dismissNotification = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }

    const updatePatientStatus = (waitingPatientId: string, status: PatientStatus, items: string[] = []) => {
        
        let patientToUpdate: WaitingPatient | undefined;

        setWaitingList(prev => prev.map(p => {
            if (p.id === waitingPatientId) {
                patientToUpdate = { ...p, status };
                return patientToUpdate;
            }
            return p;
        }));

        const patient = patientToUpdate;
        if (!patient) return;
        
        // Handle "consulted" status for previous patient when a new one is called
        if (status === 'in_consult') {
            const previousPatient = waitingList.find(p => p.status === 'in_consult' && p.doctorId === patient.doctorId);
            if (previousPatient && previousPatient.id !== waitingPatientId) {
                setWaitingList(prev => prev.map(p => p.id === previousPatient.id ? { ...p, status: 'prescribed' } : p));
                 toast({
                    title: 'Status Updated',
                    description: `${previousPatient.patientName}'s status is now 'Consulted'.`,
                });
            }
        }
        
        if (status === 'called') {
             addNotification(`Dr. ${patient.doctorName} is calling for ${patient.patientName}.`);
        }
        
        if (status === 'sent_to_pharmacy') {
            const newPrescription: Prescription = {
                id: `presc-${Date.now()}`,
                patientName: patient.patientName,
                doctor: patient.doctorName,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                items,
                status: 'pending',
            }
            setPharmacyQueue(prev => [...prev, newPrescription]);
            toast({ title: 'Sent to Pharmacy', description: `${patient.patientName}'s prescription has been sent.` });
        } else {
            toast({
                title: 'Status Updated',
                description: `${patient.patientName}'s status is now ${status.replace(/_/g, ' ')}.`,
            });
        }
    };

    const updatePatientRegistration = (patientId: string, type: RegistrationType) => {
        setPatients(prev => prev.map(p => 
            p.id === patientId 
            ? { ...p, registrationType: type, lastVisit: new Date().toISOString().split('T')[0] } 
            : p
        ));
        const patient = patients.find(p => p.id === patientId);
        if (patient) {
            toast({
                title: 'Patient Updated',
                description: `${patient.name} has been marked as ${type}.`
            });
        }
    }
    
    const updatePrescriptionStatus = (prescriptionId: string, status: PrescriptionStatus) => {
        let updatedPrescription: Prescription | undefined;
        setPharmacyQueue(prev => prev.map(p => {
            if (p.id === prescriptionId) {
                updatedPrescription = { ...p, status };
                return updatedPrescription;
            }
            return p;
        }));

        if (status === 'dispensed' && updatedPrescription) {
            setWaitingList(prev => prev.map(p => p.patientName === updatedPrescription!.patientName ? { ...p, status: 'dispensed' } : p));
             toast({ title: 'Patient Processed', description: `${updatedPrescription.patientName} has been marked as Done.` });
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
            addPatient,
            addPatientToWaitingList,
            updatePatientStatus,
            updatePatientRegistration,
            updatePrescriptionStatus,
            addDoctor,
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

    