
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
import { FileText, Printer, CheckCircle } from 'lucide-react';
import { useClinicContext, Prescription } from '@/context/clinic-context';
import { PrescriptionDetailsDialog } from '@/components/pharmacy/prescription-details-dialog';


export default function PharmacyPage() {
  const { pharmacyQueue, updatePrescriptionStatus } = useClinicContext();
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  
  const handleMarkAsDispensed = (prescriptionId: string) => {
    updatePrescriptionStatus(prescriptionId, 'dispensed');
  };

  const handleGenerateBill = (prescription: Prescription) => {
    // In a real app, this would generate a bill.
    alert(`Bill Generated for ${prescription.patientName}:\n\nItems: ${prescription.items.join(', ')}\n\nThis is a mock action.`);
  };


  return (
    <>
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
              {pharmacyQueue.map((prescription) => (
                <TableRow key={prescription.id} className={prescription.status === 'dispensed' ? 'bg-secondary/50 text-muted-foreground' : ''}>
                  <TableCell className="font-medium">{prescription.patientName}</TableCell>
                  <TableCell>{prescription.doctor}</TableCell>
                  <TableCell>{prescription.time}</TableCell>
                  <TableCell>
                    <Badge variant={prescription.status === 'dispensed' ? 'outline' : 'default'}>
                      {prescription.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button size="sm" variant="outline" onClick={() => setSelectedPrescription(prescription)}>
                      <FileText className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                     <Button size="sm" variant="outline" disabled={prescription.status === 'dispensed'} onClick={() => handleGenerateBill(prescription)}>
                      <Printer className="mr-2 h-4 w-4" />
                      Generate Bill
                    </Button>
                     <Button size="sm" variant="default" disabled={prescription.status === 'dispensed'} onClick={() => handleMarkAsDispensed(prescription.id)}>
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
      <PrescriptionDetailsDialog 
        prescription={selectedPrescription}
        open={!!selectedPrescription}
        onOpenChange={(open) => {
          if(!open) {
            setSelectedPrescription(null);
          }
        }}
      />
    </>
  );
}
