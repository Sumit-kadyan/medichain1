
'use client';
import { DrugSuggestionForm } from '@/components/ai/drug-suggestion-form';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Clock, FileText, Pill, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useClinicContext } from '@/context/clinic-context';
import { useToast } from '@/hooks/use-toast';

const patientHistory = [
    { date: '2023-08-15', type: 'visit', description: 'Consultation with Dr. Smith for annual check-up.', icon: FileText },
    { date: '2023-08-15', type: 'prescription', description: 'Prescribed Lisinopril 10mg.', icon: Pill },
    { date: '2023-02-10', type: 'visit', description: 'Follow-up for hypertension management.', icon: FileText },
];

export default function DoctorPage() {
  const { toast } = useToast();
  const { waitingList, updatePatientStatus, activePatient, setActivePatientId } = useClinicContext();
  const doctorWaitingList = waitingList.filter(p => ['called', 'in_consult', 'prescribed'].includes(p.status));

  const handleStartConsultation = (patientId: string) => {
    updatePatientStatus(patientId, 'in_consult');
    setActivePatientId(patientId);
  };
  
  const handleSendToPharmacy = (patientId: string) => {
    // This is a mock list. In a real app, this would come from the doctor's input.
    const prescribedItems = ['Amoxicillin 500mg', 'Ibuprofen 200mg', 'Cough Syrup'];
    updatePatientStatus(patientId, 'sent_to_pharmacy', prescribedItems); 
    toast({
        title: 'Prescription Sent',
        description: 'The prescription has been sent to the pharmacy queue.'
    });
    // Unset active patient after sending to pharmacy
    if (activePatient?.id === patientId) {
        setActivePatientId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Waiting List</CardTitle>
            <CardDescription>
              Patients waiting for consultation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Waiting Since</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctorWaitingList.map((patient) => (
                  <TableRow key={patient.id} className={patient.id === activePatient?.id ? 'bg-secondary' : ''}>
                    <TableCell className="font-medium">{patient.patientName}</TableCell>
                    <TableCell>
                      <Badge variant={patient.status === 'in_consult' ? 'default' : 'secondary'}>{patient.status.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell>{patient.time}</TableCell>
                    <TableCell className="space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleStartConsultation(patient.id)} disabled={patient.status !== 'called' && patient.status !== 'waiting'}>
                        <Play className="mr-2 h-4 w-4" />
                        Start 
                      </Button>
                       <Button size="sm" variant="default" onClick={() => handleSendToPharmacy(patient.id)} disabled={patient.status !== 'in_consult'}>
                        <Send className="mr-2 h-4 w-4" />
                        To Pharmacy
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <DrugSuggestionForm />
      </div>
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
             <div className="flex items-center gap-3 mb-2">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={activePatient?.avatarUrl || 'https://placehold.co/100x100.png'} alt={activePatient?.patientName} data-ai-hint="person" />
                    <AvatarFallback>{activePatient?.patientName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="font-headline">{activePatient?.patientName || 'No Patient Selected'}</CardTitle>
                    {activePatient && <CardDescription>{activePatient.gender}, {activePatient.age} years</CardDescription>}
                </div>
            </div>
          </CardHeader>
          <CardContent>
             <h3 className="font-semibold text-lg mb-4 text-foreground">Patient History</h3>
             <div className="relative pl-6">
                <div className="absolute left-0 top-0 h-full w-0.5 bg-border -translate-x-1/2 ml-3"></div>
                {activePatient ? patientHistory.map((item, index) => (
                    <div key={index} className="mb-6 flex items-start gap-4">
                        <div className="absolute left-0 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary">
                            <item.icon className="h-4 w-4"/>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-foreground">{item.description}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Clock className="h-3 w-3" />{item.date}</p>
                        </div>
                    </div>
                )) : <p className="text-sm text-muted-foreground">Select a patient to view their history.</p>}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
