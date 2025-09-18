

'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { User, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, addDoc, updateDoc, deleteDoc, query, where, onSnapshot, Unsubscribe, serverTimestamp, Timestamp, writeBatch, getDocs } from 'firebase/firestore';
import Papa from 'papaparse';
import { resolveClinicId } from '@/lib/clinicIdentity';


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
    signup: (email: string, password: string, clinicName: string, username: string) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    addPatient: (patient: NewPatientData) => Promise<Patient | undefined>;
    getPatientById: (patientId: string) => Promise<Patient | null>;
    addPatientToWaitingList: (patient: Patient, doctorId: string) => Promise<void>;
    updatePatientStatus: (waitingPatientId: string, status: PatientStatus, items?: string[], advice?: string) => Promise<void>;
    updatePrescriptionStatus: (prescriptionId: string, status: PrescriptionStatus, billDetails?: BillDetails, dueDate?: Date) => Promise<void>;
    addDoctor: (doctor: Omit<Doctor, 'id' | 'initials' | 'avatarUrl'>) => Promise<void>;
    updateDoctor: (doctorId: string, doctorData: Partial<Omit<Doctor, 'id' | 'initials' | 'avatarUrl'>>) => Promise<void>;
    deleteDoctor: (doctorId: string) => Promise<void>;
    dismissNotification: (id: number) => void;
    updateSettings: (newSettings: Partial<ClinicSettings>) => Promise<void>;
    exportPatientsToCSV: () => Promise<void>;
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
            const settingsUnsub = onSnapshot(doc(db, 'clinics', clinicId), (doc) => {
                if (doc.exists()) {
                    setSettings(doc.data() as ClinicSettings);
                }
            }, (error) => {
                console.error("Error fetching settings:", error);
                toast({ title: 'Error', description: 'Could not load clinic settings.', variant: 'destructive'});
            });
            listeners.push(settingsUnsub);

            const doctorsUnsub = onSnapshot(collection(db, 'clinics', clinicId, 'doctors'), (snapshot) => {
                const doctorsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Doctor));
                setDoctors(doctorsData);
            }, (error) => {
                console.error("Error fetching doctors:", error);
                toast({ title: 'Error', description: 'Could not load doctor list.', variant: 'destructive'});
            });
            listeners.push(doctorsUnsub);

            const patientsUnsub = onSnapshot(collection(db, 'clinics', clinicId, 'patients'), (snapshot) => {
                const patientsData = snapshot.docs.map(p => ({ id: p.id, ...p.data() } as Patient));
                setPatients(patientsData);
            }, (error) => {
                console.error("Error fetching patients:", error);
                toast({ title: 'Error', description: 'Could not load patient list.', variant: 'destructive'});
            });
            listeners.push(patientsUnsub);

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
    const signup = async (email: string, password: string, clinicName: string, username: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const { user } = userCredential;
        const newSettings: ClinicSettings = {
            clinicName,
            clinicAddress: 'Not set',
            receiptValidityDays: 30,
            currency: '$',
            logoUrl: '',
            taxType: 'VAT',
            taxPercentage: 0,
            appointmentFee: 0,
        };
        const batch = writeBatch(db);
        // The username is stored in the clinic document for display/reference if needed,
        // and also in the users document for the login lookup.
        batch.set(doc(db, 'clinics', user.uid), { ...newSettings, ownerUsername: username });
        batch.set(doc(db, 'users', user.uid), { clinicId: user.uid, email, username });
        await batch.commit();
    };

    const login = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const logout = async () => {
        await signOut(auth);
    };
    
    const getPatientById = async (patientId: string): Promise<Patient | null> => {
        if (!clinicId) throw new Error("Not authenticated");
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
            throw new Error("Failed to fetch patient details.");
        }
    };
    
    // DATA FUNCTIONS
    const addDoctor = async (doctorData: Omit<Doctor, 'id' | 'initials' | 'avatarUrl'>) => {
        if (!clinicId) throw new Error("Not authenticated");
        try {
             const newDoctorData = {
              ...doctorData,
              initials: doctorData.name.split(' ').map(n => n[0]).join('').toUpperCase(),
              avatarUrl: `https://placehold.co/100x100.png?text=${doctorData.name.charAt(0)}`,
            }
            await addDoc(collection(db, 'clinics', clinicId, 'doctors'), newDoctorData);
        } catch (error) {
            console.error("Error adding doctor:", error);
            throw new Error("Failed to save doctor to database.");
        }
    };
    
    const updateDoctor = async (doctorId: string, doctorData: Partial<Omit<Doctor, 'id' | 'avatarUrl' | 'initials'>>) => {
        if (!clinicId) throw new Error("Not authenticated");
        try {
            const docRef = doc(db, 'clinics', clinicId, 'doctors', doctorId);
        
            const currentDoctor = doctors.find(d => d.id === doctorId);
            if (!currentDoctor) throw new Error("Doctor not found");
            
            const updatedData: Partial<Doctor> = {...doctorData};
            if (doctorData.name && doctorData.name !== currentDoctor.name) {
                updatedData.initials = doctorData.name.split(' ').map(n => n[0]).join('').toUpperCase();
                updatedData.avatarUrl = `https://placehold.co/100x100.png?text=${doctorData.name.charAt(0)}`;
            }
            await updateDoc(docRef, updatedData);
        } catch (error) {
            console.error("Error updating doctor:", error);
            throw new Error("Failed to update doctor in database.");
        }
    };

    const deleteDoctor = async (doctorId: string) => {
        if (!clinicId) throw new Error("Not authenticated");
        try {
            await deleteDoc(doc(db, 'clinics', clinicId, 'doctors', doctorId));
        } catch (error) {
            console.error("Error deleting doctor:", error);
            throw new Error("Failed to delete doctor from database.");
        }
    };
    
    const addPatient = async (patientData: NewPatientData): Promise<Patient | undefined> => {
        if (!clinicId) throw new Error("Not authenticated");
        try {
            const newPatientData = {
                ...patientData,
                avatarUrl: `https://placehold.co/100x100?text=${patientData.name.charAt(0)}`,
                history: [],
            }
            const docRef = await addDoc(collection(db, 'clinics', clinicId, 'patients'), newPatientData);
            toast({ title: 'Patient Added', description: `${newPatientData.name} has been registered.` });
            return { id: docRef.id, ...newPatientData };
        } catch (error) {
             console.error("Error adding patient:", error);
             toast({ title: 'Error Adding Patient', description: 'Could not save new patient to the database.', variant: 'destructive' });
             throw new Error("Failed to save patient to database.");
        }
    };
    
    const addPatientToWaitingList = async (patient: Patient, doctorId: string) => {
        if (!clinicId) throw new Error("Not authenticated");
        if (!patient || !patient.id) throw new Error("Patient not found");

        try {
            const doctor = doctors.find(d => d.id === doctorId);
            if (!doctor) throw new Error("Doctor not found");

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
            const updatedHistory = [...patient.history, newHistoryEntry];
            batch.update(patientRef, { history: updatedHistory });

            await batch.commit();

            toast({ title: 'Added to Waitlist', description: `${patient.name} is now waiting for Dr. ${doctor.name}.` });

        } catch (error) {
            console.error("Error adding patient to waiting list:", error);
            throw new Error("Failed to add patient to waiting list.");
        }
    };

    const updatePatientStatus = async (waitingPatientId: string, status: PatientStatus, items: string[] = [], advice?: string) => {
        if (!clinicId) throw new Error("Not authenticated");
        
        try {
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
                    visitDate: new Date().toISOString().split('T')[0],
                };
                await addDoc(collection(db, 'clinics', clinicId, 'pharmacyQueue'), newPrescriptionData);
                toast({ title: 'Sent to Pharmacy', description: `${patientToUpdate.patientName}'s prescription has been sent.` });
            } else if (status !== 'in_consult') {
                toast({ title: 'Status Updated', description: `${patientToUpdate.patientName}'s status is now ${status.replace(/_/g, ' ')}.`, });
            }
        } catch (error) {
            console.error("Error updating patient status:", error);
            throw new Error("Failed to update patient status.");
        }
    };
    
    const updatePrescriptionStatus = async (prescriptionId: string, status: PrescriptionStatus, billDetails?: BillDetails, dueDate?: Date) => {
        if (!clinicId) throw new Error("Not authenticated");
        
        try {
            const prescriptionRef = doc(db, 'clinics', clinicId, 'pharmacyQueue', prescriptionId);
            const prescriptionDoc = await getDoc(prescriptionRef);

            if (!prescriptionDoc.exists()) {
                throw new Error("Prescription not found");
            }
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
        } catch (error) {
            console.error("Error updating prescription status:", error);
            throw new Error("Failed to update prescription status.");
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
        try {
            const settingsRef = doc(db, 'clinics', clinicId);
            await updateDoc(settingsRef, newSettings);
        } catch (error) {
             console.error("Error updating settings:", error);
            throw new Error("Failed to save settings.");
        }
    };

    const exportDataToCSV = async (dataToExport: 'patients' | 'doctors', filename: string) => {
      const data = dataToExport === 'patients' ? patients : doctors;

      if (data.length === 0) {
        toast({
          title: 'No Data',
          description: `There is no data to export for ${dataToExport}.`,
        });
        return;
      }

      // We don't want to export the full history object in the CSV
      const processedData = data.map(item => {
        const { history, ...rest } = item as Patient; // Use type assertion
        return rest;
      });


      const csv = Papa.unparse(processedData);
      const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    
    const exportPatientsToCSV = () => exportDataToCSV('patients', 'patients.csv');
    const exportDoctorsToCSV = () => exportDataToCSV('doctors', 'doctors.csv');

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
        signup,
        login,
        logout,
        addPatient,
        getPatientById,
        addPatientToWaitingList,
        updatePatientStatus,
        updatePrescriptionStatus,
        addDoctor,
        updateDoctor,
        deleteDoctor,
        dismissNotification,
        updateSettings,
        exportPatientsToCSV,
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

    

    
