

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  UserPlus,
  Send,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useClinicContext, Patient } from '@/context/clinic-context';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { AddPatientDialog } from './add-patient-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, startAfter, limit, getDocs, endBefore, limitToLast, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';


const PAGE_SIZE = 7;

export function PatientsTab() {
  const { toast } = useToast();
  const { doctors, addPatientToWaitingList, clinicId } = useClinicContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddPatientOpen, setAddPatientOpen] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<Record<string, string>>({});
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [firstDoc, setFirstDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchPatients = useCallback(async (direction: 'next' | 'prev' | 'first' = 'first') => {
    if (!clinicId) return;
    setLoading(true);

    try {
      const patientsCollection = collection(db, 'clinics', clinicId, 'patients');
      let q;

      if (direction === 'first') {
        q = query(patientsCollection, orderBy('name'), limit(PAGE_SIZE));
        setPage(1);
      } else if (direction === 'next' && lastDoc) {
        q = query(patientsCollection, orderBy('name'), startAfter(lastDoc), limit(PAGE_SIZE));
        setPage(p => p + 1);
      } else if (direction === 'prev' && firstDoc) {
        q = query(patientsCollection, orderBy('name', 'desc'), startAfter(firstDoc), limit(PAGE_SIZE));
        setPage(p => p - 1);
      } else {
        setLoading(false);
        return;
      }
      
      const docSnap = await getDocs(q);
      const patientData = docSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));

      if(direction === 'prev') {
        patientData.reverse();
      }

      if (!docSnap.empty) {
        setFirstDoc(docSnap.docs[0]);
        setLastDoc(docSnap.docs[docSnap.docs.length - 1]);
        setPatients(patientData);
        setHasMore(docSnap.docs.length === PAGE_SIZE);
      } else {
        setHasMore(false);
        if (direction === 'next') {
            // You are on the last page, no need to change the patient list
             toast({title: "End of List", description: "You have reached the last page of patients."});
        }
      }

    } catch (error) {
      console.error("Failed to fetch patients:", error);
      toast({
        title: "Error",
        description: "Could not fetch patient data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [clinicId, lastDoc, firstDoc, toast]);

  useEffect(() => {
    fetchPatients('first');
  }, [clinicId]); // Only refetch from first page if clinicId changes


  const handleAddToWaitingList = async (patient: Patient) => {
    const doctorId = selectedDoctorId[patient.id];
     if (!doctorId) {
        toast({ title: 'Error', description: 'Please select a doctor for this patient.', variant: 'destructive' });
        return;
    }
    
    try {
      await addPatientToWaitingList(patient, doctorId);
    } catch(err) {
      toast({ title: 'Error', description: 'Could not add patient to waiting list.', variant: 'destructive' });
    }
  };
  
  const filteredPatients = useMemo(() => {
    if (!searchTerm) return patients;
    return patients.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone.includes(searchTerm)
      );
  }, [patients, searchTerm]);


  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Patient Management</CardTitle>
        <CardDescription>
          Search, add, and manage patient records.
        </CardDescription>
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="search" 
                  placeholder="Search current page by name or phone..." 
                  className="pl-8 sm:w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className='flex gap-2'>
              <Button variant="outline" onClick={() => setAddPatientOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                New Patient
              </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && patients.length === 0 ? (
           <div className="flex justify-center items-center h-64">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
           </div>
        ) : filteredPatients.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No patients found.</p>
        ) : (
            <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden sm:table-cell">Phone</TableHead>
                        <TableHead className="w-[200px]">Assign Doctor</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredPatients.map((patient) => (
                    <TableRow key={patient.id}>
                        <TableCell className="font-medium">{patient.name}</TableCell>
                        <TableCell className="hidden sm:table-cell">{patient.phone}</TableCell>
                         <TableCell>
                           <Select onValueChange={(docId) => setSelectedDoctorId(prev => ({...prev, [patient.id]: docId}))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Doctor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {doctors.map(doc => <SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>)}
                                </SelectContent>
                           </Select>
                        </TableCell>
                        <TableCell>
                            <Button size="sm" onClick={() => handleAddToWaitingList(patient)}>
                                <Send className="mr-2 h-4 w-4" />
                                Add to Waitlist
                            </Button>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
            </Table>
            </div>
        )}
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPatients('prev')}
            disabled={page <= 1 || loading}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPatients('next')}
            disabled={!hasMore || loading}
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
    <AddPatientDialog open={isAddPatientOpen} onOpenChange={setAddPatientOpen} />
    </>
  );
}
