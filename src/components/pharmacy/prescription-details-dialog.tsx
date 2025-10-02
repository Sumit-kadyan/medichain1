
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Prescription } from '@/context/clinic-context';
import { User, Stethoscope, Clock, Pill, MessageSquareQuote } from 'lucide-react';
import { Separator } from '../ui/separator';

interface PrescriptionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prescription: Prescription | null;
}

export function PrescriptionDetailsDialog({
  open,
  onOpenChange,
  prescription,
}: PrescriptionDetailsDialogProps) {
  if (!prescription) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Prescription Details</DialogTitle>
          <DialogDescription>
            Review the prescription items and advice before dispensing.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4"/>
                    <span>Patient:</span>
                </div>
                <p className="font-semibold">{prescription.patientName}</p>
            </div>
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Stethoscope className="h-4 w-4"/>
                    <span>Doctor:</span>
                </div>
                <p className="font-semibold">{prescription.doctor}</p>
            </div>
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4"/>
                    <span>Time:</span>
                </div>
                <p className="font-semibold">{prescription.time}</p>
            </div>

            <Separator className="my-4"/>

            <div>
                <h3 className="font-semibold mb-2">Prescribed Items:</h3>
                <ul className="space-y-2 list-disc pl-5">
                    {prescription.items.map((item, index) => (
                        <li key={index} className="text-sm flex items-center gap-2">
                           <Pill className="h-4 w-4 text-primary" />
                           <span>{item}</span>
                        </li>
                    ))}
                </ul>
            </div>
             {prescription.advice && (
                <>
                    <Separator />
                    <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                           <MessageSquareQuote className="h-4 w-4 text-primary" />
                           <span>Doctor's Advice:</span>
                        </h3>
                        <blockquote className="mt-2 border-l-2 pl-4 italic text-sm text-muted-foreground">
                           {prescription.advice}
                        </blockquote>
                    </div>
                </>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
