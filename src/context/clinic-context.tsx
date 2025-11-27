

'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { User, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, addDoc, updateDoc, deleteDoc, query, where, onSnapshot, Unsubscribe, serverTimestamp, Timestamp, writeBatch, getDocs, enableNetwork, disableNetwork } from 'firebase/firestore';
import Papa from 'papaparse';
import { resolveClinicId } from '@/lib/clinicIdentity';
import { useAuth, useFirestore } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';


// Types
export type PatientStatus = 'waiting' | 'called' | 'in_consult' | 'prescribed' | 'sent_to_pharmacy' | 'dispensed';
export type PrescriptionStatus = 'pending' | 'dispensed';
export type OnlineStatus = 'online' | 'offline' | 'reconnected';
export type ClinicStructure = 'full_workflow' | 'pharmacy_at_doctor' | 'no_pharmacy';

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
    clinicStructure: ClinicStructure;
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
    updatePatientStatus: (waitingPatientId: string, status: PatientStatus, items?: string[], advice?: string) => Promise<string | void>;
    updatePrescriptionStatus: (prescriptionId: string, status: PrescriptionStatus, billDetails?: BillDetails, dueDate?: Date) => void;
    addDoctor: (doctor: Omit<Doctor, 'id' | 'initials' | 'avatarUrl' | 'pincode'>) => Promise<void>;
    updateDoctor: (doctorId: string, doctorData: Partial<Omit<Doctor, 'id' | 'initials' | 'avatarUrl'>>) => void;
    verifyDoctorPincode: (doctorId: string, pincode: string) => Promise<boolean>;
    deleteDoctor: (doctorId: string) => void;
    dismissNotification: (id: number) => void;
    exportDoctorsToCSV: () => Promise<void>;
    updateClinicProfile: (profileData: Partial<ClinicSettings>) => Promise<void>;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const ClinicProvider = ({ children }: { children: ReactNode }) => {
    const { toast } = useToast();
    const auth = useAuth();
    const db = useFirestore();
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
    }, [db]);


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
    }, [auth, db]);
    

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
    }, [clinicId, db, toast]);
    
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
            clinicStructure: 'full_workflow',
            logoSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <path d="M 23.333,4.167            L 76.667,4.167            A 16.667,16.667 0 0 1 93.333,20.833            L 93.333,83.333            A 16.667,16.667 0 0 1 76.667,100            L 23.333,100            A 16.667,16.667 0 0 1 6.667,83.333            L 6.667,20.833            A 16.667,16.667 0 0 1 23.333,4.167 Z" style="fill: rgb(101, 136, 185);"></path>
  <path d="M 50,25            L 50,75 M 25,50 L 75,50" style="fill: none; stroke: rgb(255, 255, 255); stroke-width: 10;"></path>
  <text x="30" y="70" style="fill: rgb(255, 255, 255); font-size: 20px; font-family: sans-serif;">MediChain</text>
</svg>
`
        };
        
        setDoc(clinicRef, defaultSettings)
         .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: clinicRef.path,
                operation: 'create',
                requestResourceData: defaultSettings,
            });
            errorEmitter.emit('permission-error', permissionError);
         });

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
    const addDoctor = (doctorData: Omit<Doctor, 'id' | 'initials' | 'avatarUrl' | 'pincode'>) => {
        if (!clinicId) return;
         const newDoctorData = {
          ...doctorData,
          pincode: '1111',
          initials: doctorData.name.split(' ').map(n => n[0]).join('').toUpperCase(),
          avatarUrl: `https://placehold.co/100x100.png?text=${doctorData.name.charAt(0)}`,
        }
        
        const collectionRef = collection(db, 'clinics', clinicId, 'doctors');
        addDoc(collectionRef, newDoctorData)
         .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: `${collectionRef.path}/<new_document>`,
                operation: 'create',
                requestResourceData: newDoctorData,
            });
            errorEmitter.emit('permission-error', permissionError);
         });
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
        
        updateDoc(docRef, updatedData)
         .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: docRef.path,
                operation: 'update',
                requestResourceData: updatedData,
            });
            errorEmitter.emit('permission-error', permissionError);
         });
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
            // Assume permission errors are handled by onSnapshot listeners or specific error handling
            console.error('Error verifying PIN:', error);
            return false;
        }
    };

    const deleteDoctor = (doctorId: string) => {
        if (!clinicId) return;
        const docRef = doc(db, 'clinics', clinicId, 'doctors', doctorId);
        deleteDoc(docRef)
         .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: docRef.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
         });
    };
    
    const addPatient = async (patientData: NewPatientData) => {
        if (!clinicId) return;
        const newPatientData = {
            ...patientData,
            avatarUrl: `https://placehold.co/100x100?text=${patientData.name.charAt(0)}`,
            history: [],
        }
        
        const collectionRef = collection(db, 'clinics', clinicId, 'patients');
        addDoc(collectionRef, newPatientData).then(() => {
            toast({ title: 'Patient Added', description: `${newPatientData.name} has been registered.` });
        }).catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: `${collectionRef.path}/<new_document>`,
                operation: 'create',
                requestResourceData: newPatientData,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
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

        batch.commit().then(() => {
            toast({ title: 'Added to Waitlist', description: `${patient.name} is now waiting for Dr. ${doctor.name}.` });
        }).catch(async (serverError) => {
            // This is a complex batch, so we report a general error.
            // A more granular approach would require separate writes.
            const permissionError = new FirestorePermissionError({
                path: `Batch write for clinic ${clinicId}`,
                operation: 'update',
                requestResourceData: { waitingList: newWaitingPatientData, patientHistory: updatedHistory },
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    };

    const updatePatientStatus = async (waitingPatientId: string, status: PatientStatus, items: string[] = [], advice?: string): Promise<string | void> => {
        if (!clinicId || !settings) return;
        const patientToUpdate = waitingList.find(p => p.id === waitingPatientId);
        if (!patientToUpdate) return;
        
        const waitingListRef = doc(db, 'clinics', clinicId, 'waitingList', waitingPatientId);

        if (status === 'called') {
            updateDoc(waitingListRef, { status }).catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({ path: waitingListRef.path, operation: 'update', requestResourceData: { status } });
                errorEmitter.emit('permission-error', permissionError);
            });
            addNotification(`Dr. ${patientToUpdate.doctorName} is calling for ${patientToUpdate.patientName}.`);
            return;
        }
        
        if (status === 'in_consult' || status === 'waiting' || status === 'dispensed') {
             updateDoc(waitingListRef, { status }).catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({ path: waitingListRef.path, operation: 'update', requestResourceData: { status } });
                errorEmitter.emit('permission-error', permissionError);
            });
             return;
        }
        
        const isPrescriptionBasedStatus = status === 'prescribed' || status === 'sent_to_pharmacy';

        if (isPrescriptionBasedStatus) {
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
            
            // This operation involves multiple writes, making it a good candidate for a transaction or batch.
            const pharmacyQueueCollectionRef = collection(db, 'clinics', clinicId, 'pharmacyQueue');
            const newPrescriptionRef = doc(pharmacyQueueCollectionRef);

            const patientRef = doc(db, 'clinics', clinicId, 'patients', patientToUpdate.patientId);
            const historyNote = `Consultation complete. Prescription: ${items.join(', ')}. ${advice ? `Advice: ${advice}` : ''}`;
            const newHistoryEntry: PatientHistory = {
                date: new Date().toISOString(),
                doctorName: patientToUpdate.doctorName,
                notes: historyNote
            };
            
            try {
                const patientDoc = await getDoc(patientRef);
                if (patientDoc.exists()) {
                    const batch = writeBatch(db);
                    const existingPatientData = patientDoc.data() as Patient;
                    const updatedHistory = [...(existingPatientData.history || []), newHistoryEntry];
                    
                    batch.set(newPrescriptionRef, newPrescriptionData);
                    batch.update(waitingListRef, { status });
                    batch.update(patientRef, { history: updatedHistory });

                    await batch.commit();
                    
                    toast({ title: 'Consultation Ended', description: `Prescription for ${patientToUpdate.patientName} has been recorded.` });
                    return newPrescriptionRef.id;
                }
            } catch (serverError) {
                 const permissionError = new FirestorePermissionError({
                    path: `Batch write involving: ${newPrescriptionRef.path}, ${waitingListRef.path}, ${patientRef.path}`,
                    operation: 'create',
                    requestResourceData: { prescription: newPrescriptionData, waitingStatus: status },
                });
                errorEmitter.emit('permission-error', permissionError);
            }
        }
    };
    
    const updatePrescriptionStatus = (prescriptionId: string, status: PrescriptionStatus, billDetails?: BillDetails, dueDate?: Date) => {
        if (!clinicId) return;
        const prescriptionRef = doc(db, 'clinics', clinicId, 'pharmacyQueue', prescriptionId);
        
        const updateData: Partial<Prescription> = { status };
        if (billDetails) {
            updateData.billDetails = billDetails;
        }
        if (dueDate) {
            updateData.dueDate = Timestamp.fromDate(dueDate);
        }

        updateDoc(prescriptionRef, updateData)
            .then(() => {
                if (status === 'dispensed') {
                    const prescription = pharmacyQueue.find(p => p.id === prescriptionId) || waitingList.find(p => p.id === prescriptionId);
                    if (prescription) {
                        const waitingPatientRef = doc(db, 'clinics', clinicId, 'waitingList', prescription.waitingPatientId);
                        updateDoc(waitingPatientRef, { status: 'dispensed' }).catch(async (serverError) => {
                             const permissionError = new FirestorePermissionError({ path: waitingPatientRef.path, operation: 'update', requestResourceData: { status: 'dispensed' } });
                             errorEmitter.emit('permission-error', permissionError);
                        });
                        toast({ title: 'Patient Processed', description: `${prescription.patientName} has been marked as Done.` });
                    }
                }
            })
            .catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: prescriptionRef.path,
                    operation: 'update',
                    requestResourceData: updateData,
                });
                errorEmitter.emit('permission-error', permissionError);
            });
    };

    const addNotification = (message: string) => {
        const newNotification = { id: Date.now(), message };
        setNotifications(prev => [...prev, newNotification]);
    }
    
    const dismissNotification = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }
    
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

    const updateClinicProfile = async (profileData: Partial<ClinicSettings>) => {
        if (!clinicId) return;

        const settingsRef = doc(db, 'clinics', clinicId);
        await updateDoc(settingsRef, profileData).catch(async (serverError) => {
             const permissionError = new FirestorePermissionError({
                path: settingsRef.path,
                operation: 'update',
                requestResourceData: profileData,
            });
            errorEmitter.emit('permission-error', permissionError);
            // Re-throw the original error to be caught by the calling function
            throw serverError;
        });
    }

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
        exportDoctorsToCSV,
        updateClinicProfile,
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
