

'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { User, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, addDoc, updateDoc, deleteDoc, query, where, onSnapshot, Unsubscribe, serverTimestamp, Timestamp, writeBatch, getDocs, enableNetwork, disableNetwork } from 'firebase/firestore';
import Papa from 'papaparse';
import { resolveClinicId } from '@/lib/clinicIdentity';
import { useAuth, useFirestore } from '@/firebase';

// Types
export type PatientStatus = 'waiting' | 'called' | 'in_consult' | 'prescribed' | 'sent_to_pharmacy' | 'dispensed';
export type PrescriptionStatus = 'pending' | 'dispensed';
export type OnlineStatus = 'online' | 'offline' | 'reconnected';
export type ClinicStructure = 'full_workflow' | 'no_pharmacy' | 'one_man';

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
  billDetails?: BillDetails | null;
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
    mainDoctorId?: string;
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
    addPatient: (patient: NewPatientData) => Promise<Patient | null>;
    getPatientById: (patientId: string) => Promise<Patient | null>;
    addPatientToWaitingList: (patient: Patient, doctorId: string) => void;
    updatePatientStatus: (waitingPatientId: string, status: PatientStatus, items?: string[], advice?: string, billDetails?: BillDetails | null, dueDate?: Date) => Promise<string | void>;
    updatePrescriptionStatus: (prescriptionId: string, status: PrescriptionStatus, billDetails?: BillDetails, dueDate?: Date) => void;
    addDoctor: (doctor: Omit<Doctor, 'id' | 'initials' | 'avatarUrl' | 'pincode'>) => void;
    updateDoctor: (doctorId: string, doctorData: Partial<Omit<Doctor, 'id' | 'initials' | 'avatarUrl'>>) => void;
    verifyDoctorPincode: (doctorId: string, pincode: string) => Promise<boolean>;
    deleteDoctor: (doctorId: string) => void;
    dismissNotification: (id: number) => void;
    updateClinicProfile: (profileData: Pick<ClinicSettings, 'clinicName' | 'clinicAddress' | 'logoSvg'>) => void;
    exportDoctorsToCSV: () => Promise<void>;
    updateSettings: (newSettings: ClinicSettings) => void;
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
            if(db) {
                enableNetwork(db);
                setOnlineStatus('reconnected');
                setTimeout(() => setOnlineStatus('online'), 3000);
            }
        };
        const handleOffline = () => {
            if(db) {
                disableNetwork(db);
                setOnlineStatus('offline');
            }
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
        if (!auth || !db) return;
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
        if (!clinicId || !db) {
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
        if (!auth || !db) return null;
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
            logoSvg: `<svg xmlns="http://www.w3.org/2000/svg" version="1.0" width="210.000000pt" height="148.000000pt" viewBox="0 0 210.000000 148.000000" preserveAspectRatio="xMidYMid meet">
<g transform="translate(0.000000,148.000000) scale(0.100000,-0.100000)" fill="#000000" stroke="none">
<path d="M862 1210 c-155 -56 -258 -162 -312 -320 -19 -56 -22 -81 -18 -175 4 -102 7 -116 40 -185 88 -183 254 -290 447 -290 42 0 96 5 121 11 134 31 260 131 324 256 46 93 46 101 -2 27 -91 -140 -226 -214 -392 -214 -269 0 -479 230 -457 500 14 168 132 332 282 390 65 25 36 25 -33 0z"/>
<path d="M950 940 l0 -100 -105 0 -105 0 0 -100 0 -100 105 0 105 0 0 -105 0 -105 100 0 100 0 0 105 0 105 91 0 92 0 -6 52 c-4 29 -17 73 -30 98 l-23 45 -62 3 -62 3 0 58 c0 56 -1 59 -37 83 -46 29 -116 58 -143 58 -19 0 -20 -7 -20 -100z"/>
</g>
</svg>`
        };
        await setDoc(clinicRef, defaultSettings);

        return newUser;
    };

    const login = async (email: string, password: string): Promise<User | null> => {
        if (!auth) return null;
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    };

    const logout = async () => {
        if (!auth) return;
        await signOut(auth);
    };
    
    const getPatientById = async (patientId: string): Promise<Patient | null> => {
        if (!clinicId || !db) return null;
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
        if (!clinicId || !db) return;
        const newDoctor = {
          ...doctorData,
          pincode: '1111',
          initials: doctorData.name.split(' ').map(n => n[0]).join('').toUpperCase(),
          avatarUrl: `https://placehold.co/100x100.png?text=${doctorData.name.charAt(0)}`,
        };
        addDoc(collection(db, 'clinics', clinicId, 'doctors'), newDoctor).catch(error => {
            console.error("Error adding doctor:", error);
            toast({ title: 'Firebase Error', description: error.message, variant: 'destructive'});
        });
    };
    
    const updateDoctor = (doctorId: string, doctorData: Partial<Omit<Doctor, 'id' | 'avatarUrl' | 'initials'>>) => {
        if (!clinicId || !db) return;
        const docRef = doc(db, 'clinics', clinicId, 'doctors', doctorId);
     
        const currentDoctor = doctors.find(d => d.id === doctorId);
        if (!currentDoctor) throw new Error("Doctor not found");
        
        const updatedData: Partial<Doctor> = {...doctorData};
        if (doctorData.name && doctorData.name !== currentDoctor.name) {
            updatedData.initials = doctorData.name.split(' ').map(n => n[0]).join('').toUpperCase();
            updatedData.avatarUrl = `https://placehold.co/100x100.png?text=${doctorData.name.charAt(0)}`;
        }
        
        updateDoc(docRef, updatedData).catch(error => {
            console.error("Error updating doctor:", error);
            toast({ title: 'Firebase Error', description: error.message, variant: 'destructive'});
        });
    };
    
    const verifyDoctorPincode = async (doctorId: string, pincode: string): Promise<boolean> => {
        if (!clinicId || !db) return false;
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
        if (!clinicId || !db) return;
        const docRef = doc(db, 'clinics', clinicId, 'doctors', doctorId);
        deleteDoc(docRef).catch(error => {
            console.error("Error deleting doctor:", error);
            toast({ title: 'Firebase Error', description: error.message, variant: 'destructive'});
        });
    };
    
    const addPatient = async (patientData: NewPatientData): Promise<Patient | null> => {
        if (!clinicId || !db) return null;
        try {
            const newPatientData = {
                ...patientData,
                avatarUrl: `https://placehold.co/100x100?text=${patientData.name.charAt(0)}`,
                history: [],
            };
            const patientCollectionRef = collection(db, 'clinics', clinicId, 'patients');
            const docRef = await addDoc(patientCollectionRef, newPatientData);
            toast({ title: 'Patient Added', description: `${patientData.name} has been registered.` });

            const newPatient: Patient = {
                id: docRef.id,
                ...newPatientData,
            }
            return newPatient;
        } catch(error: any) {
            console.error("Error adding patient:", error);
            toast({ title: 'Firebase Error', description: error.message, variant: 'destructive'});
            return null;
        }
    };
    
    const addPatientToWaitingList = (patient: Patient, doctorId: string) => {
        if (!clinicId || !patient || !patient.id || !db) return;

        const doctor = doctors.find(d => d.id === doctorId);
        if (!doctor) return;

        const isPatientActive = waitingList.some(p => p.patientId === patient.id && p.status !== 'dispensed');
        if (isPatientActive) {
            toast({ title: 'Already Waiting', description: `${patient.name} is still in the active clinic queue.`, variant: 'destructive' });
            return;
        }

        const newWaitingPatient: Omit<WaitingPatient, 'id'> = {
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
        batch.set(waitingListRef, newWaitingPatient);
        
        const newHistoryEntry: PatientHistory = {
            date: new Date().toISOString(),
            doctorName: doctor.name,
            notes: 'Added to waiting list for consultation.'
        };
        const patientRef = doc(db, 'clinics', clinicId, 'patients', patient.id);
        
        const updatedHistory = [...(patient.history || []), newHistoryEntry];
        batch.update(patientRef, { history: updatedHistory });

        batch.commit()
            .then(() => {
                toast({ title: 'Added to Waitlist', description: `${patient.name} is now waiting for Dr. ${doctor.name}.` });
            })
            .catch(error => {
                console.error("Error adding to waitlist:", error);
                toast({ title: 'Firebase Error', description: error.message, variant: 'destructive'});
            });
    };

    const updatePatientStatus = async (waitingPatientId: string, status: PatientStatus, items: string[] = [], advice?: string, billDetails?: BillDetails | null, dueDate?: Date): Promise<string | void> => {
        if (!clinicId || !settings || !db) return;
        const patientToUpdate = waitingList.find(p => p.id === waitingPatientId);
        if (!patientToUpdate) return;
        
        const waitingListRef = doc(db, 'clinics', clinicId, 'waitingList', waitingPatientId);

        if (status === 'called') {
            updateDoc(waitingListRef, { status }).catch(error => {
                console.error("Error updating patient status:", error);
                toast({ title: 'Firebase Error', description: error.message, variant: 'destructive'});
            });
            addNotification(`Dr. ${patientToUpdate.doctorName} is calling for ${patientToUpdate.patientName}.`);
            return;
        }
        
        if (status === 'in_consult' || status === 'waiting' || status === 'dispensed') {
             updateDoc(waitingListRef, { status }).catch(error => {
                console.error("Error updating patient status:", error);
                toast({ title: 'Firebase Error', description: error.message, variant: 'destructive'});
            });
             return;
        }
        
        const isPrescriptionBasedStatus = status === 'prescribed' || status === 'sent_to_pharmacy';

        if (isPrescriptionBasedStatus) {
            const newPrescriptionData: Partial<Prescription> = {
                waitingPatientId: waitingPatientId,
                patientName: patientToUpdate.patientName,
                doctor: patientToUpdate.doctorName,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                items,
                advice,
                status: 'pending',
                visitDate: new Date().toISOString().split('T')[0],
            };
            
            if (billDetails) newPrescriptionData.billDetails = billDetails;
            if (dueDate) newPrescriptionData.dueDate = Timestamp.fromDate(dueDate);

            
            const newPrescriptionRef = doc(collection(db, 'clinics', clinicId, 'pharmacyQueue'));
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
            } catch(error: any) {
                console.error("Error ending consultation:", error);
                toast({ title: 'Firebase Error', description: error.message, variant: 'destructive'});
            }
        }
    };
    
    const updatePrescriptionStatus = (prescriptionId: string, status: PrescriptionStatus, billDetails?: BillDetails, dueDate?: Date) => {
        if (!clinicId || !db) return;
        const prescriptionRef = doc(db, 'clinics', clinicId, 'pharmacyQueue', prescriptionId);
        
        const updateData: Partial<Prescription> = { status };
        if (billDetails) {
            updateData.billDetails = billDetails;
        }
        if (dueDate) {
            updateData.dueDate = Timestamp.fromDate(dueDate);
        }

        updateDoc(prescriptionRef, updateData)
            .catch(error => {
                console.error("Error updating prescription status:", error);
                toast({ title: 'Firebase Error', description: error.message, variant: 'destructive'});
            });

        if (status === 'dispensed') {
            const prescription = pharmacyQueue.find(p => p.id === prescriptionId) || waitingList.find(p => p.id === prescriptionId);
            if (prescription) {
                const waitingPatientRef = doc(db, 'clinics', clinicId, 'waitingList', prescription.waitingPatientId);
                updateDoc(waitingPatientRef, { status: 'dispensed' }).catch(error => {
                    console.error("Error updating waiting list:", error);
                    toast({ title: 'Firebase Error', description: error.message, variant: 'destructive'});
                });
                toast({ title: 'Patient Processed', description: `${prescription.patientName} has been marked as Done.` });
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

    const updateClinicProfile = (profileData: Pick<ClinicSettings, 'clinicName' | 'clinicAddress' | 'logoSvg'>) => {
        if (!clinicId || !db) return;
        const settingsRef = doc(db, 'clinics', clinicId);
        updateDoc(settingsRef, profileData)
          .catch(error => {
            console.error("Error updating clinic profile:", error);
            toast({ title: 'Firebase Error', description: error.message, variant: 'destructive'});
        });
    }

    const updateSettings = (newSettings: ClinicSettings) => {
        if (!clinicId || !db) return;
        const settingsRef = doc(db, 'clinics', clinicId);
        updateDoc(settingsRef, newSettings)
         .catch(error => {
            console.error("Error updating settings:", error);
            toast({ title: 'Firebase Error', description: error.message, variant: 'destructive'});
        });
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
        updateClinicProfile,
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
