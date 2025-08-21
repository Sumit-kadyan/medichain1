
'use client';
import { useState } from 'react';
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
import { FileText, Printer, CheckCircle, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const initialPharmacyQueue = [
  {
    patientName: 'Sophia Miller',
    doctor: 'Dr. Michael Brown',
    time: '10:42 AM',
    items: ['Amoxicillin 500mg', 'Ibuprofen 200mg'],
    status: 'pending',
  },
  {
    patientName: 'Ava Davis',
    doctor: 'Dr. Emily White',
    time: '10:50 AM',
    items: ['Lisinopril 10mg'],
    status: 'pending',
  },
    {
    patientName: 'William Garcia',
    doctor: 'Dr. John Smith',
    time: '11:05 AM',
    items: ['Metformin 500mg', 'Atorvastatin 20mg'],
    status: 'dispensed',
  },
];

type PrescriptionStatus = 'pending' | 'dispensed';

type Prescription = {
  patientName: string;
  doctor: string;
  time: string;
  items: string[];
  status: PrescriptionStatus;
};

export default function PharmacyPage() {
  const { toast } = useToast();
  const [pharmacyQueue, setPharmacyQueue] = useState<Prescription[]>(initialPharmacyQueue);

  const handleMarkAsDispensed = (patientName: string) => {
    setPharmacyQueue(prevQueue =>
      prevQueue.map(p =>
        p.patientName === patientName ? { ...p, status: 'dispensed' } : p
      )
    );
    toast({
      title: 'Success',
      description: `${patientName}'s prescription marked as dispensed.`,
    });
  };

  const handleGenerateBill = (prescription: Prescription) => {
    // In a real app, this would generate a bill.
    alert(`Bill Generated for ${prescription.patientName}:\n\nItems: ${prescription.items.join(', ')}\n\nThis is a mock action.`);
  };

  const handleViewDetails = (prescription: Prescription) => {
    // In a real app, this would show a detailed modal.
    alert(`Details for ${prescription.patientName}:\n\nDoctor: ${prescription.doctor}\nItems: ${prescription.items.join(', ')}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Pharmacy Queue</CardTitle>
        <CardDescription>
          Prescriptions waiting for dispensing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Prescribing Doctor</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pharmacyQueue.map((prescription, index) => (
              <TableRow key={index} className={prescription.status === 'dispensed' ? 'bg-secondary/50' : ''}>
                <TableCell className="font-medium">{prescription.patientName}</TableCell>
                <TableCell>{prescription.doctor}</TableCell>
                <TableCell>{prescription.time}</TableCell>
                <TableCell>
                  <Badge variant={prescription.status === 'dispensed' ? 'default' : 'outline'}>
                    {prescription.status}
                  </Badge>
                </TableCell>
                <TableCell className="space-x-2">
                  <Button size="sm" variant="outline" onClick={() => handleViewDetails(prescription)}>
                    <FileText className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                   <Button size="sm" variant="outline" disabled={prescription.status === 'dispensed'} onClick={() => handleGenerateBill(prescription)}>
                    <Printer className="mr-2 h-4 w-4" />
                    Generate Bill
                  </Button>
                   <Button size="sm" variant="default" disabled={prescription.status === 'dispensed'} onClick={() => handleMarkAsDispensed(prescription.patientName)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Dispensed
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
