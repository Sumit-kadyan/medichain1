
'use client';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Play, Clock, FileText, Pill, Send, ArrowLeft, Loader2, BookMarked, XCircle, CheckCircle, MessageSquareQuote } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useClinicContext, Doctor, PatientStatus, WaitingPatient, PatientHistory } from '@/context/clinic-context';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { DrugSuggestionForm } from '@/components/ai/drug-suggestion-form';


const statusConfig: Record<PatientStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' | null }> = {
    waiting: { label: 'Waiting', variant: 'outline' },
    called: { label: 'Called', variant: 'secondary' },
    in_consult: { label: 'In Consultation', variant: 'default' },
    prescribed: { label: 'Consulted', variant: 'default' },
    sent_to_pharmacy: { label: 'At Pharmacy', variant: 'secondary' },
    dispensed: { label: 'Done', variant: 'secondary' },
};


function DoctorSelection({ doctors, onSelectDoctor }: { doctors: Doctor[], onSelectDoctor: (doctor: Doctor) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <CardTitle className="font-headline text-center">Select Your Profile</CardTitle>
                <CardDescription className="text-center">
                    Please select your profile to access the dashboard.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {doctors.map(doctor => (
                    <Card
                        key={doctor.id}
                        className="p-4 flex flex-col items-center gap-4 hover:bg-secondary transition-colors cursor-pointer"
                        onClick={() => onSelectDoctor(doctor)}
                    >
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={doctor.avatarUrl} alt={doctor.name} data-ai-hint="doctor person" />
                            <AvatarFallback>{doctor.initials}</AvatarFallback>
                        </Avatar>
                        <div className="text-center">
                            <p className="font-semibold">{doctor.name}</p>
                            <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                        </div>
                    </Card>
                ))}
            </CardContent>
        </Card>
    </div>
  );
}

function DoctorDashboard({ doctor, onBack }: { doctor: Doctor, onBack: () => void }) {
  const { toast } = useToast();
  const { waitingList, patients, updatePatientStatus } = useClinicContext();
  const [prescription, setPrescription] = useState('');
  const [advice, setAdvice] = useState('');
  const [activePatient, setActivePatient] = useState<WaitingPatient | null>(null);

  const doctorWaitingList = waitingList.filter(p => p.doctorId === doctor.id && p.status !== 'sent_to_pharmacy' && p.status !== 'dispensed' && p.status !== 'prescribed');
  const patientInConsultation = waitingList.find(p => p.doctorId === doctor.id && p.status === 'in_consult');
  
  const patientDetails = activePatient ? patients.find(p => p.id === activePatient.patientId) : null;
  const patientHistory: PatientHistory[] = patientDetails?.history || [];

  const handleStartConsultation = (patient: WaitingPatient) => {
    updatePatientStatus(patient.id, 'in_consult');
    setActivePatient(patient);
    setPrescription(''); // Clear previous prescription
    setAdvice(''); // Clear previous advice
  };

  const handleSendToPharmacy = () => {
    if (!activePatient) return;
    if (!prescription.trim()) {
        toast({
            title: 'Empty Prescription',
            description: 'Please write a prescription before sending to the pharmacy.',
            variant: 'destructive',
        });
        return;
    }
    const prescribedItems = prescription.split('\n').filter(line => line.trim() !== '');
    updatePatientStatus(activePatient.id, 'sent_to_pharmacy', prescribedItems, advice);
    setActivePatient(null);
    setPrescription('');
    setAdvice('');
  };
  
  const handleEndConsultation = (patientId: string) => {
      updatePatientStatus(patientId, 'prescribed');
      setActivePatient(null);
      setPrescription('');
      setAdvice('');
  };
  
  const currentActivePatientInList = waitingList.find(p => p.id === activePatient?.id);

  return (
    <>
      <Button variant="outline" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Doctor Selection
      </Button>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Waiting List for {doctor.name}</CardTitle>
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
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {doctorWaitingList.map((patient) => {
                    const config = statusConfig[patient.status];
                    const isInConsult = patient.id === patientInConsultation?.id;
                    const isAnotherPatientInConsult = !!patientInConsultation && patientInConsultation.id !== patient.id;

                    return (
                        <TableRow key={patient.id} className={isInConsult ? 'bg-secondary' : ''}>
                          <TableCell className="font-medium">{patient.patientName}</TableCell>
                          <TableCell>
                            <Badge variant={config.variant || 'default'}>{config.label}</Badge>
                          </TableCell>
                          <TableCell>{patient.time}</TableCell>
                          <TableCell className="text-right space-x-2">
                             {isInConsult ? (
                                <>
                                  <Button size="sm" variant="secondary" disabled>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    In Consultation
                                  </Button>
                                   <Button size="sm" variant="outline" onClick={() => handleEndConsultation(patient.id)}>
                                     <XCircle className="mr-2 h-4 w-4" />
                                     End
                                   </Button>
                                </>
                             ) : (
                                <Button size="sm" variant="outline" onClick={() => handleStartConsultation(patient)} disabled={isAnotherPatientInConsult}>
                                  <Play className="mr-2 h-4 w-4" />
                                  Start
                                </Button>
                             )}
                          </TableCell>
                        </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {currentActivePatientInList && currentActivePatientInList.status === 'in_consult' && (
            <>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <BookMarked className="h-6 w-6 text-primary" />
                        Prescription Pad
                    </CardTitle>
                    <CardDescription>
                        Write the prescription below. Each item should be on a new line. Then send to pharmacy.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Textarea
                        placeholder="e.g.,&#10;Amoxicillin 500mg - 1 tab 3 times a day for 7 days&#10;Ibuprofen 200mg - as needed for pain"
                        className="min-h-[150px] font-mono text-sm"
                        value={prescription}
                        onChange={(e) => setPrescription(e.target.value)}
                    />
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button onClick={handleSendToPharmacy}>
                        <Send className="mr-2 h-4 w-4" />
                        Send to Pharmacy
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <MessageSquareQuote className="h-6 w-6 text-primary" />
                        Patient Advice (Optional)
                    </CardTitle>
                    <CardDescription>
                       Provide any additional advice or notes for the patient. This will appear on their bill.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Textarea
                        placeholder="e.g., Recommend bed rest for 2 days and plenty of fluids."
                        className="min-h-[100px]"
                        value={advice}
                        onChange={(e) => setAdvice(e.target.value)}
                    />
                </CardContent>
            </Card>
            </>
           )}

          <DrugSuggestionForm />
        </div>
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                  <Avatar className="h-12 w-12">
                      <AvatarImage src={activePatient?.avatarUrl || 'https://placehold.co/100x100.png'} alt={activePatient?.patientName || ''} data-ai-hint="person" />
                      <AvatarFallback>{activePatient?.patientName.charAt(0) || '?'}</AvatarFallback>
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
                  {activePatient ? (patientHistory.length > 0 ? patientHistory.map((item, index) => (
                      <div key={index} className="mb-6 flex items-start gap-4">
                          <div className="absolute left-0 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary">
                              <FileText className="h-4 w-4"/>
                          </div>
                          <div className="flex-1">
                              <p className="text-sm font-semibold text-foreground">{item.notes}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Clock className="h-3 w-3" />{new Date(item.date).toLocaleDateString()} - Dr. {item.doctorName}</p>
                          </div>
                      </div>
                  )) : <p className="text-sm text-muted-foreground">No history found for this patient.</p>)
                  : <p className="text-sm text-muted-foreground">Select a patient to view their history.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}


export default function DoctorPage() {
    const { doctors, loading } = useClinicContext();
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!selectedDoctor) {
        return <DoctorSelection doctors={doctors} onSelectDoctor={setSelectedDoctor} />
    }

    return <DoctorDashboard doctor={selectedDoctor} onBack={() => setSelectedDoctor(null)} />;
}
