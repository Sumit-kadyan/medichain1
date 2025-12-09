

'use client';
import { useState, useEffect, useRef } from 'react';
import { useClinicContext, Patient, Doctor, BillDetails, Prescription } from '@/context/clinic-context';
import { useToast } from '@/hooks/use-toast';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Play, Stethoscope, FileText, Clock, MessageSquareQuote, Pill, Loader2, XCircle, BookMarked, Printer, UserPlus } from 'lucide-react';
import { DrugSuggestionForm } from '@/components/ai/drug-suggestion-form';
import { GenerateBillDialog } from '@/components/pharmacy/generate-bill-dialog';
import { BillPreviewDialog, BillPreviewData } from '@/components/pharmacy/bill-preview-dialog';
import { AddPatientDialog } from '@/components/reception/add-patient-dialog';
import { PrescriptionPreviewDialog } from '@/components/pharmacy/prescription-preview-dialog';

const PATIENTS_PER_PAGE = 5;

export default function OneManPage() {
  const { settings, doctors, patients, loading, updatePatientStatus } = useClinicContext();
  const { toast } = useToast();
  const [mainDoctor, setMainDoctor] = useState<Doctor | null>(null);
  const [activePatient, setActivePatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleTodaysPatients, setVisibleTodaysPatients] = useState(PATIENTS_PER_PAGE);
  
  // State for consultation
  const [prescriptionItems, setPrescriptionItems] = useState<{ item: string, price: number }[]>([]);
  const [advice, setAdvice] = useState('');
  
  // State for billing
  const [isBillGenerateOpen, setBillGenerateOpen] = useState(false);
  const [billPreviewData, setBillPreviewData] = useState<BillPreviewData | null>(null);
  const [prescriptionPreviewData, setPrescriptionPreviewData] = useState<Prescription | null>(null);
  const [isAddPatientOpen, setAddPatientOpen] = useState(false);

  // Ref for auto-focus
  const itemInputsContainerRef = useRef<HTMLDivElement>(null);
  const lastItemCount = useRef(0);


  useEffect(() => {
    if (settings?.mainDoctorId && doctors.length > 0) {
      const foundDoctor = doctors.find(d => d.id === settings.mainDoctorId);
      setMainDoctor(foundDoctor || null);
    }
  }, [settings, doctors]);
  
  const todaysPatients = patients.filter(patient => {
      // Assuming the first history entry is the registration date
      if (!patient.history || patient.history.length === 0) return false;
      const registrationDate = new Date(patient.history[0].date);
      const today = new Date();
      return registrationDate.getFullYear() === today.getFullYear() &&
             registrationDate.getMonth() === today.getMonth() &&
             registrationDate.getDate() === today.getDate();
  });

  const searchedPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (patient.phone && patient.phone.includes(searchTerm))
  );

  const displayedPatients = searchTerm ? searchedPatients : todaysPatients.slice(0, visibleTodaysPatients);
  
  useEffect(() => {
    if (prescriptionItems.length > lastItemCount.current) {
        const lastInput = itemInputsContainerRef.current?.querySelector('input[placeholder="Item name (e.g., Paracetamol 500mg)"]:last-of-type') as HTMLInputElement | null;
        lastInput?.focus();
    }
    lastItemCount.current = prescriptionItems.length;
  }, [prescriptionItems.length]);

  const handleStartConsultation = (patient: Patient) => {
    if (activePatient) {
      toast({
        title: 'Consultation in Progress',
        description: 'Please finish the current consultation before starting a new one.',
        variant: 'destructive',
      });
      return;
    }
    setActivePatient(patient);
    setPrescriptionItems([]);
    setAdvice('');
  };
  
  const handleCancelConsultation = () => {
      setActivePatient(null);
      setPrescriptionItems([]);
      setAdvice('');
  }

  const handleFinishAndBill = () => {
    if (!activePatient || prescriptionItems.length === 0 || prescriptionItems.every(i => !i.item.trim())) {
      toast({
        title: 'Cannot Proceed',
        description: 'You must add at least one item to the prescription before generating a bill.',
        variant: 'destructive'
      });
      return;
    }
    setBillGenerateOpen(true);
  };
  
  const handleBillGenerated = async (billDetails: BillDetails | null, dueDate: Date, generatePrescriptionOnly: boolean) => {
    if (!activePatient || !mainDoctor) return;
  
    // Create a temporary "prescription" object for the billing components
    const tempPrescription: Prescription = {
        id: `oneman_${Date.now()}`,
        patientName: activePatient.name,
        doctor: mainDoctor.name,
        items: billDetails ? billDetails.items.map(i => i.item) : prescriptionItems.map(i => i.item).filter(i => i.trim()),
        advice,
        visitDate: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        // Dummy data for type compatibility
        waitingPatientId: `oneman_${activePatient.id}`,
        status: 'pending', 
    };

    if(generatePrescriptionOnly) {
        setPrescriptionPreviewData(tempPrescription);
        toast({
            title: 'Prescription Generated',
            description: 'The document is ready for preview and download.'
        })
    } else {
        setBillPreviewData({ prescription: tempPrescription, billDetails, dueDate });
        toast({
            title: 'Bill Generated',
            description: 'The document is ready for preview and download.'
        })
    }

    setBillGenerateOpen(false); // Close generation dialog
    
    // Reset state after finishing
    setActivePatient(null);
    setPrescriptionItems([]);
    setAdvice('');
  };

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
  
  const showMorePatients = () => {
      setVisibleTodaysPatients(prev => prev + PATIENTS_PER_PAGE);
  }

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  if (!settings?.mainDoctorId || !mainDoctor) {
      return (
          <Card>
              <CardHeader>
                  <CardTitle>Main Doctor Not Set</CardTitle>
                  <CardDescription>
                      Please go to Settings and select a "Main Doctor" to use this dashboard.
                  </CardDescription>
              </CardHeader>
          </Card>
      )
  }

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left side: Patient List and Consultation */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="font-headline">Patient Management</CardTitle>
                    <CardDescription>{searchTerm ? `Searching all ${patients.length} patients...` : `Showing patients registered today.`}</CardDescription>
                </div>
                 <Button variant="outline" onClick={() => setAddPatientOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    New Patient
                </Button>
            </div>
            <div className="relative flex-1 pt-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="search" 
                  placeholder="Search all patients by name or phone..." 
                  className="pl-8 sm:w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedPatients.map(patient => (
                  <TableRow key={patient.id} className={activePatient?.id === patient.id ? 'bg-secondary' : ''}>
                    <TableCell className="font-medium">{patient.name} ({patient.age}, {patient.gender.charAt(0)})</TableCell>
                    <TableCell>{patient.phone}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => handleStartConsultation(patient)} disabled={!!activePatient}>
                        <Play className="mr-2 h-4 w-4" />
                        Start
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                 {displayedPatients.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                            {searchTerm ? 'No patients found matching your search.' : 'No patients registered today.'}
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
            {!searchTerm && todaysPatients.length > visibleTodaysPatients && (
                <div className="pt-4 flex justify-center">
                    <Button variant="outline" onClick={showMorePatients}>Show More</Button>
                </div>
            )}
          </CardContent>
        </Card>

        {activePatient && (
            <>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <BookMarked className="h-6 w-6 text-primary" />
                           Billing Pad
                        </div>
                         <Button variant="outline" size="sm" onClick={handleCancelConsultation}>
                           <XCircle className="mr-2 h-4 w-4" />
                           Cancel Consultation
                         </Button>
                    </CardTitle>
                    <CardDescription>
                        Add prescribed items and their prices.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2" ref={itemInputsContainerRef}>
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

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <MessageSquareQuote className="h-6 w-6 text-primary" />
                        Patient Advice
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea
                        placeholder="e.g., Recommend bed rest for 2 days and plenty of fluids."
                        className="min-h-[100px]"
                        value={advice}
                        onChange={(e) => setAdvice(e.target.value)}
                    />
                </CardContent>
                 <CardFooter>
                    <Button onClick={handleFinishAndBill}>
                        <Printer className="mr-2 h-4 w-4" />
                        Finalize & Generate Bill
                    </Button>
                </CardFooter>
            </Card>
            </>
        )}

        <DrugSuggestionForm />
      </div>

      {/* Right side: Active Patient Details */}
      <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="h-12 w-12">
                      <AvatarImage src={activePatient?.avatarUrl || 'https://placehold.co/100x100.png'} alt={activePatient?.name || ''} data-ai-hint="person" />
                      <AvatarFallback>{activePatient?.name.charAt(0) || '?'}</AvatarFallback>
                  </Avatar>
                  <div>
                      <CardTitle className="font-headline">{activePatient?.name || 'No Patient Selected'}</CardTitle>
                      {activePatient && <CardDescription>{activePatient.gender}, {activePatient.age} years</CardDescription>}
                  </div>
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="font-semibold text-lg mb-4 text-foreground">Patient History</h3>
              <div className="relative pl-6">
                  <div className="absolute left-0 top-0 h-full w-0.5 bg-border -translate-x-1/2 ml-3"></div>
                  {activePatient ? (activePatient.history.length > 0 ? activePatient.history.map((item, index) => (
                      <div key={index} className="mb-6 flex items-start gap-4">
                          <div className="absolute left-0 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary">
                              <FileText className="h-4 w-4"/>
                          </div>
                          <div className="flex-1">
                              <p className="text-sm font-semibold text-foreground">{item.notes}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Clock className="h-3 w-3" />{new Date(item.date).toLocaleDateString()} - Dr. {item.doctorName}</p>
                          </div>
                      </div>
                  )) : <p className="text-sm text-muted-foreground">No history found.</p>)
                  : <p className="text-sm text-muted-foreground">Select a patient to view history.</p>}
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
    
    <AddPatientDialog open={isAddPatientOpen} onOpenChange={setAddPatientOpen} />
    
    <GenerateBillDialog
        prescription={{
            id: 'oneman-billing',
            items: prescriptionItems.map(i => i.item).filter(i => i.trim()),
            patientName: activePatient?.name || ''
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

    <PrescriptionPreviewDialog
        prescriptionData={prescriptionPreviewData}
        open={!!prescriptionPreviewData}
        onOpenChange={(open) => {
            if(!open) {
                setPrescriptionPreviewData(null)
            }
        }}
    />

    </>
  );
}

    
