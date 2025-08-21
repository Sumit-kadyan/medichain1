
'use client';

import { useToast } from '@/hooks/use-toast';
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types
export type PatientStatus = 'waiting' | 'called' | 'in_consult' | 'prescribed' | 'sent_to_pharmacy' | 'dispensed';
export type PrescriptionStatus = 'pending' | 'dispensed';

export interface Patient {
    id: string;
    name: string;
    phone: string;
    gender: string;
    age: number;
    lastVisit: string;
    avatarUrl: string;
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
    gender: string,
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
  { id: 'p1', name: 'Liam Johnson', phone: '555-0101', gender: 'Male', age: 28, lastVisit: '2023-10-26', avatarUrl: 'https://placehold.co/100x100/A6B1E1/FFFFFF.png' },
  { id: 'p2', name: 'Olivia Smith', phone: '555-0102', gender: 'Female', age: 45, lastVisit: '2023-10-25', avatarUrl: 'https://placehold.co/100x100/F4A261/FFFFFF.png' },
  { id: 'p3', name: 'Noah Williams', phone: '555-0103', gender: 'Male', age: 12, lastVisit: '2023-09-15', avatarUrl: 'https://placehold.co/100x100/E76F51/FFFFFF.png' },
  { id: 'p4', name: 'Emma Brown', phone: '555-0104', gender: 'Female', age: 62, lastVisit: '2023-10-28', avatarUrl: 'https://placehold.co/100x100/2A9D8F/FFFFFF.png' },
  { id: 'p5', name: 'James Wilson', phone: '555-0105', gender: 'Male', age: 35, lastVisit: '2023-11-01', avatarUrl: 'https://placehold.co/100x100/264653/FFFFFF.png' },
  { id: 'p6', name: 'Sophia Miller', phone: '555-0106', gender: 'Female', age: 29, lastVisit: '2023-11-02', avatarUrl: 'https://placehold.co/100x100/8E9AAF/FFFFFF.png' },
  { id: 'p7', name: 'Ava Davis', phone: '555-0107', gender: 'Female', age: 51, lastVisit: '2023-11-03', avatarUrl: 'https://placehold.co/100x100/DDA15E/FFFFFF.png' },
  { id: 'p8', name: 'William Garcia', phone: '555-0108', gender: 'Male', age: 42, lastVisit: '2023-11-04', avatarUrl: 'https://placehold.co/100x100/BC6C25/FFFFFF.png' },
];

const initialDoctors: Doctor[] = [
  { id: 'd1', name: 'Dr. John Smith', specialization: 'Cardiology', avatarUrl: 'https://placehold.co/100x100/6699CC/FFFFFF.png', initials: 'JS' },
  { id: 'd2', name: 'Dr. Emily White', specialization: 'Pediatrics', avatarUrl: 'https://placehold.co/100x100/8FBC8F/FFFFFF.png', initials: 'EW' },
  { id: 'd3', name: 'Dr. Michael Brown', specialization: 'Neurology', avatarUrl: 'https://placehold.co/100x100/F0F8FF/333333.png', initials: 'MB' },
];


// Context
interface ClinicContextType {
    patients: Patient[];
    doctors: Doctor[];
    waitingList: WaitingPatient[];
    pharmacyQueue: Prescription[];
    activePatient: WaitingPatient | undefined;
    setActivePatientId: (patientId: string | null) => void;
    addPatientToWaitingList: (patientId: string, doctorId: string) => void;
    updatePatientStatus: (waitingPatientId: string, status: PatientStatus, items?: string[]) => void;
    updatePrescriptionStatus: (prescriptionId: string, status: PrescriptionStatus) => void;
    addDoctor: (doctor: Omit<Doctor, 'id'>) => void;
    deleteDoctor: (doctorId: string) => void;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const ClinicProvider = ({ children }: { children: ReactNode }) => {
    const { toast } = useToast();
    const [patients, setPatients] = useState<Patient[]>(initialPatients);
    const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors);
    const [waitingList, setWaitingList] = useState<WaitingPatient[]>([]);
    const [pharmacyQueue, setPharmacyQueue] = useState<Prescription[]>([]);
    const [activePatientId, setActivePatientId] = useState<string | null>(null);

    const activePatient = waitingList.find(p => p.id === activePatientId);
    
    const addDoctor = (doctorData: Omit<Doctor, 'id'>) => {
        const newDoctor: Doctor = { ...doctorData, id: `doc-${Date.now()}`};
        setDoctors(prev => [...prev, newDoctor]);
    }

    const deleteDoctor = (doctorId: string) => {
        setDoctors(prev => prev.filter(d => d.id !== doctorId));
    }

    const addPatientToWaitingList = (patientId: string, doctorId: string) => {
        const patient = patients.find(p => p.id === patientId);
        const doctor = doctors.find(d => d.id === doctorId);

        if (patient && doctor) {
            if (waitingList.some(p => p.patientId === patientId)) {
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
        }
    };

    const updatePatientStatus = (waitingPatientId: string, status: PatientStatus, items: string[] = []) => {
        setWaitingList(prev => prev.map(p => p.id === waitingPatientId ? { ...p, status } : p));
        
        if (status === 'sent_to_pharmacy') {
            const patient = waitingList.find(p => p.id === waitingPatientId);
            if (patient) {
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
            }
        } else {
             const patient = waitingList.find(p => p.id === waitingPatientId);
             if(patient) {
                toast({
                    title: 'Status Updated',
                    description: `${patient.patientName}'s status is now ${status.replace('_', ' ')}.`,
                });
             }
        }
    };
    
    const updatePrescriptionStatus = (prescriptionId: string, status: PrescriptionStatus) => {
        setPharmacyQueue(prev => prev.map(p => p.id === prescriptionId ? { ...p, status } : p));
    }

    return (
        <ClinicContext.Provider value={{ 
            patients, 
            doctors, 
            waitingList, 
            pharmacyQueue, 
            activePatient,
            setActivePatientId,
            addPatientToWaitingList,
            updatePatientStatus,
            updatePrescriptionStatus,
            addDoctor,
            deleteDoctor
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
