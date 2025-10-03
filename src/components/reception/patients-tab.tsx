

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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useClinicContext, Patient } from '@/context/clinic-context';
import { useState, useMemo } from 'react';
import { AddPatientDialog } from './add-patient-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export function PatientsTab() {
  const { toast } = useToast();
  const { patients, doctors, addPatientToWaitingList } = useClinicContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddPatientOpen, setAddPatientOpen] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<Record<string, string>>({});

  const filteredPatients = useMemo(() => {
    if (!searchTerm) return patients;
    return patients.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone.includes(searchTerm)
    );
  }, [patients, searchTerm]);

  const handleAddToWaitingList = (patient: Patient) => {
    const doctorId = selectedDoctorId[patient.id];
     if (!doctorId) {
        toast({ title: 'Error', description: 'Please select a doctor for this patient.', variant: 'destructive' });
        return;
    }
    
    addPatientToWaitingList(patient, doctorId);
  };


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
                  placeholder="Search by name or phone..." 
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
      </CardContent>
    </Card>
    <AddPatientDialog open={isAddPatientOpen} onOpenChange={setAddPatientOpen} />
    </>
  );
}
