
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
  CalendarDays,
  RefreshCw,
  ArrowRight,
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
import { Badge } from '../ui/badge';

export function PatientsTab() {
  const { toast } = useToast();
  const { patients, addPatientToWaitingList, doctors, receiptValidityDays, updatePatientRegistration } = useClinicContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddPatientOpen, setAddPatientOpen] = useState(false);

  const handleAddToWaitingList = (patientId: string) => {
    if (doctors.length === 0) {
      toast({ title: 'Error', description: 'Please add a doctor first.', variant: 'destructive' });
      return;
    }
    // In a real app, we might let the user choose. For now, assign to first available.
    const doctor = doctors[0];
    addPatientToWaitingList(patientId, doctor.id);
  };
  
  const handleAction = (action: string, patientName?: string) => {
    const message = patientName ? `${action} for ${patientName}` : action;
    toast({
      title: 'Action Triggered',
      description: `${message}. This is a mock action and doesn't affect data.`,
    });
  };

  const isReceiptValid = (lastVisit: string) => {
    const lastVisitDate = new Date(lastVisit);
    const expiryDate = new Date(lastVisitDate);
    expiryDate.setDate(expiryDate.getDate() + receiptValidityDays);
    return new Date() < expiryDate;
  }

  const groupedPatients = useMemo(() => {
    const filtered = patients.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone.includes(searchTerm)
      );

    return filtered.reduce((acc, patient) => {
        const date = new Date(patient.lastVisit).toDateString();
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(patient);
        return acc;
    }, {} as Record<string, Patient[]>);

  }, [patients, searchTerm]);

  const sortedDates = useMemo(() => {
    return Object.keys(groupedPatients).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [groupedPatients]);

  const getStatusVariant = (status: 'Added' | 'Renewed' | 'Continued') => {
    switch (status) {
        case 'Added': return 'default';
        case 'Renewed': return 'secondary';
        case 'Continued': return 'outline';
        default: return 'default';
    }
  }


  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Patient Management</CardTitle>
        <CardDescription>
          Search, add, and manage patient records and visits.
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
        {sortedDates.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No patients found.</p>
        ) : (
          sortedDates.map(date => (
            <div key={date} className="mb-8">
               <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="h-5 w-5" />
                <span>{new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
               </h3>
               <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead className="hidden sm:table-cell">Phone</TableHead>
                          <TableHead className="hidden md:table-cell">Gender / Age</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {groupedPatients[date].map((patient) => (
                        <TableRow key={patient.id}>
                            <TableCell className="font-medium">{patient.name}</TableCell>
                            <TableCell className="hidden sm:table-cell">{patient.phone}</TableCell>
                            <TableCell className="hidden md:table-cell">{`${patient.gender}, ${patient.age}`}</TableCell>
                            <TableCell>
                                <Badge variant={getStatusVariant(patient.registrationType)}>
                                    {patient.registrationType}
                                </Badge>
                            </TableCell>
                            <TableCell className="space-x-2">
                              {isReceiptValid(patient.lastVisit) ? (
                                <Button size="sm" variant="secondary" onClick={() => updatePatientRegistration(patient.id, 'Renewed')}>
                                  <RefreshCw className="mr-2 h-4 w-4"/>
                                  Renew
                                </Button>
                              ) : (
                                 <Button size="sm" variant="outline" onClick={() => updatePatientRegistration(patient.id, 'Continued')}>
                                  <ArrowRight className="mr-2 h-4 w-4"/>
                                  Continue
                                </Button>
                              )}
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
            </div>
          ))
        )}
      </CardContent>
    </Card>
    <AddPatientDialog open={isAddPatientOpen} onOpenChange={setAddPatientOpen} />
    </>
  );
}
