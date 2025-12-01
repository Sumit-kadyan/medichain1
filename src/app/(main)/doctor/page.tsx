
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Play, Clock, FileText, Send, ArrowLeft, Loader2, BookMarked, XCircle, CheckCircle, MessageSquareQuote, Printer, Pill } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useClinicContext, Doctor, PatientStatus, WaitingPatient, PatientHistory, Patient, BillDetails } from '@/context/clinic-context';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { DrugSuggestionForm } from '@/components/ai/drug-suggestion-form';
import { PinEntryDialog } from '@/components/doctor/pin-entry-dialog';
import { GenerateBillDialog } from '@/components/pharmacy/generate-bill-dialog';
import { BillPreviewDialog } from '@/components/pharmacy/bill-preview-dialog';

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
                    Please select your profile to continue.
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
  const router = useRouter();
  const { toast } = useToast();
  const { waitingList, getPatientById, updatePatientStatus, settings } = useClinicContext();
  
  // State for consultation
  const [prescription, setPrescription] = useState('');
  const [advice, setAdvice] = useState('');
  const [prescriptionItems, setPrescriptionItems] = useState<{ item: string, price: number }[]>([]);

  // State for patient management
  const [activePatient, setActivePatient] = useState<WaitingPatient | null>(null);
  const [patientDetails, setPatientDetails] = useState<Patient | null>(null);

  // State for billing
  const [isBillGenerateOpen, setBillGenerateOpen] = useState(false);
  const [billPreviewData, setBillPreviewData] = useState<{ prescription: any, billDetails: BillDetails, dueDate: Date } | null>(null);
  
  const isNoPharmacyMode = settings?.clinicStructure === 'no_pharmacy';

  const doctorWaitingList = waitingList.filter(p => p.doctorId === doctor.id && p.status !== 'sent_to_pharmacy' && p.status !== 'dispensed' && p.status !== 'prescribed');
  const patientInConsultation = waitingList.find(p => p.doctorId === doctor.id && p.status === 'in_consult');
  
  const patientHistory: PatientHistory[] = patientDetails?.history || [];
  
  useEffect(() => {
    const fetchDetails = async () => {
        if (activePatient?.patientId) {
            const details = await getPatientById(activePatient.patientId);
            setPatientDetails(details);
        } else {
            setPatientDetails(null);
        }
    }
    fetchDetails();
  }, [activePatient, getPatientById]);


  const handleStartConsultation = (patient: WaitingPatient) => {
    updatePatientStatus(patient.id, 'in_consult');
    setActivePatient(patient);
    // Clear previous consultation data
    setPrescription('');
    setAdvice('');
    setPrescriptionItems([]);
  };
  
  const handleEndConsultation = (patientId: string) => {
      updatePatientStatus(patientId, 'waiting'); // Revert to waiting
      setActivePatient(null);
      setPrescription('');
      setAdvice('');
      setPrescriptionItems([]);
  };

  const handleFinishAndPrescribe = async () => {
     if (!activePatient) return;
    
    // This logic is for the "No Pharmacy" mode which now uses the billing pad.
    if (isNoPharmacyMode) {
        if (prescriptionItems.length === 0) {
            toast({
                title: 'Cannot Proceed',
                description: 'You must add at least one item before generating a bill.',
                variant: 'destructive'
            });
            return;
        }
        setBillGenerateOpen(true);
        return;
    }
    
    // This is for the standard workflow
    if (!prescription.trim()) {
        toast({
            title: 'Empty Prescription',
            description: 'Please write a prescription before finishing the consultation.',
            variant: 'destructive',
        });
        return;
    }
    const prescribedItems = prescription.split('\n').filter(line => line.trim() !== '');
    await updatePatientStatus(activePatient.id, 'prescribed', prescribedItems, advice);

    setActivePatient(null);
    setPrescription('');
    setAdvice('');
    setPrescriptionItems([]);
  }

  const handleBillGenerated = async (billDetails: BillDetails, dueDate: Date) => {
    if (!activePatient || !doctor) return;

    const items = billDetails.items.map(i => i.item);
    const prescriptionId = await updatePatientStatus(activePatient.id, 'prescribed', items, advice, billDetails, dueDate);
    
    const tempPrescription = {
        id: prescriptionId,
        patientName: activePatient.name,
        doctor: doctor.name,
        items: items,
        advice,
        visitDate: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setBillPreviewData({ prescription: tempPrescription, billDetails, dueDate });
    setBillGenerateOpen(false); // Close generation dialog
    
    // Reset state after finishing
    setActivePatient(null);
    setPrescriptionItems([]);
    setAdvice('');
    
    toast({
        title: 'Bill Generated',
        description: 'The bill is ready for preview and download.'
    })
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
  
  // Billing pad item management
  const handleItemChange = (index: number, field: 'item' | 'price', value: string) => {
    const newItems = [...prescriptionItems];
    if (field === 'price') {
      newItems[index][field] = parseFloat(value) || 0;
    } else {
      newItems[index][field] = value;
    }
    setPrescriptionItems(newItems);
  };

  const addNewItem = () => {
    setPrescriptionItems([...prescriptionItems, { item: '', price: 0 }]);
  };

  const removeItem = (index: number) => {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index));
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
                                     Cancel
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
            {isNoPharmacyMode ? (
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center justify-between">
                            <div className="flex items-center gap-2">
                            <BookMarked className="h-6 w-6 text-primary" />
                            Billing Pad
                            </div>
                        </CardTitle>
                        <CardDescription>
                            Add prescribed items and their prices.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {prescriptionItems.map((item, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Input 
                                        placeholder="Item name (e.g., Paracetamol 500mg)"
                                        value={item.item}
                                        onChange={(e) => handleItemChange(index, 'item', e.target.value)}
                                        className="flex-1"
                                    />
                                    <Input 
                                        type="number"
                                        placeholder="Price"
                                        value={item.price || ''}
                                        onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                                        className="w-28"
                                    />
                                    <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>
                                        <XCircle className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <Button variant="outline" size="sm" onClick={addNewItem} className="mt-4">
                            Add Item
                        </Button>
                    </CardContent>
                 </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                            <BookMarked className="h-6 w-6 text-primary" />
                            Prescription Pad
                        </CardTitle>
                        <CardDescription>
                            Write the prescription below. Each item should be on a new line.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            placeholder="e.g.,
Amoxicillin 500mg - 1 tab 3 times a day for 7 days
Ibuprofen 200mg - as needed for pain"
                            className="min-h-[150px] font-mono text-sm"
                            value={prescription}
                            onChange={(e) => setPrescription(e.target.value)}
                        />
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <MessageSquareQuote className="h-6 w-6 text-primary" />
                        Patient Advice (Optional)
                    </CardTitle>
                    <CardDescription>
                       Provide any additional advice or notes for the patient. This will appear on their bill or prescription.
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

            <Card>
                <CardFooter className="flex justify-end gap-2">
                   {isNoPharmacyMode ? (
                        <Button onClick={handleFinishAndPrescribe}>
                            <Printer className="mr-2 h-4 w-4" />
                            Finalize & Generate Bill
                        </Button>
                   ) : (
                        <Button onClick={handleSendToPharmacy}>
                            <Send className="mr-2 h-4 w-4" />
                            Send to Pharmacy
                        </Button>
                   )}
                </CardFooter>
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
      
      <GenerateBillDialog
        prescription={{
            id: 'doctor-billing',
            items: prescriptionItems.map(i => i.item),
            patientName: activePatient?.patientName || ''
        } as any}
        open={isBillGenerateOpen}
        onOpenChange={setBillGenerateOpen}
        onBillGenerated={handleBillGenerated}
        forcePrices={prescriptionItems}
      />
      
      <BillPreviewDialog
        billData={billPreviewData}
        open={!!billPreviewData}
        onOpenChange={(open) => {
            if(!open) {
                setBillPreviewData(null)
            }
        }}
      />
    </>
  );
}


export default function DoctorPage() {
    const { doctors, loading, verifyDoctorPincode, settings } = useClinicContext();
    const { toast } = useToast();
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [authenticatedDoctor, setAuthenticatedDoctor] = useState<Doctor | null>(null);
    const [isPinDialogOpen, setPinDialogOpen] = useState(false);

    const handleSelectDoctor = (doctor: Doctor) => {
        setSelectedDoctor(doctor);
        setPinDialogOpen(true);
    };

    const handleVerifyPin = async (pincode: string) => {
        if (!selectedDoctor) return;

        const isValid = await verifyDoctorPincode(selectedDoctor.id, pincode);

        if (isValid) {
            setAuthenticatedDoctor(selectedDoctor);
            setPinDialogOpen(false);
            toast({
                title: 'Access Granted',
                description: `Welcome, ${selectedDoctor.name}.`,
            });
        } else {
            toast({
                title: 'Access Denied',
                description: 'The PIN you entered is incorrect.',
                variant: 'destructive',
            });
        }
    };
    
    const handleBackToSelection = () => {
        setAuthenticatedDoctor(null);
        setSelectedDoctor(null);
    }

    if (loading || !settings) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    if (!authenticatedDoctor) {
        return (
            <>
                <DoctorSelection doctors={doctors} onSelectDoctor={handleSelectDoctor} />
                <PinEntryDialog
                    open={isPinDialogOpen}
                    onOpenChange={setPinDialogOpen}
                    doctor={selectedDoctor}
                    onVerify={handleVerifyPin}
                />
            </>
        )
    }

    return <DoctorDashboard doctor={authenticatedDoctor} onBack={handleBackToSelection} />;
}
