
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
  MoreHorizontal,
  Search,
  UserPlus,
  Edit,
  FileText,
  Send,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useClinicContext, Patient } from '@/context/clinic-context';
import { useState, useMemo } from 'react';
import { AddPatientDialog } from './add-patient-dialog';

export function PatientsTab() {
  const { toast } = useToast();
  const { patients, addPatientToWaitingList } = useClinicContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddPatientOpen, setAddPatientOpen] = useState(false);

  const handleAddToWaitingList = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    if (!patient.doctorId) {
        toast({ title: 'Error', description: 'This patient is not assigned to a doctor.', variant: 'destructive' });
        return;
    }
    addPatientToWaitingList(patient.id);
  };
  
  const handleAction = (action: string, patientName?: string) => {
    const message = patientName ? `${action} for ${patientName}` : action;
    toast({
      title: 'Action Triggered',
      description: `${message}. This is a mock action and doesn't affect data.`,
    });
  };

  const filteredPatients = useMemo(() => {
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
        {filteredPatients.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No patients found.</p>
        ) : (
            <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden sm:table-cell">Phone</TableHead>
                        <TableHead className="hidden md:table-cell">Gender / Age</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredPatients.map((patient) => (
                    <TableRow key={patient.id}>
                        <TableCell className="font-medium">{patient.name}</TableCell>
                        <TableCell className="hidden sm:table-cell">{patient.phone}</TableCell>
                        <TableCell className="hidden md:table-cell">{`${patient.gender}, ${patient.age}`}</TableCell>
                        <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleAddToWaitingList(patient.id)}>
                                    <Send className="mr-2 h-4 w-4" />
                                    Add to Waiting List
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAction('Edit Patient', patient.name)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Patient
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAction('View History', patient.name)}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    View History
                                </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
            </Table>
            </div>
        )}
      </CardContent>
    </Card>
    <AddPatientDialog open={isAddPatientOpen} onOpenChange={setAddPatientOpen} />
    </>
  );
}
