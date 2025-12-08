

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Prescription, useClinicContext, BillDetails } from '@/context/clinic-context';
import { CalendarIcon, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';

interface GenerateBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prescription: Prescription | null;
  onBillGenerated: (billDetails: BillDetails | null, dueDate: Date, generatePrescriptionOnly: boolean) => void;
  forcePrices?: { item: string, price: number }[];
}

export function GenerateBillDialog({
  open,
  onOpenChange,
  prescription,
  onBillGenerated,
  forcePrices,
}: GenerateBillDialogProps) {
  const { settings } = useClinicContext();
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [includeAppointmentFee, setIncludeAppointmentFee] = useState(true);
  const [applyRoundOff, setApplyRoundOff] = useState(true);

  useEffect(() => {
    if (open && prescription) {
      // Set due date
      const today = new Date();
      const newDueDate = new Date(today);
      newDueDate.setDate(today.getDate() + (settings?.receiptValidityDays || 7));
      setDueDate(newDueDate);

      // Set prices
      let initialPrices: Record<string, number> = {};
      if (forcePrices) {
        initialPrices = forcePrices.reduce((acc, item) => {
            acc[item.item] = item.price;
            return acc;
        }, {} as Record<string, number>);
      } else {
        initialPrices = prescription.items.reduce((acc, item) => {
            acc[item] = 0;
            return acc;
        }, {} as Record<string, number>);
      }
      setPrices(initialPrices);
      
      setIncludeAppointmentFee(true);
      setApplyRoundOff(true);
    }
  }, [open, prescription, settings, forcePrices]);

  if (!prescription || !settings) return null;

  const handlePriceChange = (item: string, value: string) => {
    const newPrices = { ...prices };
    newPrices[item] = Number(value) || 0;
    setPrices(newPrices);
  };

  const subtotal = Object.values(prices).reduce((sum, price) => sum + (price || 0), 0);
  const taxAmount = settings.taxType !== 'No Tax' ? subtotal * (settings.taxPercentage / 100) : 0;
  const fee = includeAppointmentFee ? settings.appointmentFee : 0;
  const totalBeforeRoundOff = subtotal + taxAmount + fee;
  const roundOffAmount = applyRoundOff ? Math.round(totalBeforeRoundOff) - totalBeforeRoundOff : 0;
  const finalTotal = totalBeforeRoundOff + roundOffAmount;

  
  const handleGenerateClick = (generatePrescriptionOnly: boolean) => {
    if (!dueDate) return;
    
    if (generatePrescriptionOnly) {
        const billDetails: BillDetails = {
            items: [], // No items with prices for prescription only
            taxInfo: { type: 'No Tax', percentage: 0, amount: 0 },
            appointmentFee: fee, // Still might want to show this
            roundOff: 0,
            total: fee,
        };
        onBillGenerated(billDetails, dueDate, true);
    } else {
        const billDetails: BillDetails = {
            items: prescription.items.map(item => ({ item, price: prices[item] || 0 })),
            taxInfo: {
                type: settings.taxType,
                percentage: settings.taxPercentage,
                amount: taxAmount,
            },
            appointmentFee: fee,
            roundOff: roundOffAmount,
            total: finalTotal,
        };
        onBillGenerated(billDetails, dueDate, false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">Generate Bill for {prescription.patientName}</DialogTitle>
          <DialogDescription>
            Enter prices, select options, and set the due date.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          {prescription.items.map((item, index) => (
            <div key={index} className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor={`price-${index}`} className="col-span-2 truncate">{item}</Label>
              <div className="relative">
                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{settings.currency}</span>
                 <Input
                    id={`price-${index}`}
                    type="number"
                    value={prices[item] || ''}
                    onChange={(e) => handlePriceChange(item, e.target.value)}
                    className="text-right pr-3 pl-6"
                    placeholder="0.00"
                    disabled={!!forcePrices}
                />
              </div>
            </div>
          ))}
          <Separator />
          <div className="space-y-2">
             <div className="flex justify-between items-center">
                <Label>Subtotal</Label>
                <p className="font-medium">{settings.currency}{subtotal.toFixed(2)}</p>
            </div>
            {settings.taxType !== 'No Tax' && (
                <div className="flex justify-between items-center">
                    <Label>{settings.taxType} ({settings.taxPercentage}%)</Label>
                    <p className="font-medium">{settings.currency}{taxAmount.toFixed(2)}</p>
                </div>
            )}
             <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Checkbox id="appointment-fee" checked={includeAppointmentFee} onCheckedChange={(c) => setIncludeAppointmentFee(c as boolean)} />
                    <Label htmlFor="appointment-fee">Appointment Fee</Label>
                </div>
                <p className="font-medium">{settings.currency}{fee.toFixed(2)}</p>
            </div>
             <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Checkbox id="round-off" checked={applyRoundOff} onCheckedChange={(c) => setApplyRoundOff(c as boolean)} />
                    <Label htmlFor="round-off">Round Off</Label>
                </div>
                <p className="font-medium">{settings.currency}{roundOffAmount.toFixed(2)}</p>
            </div>
            <Separator />
            <div className="flex justify-between items-center text-lg font-bold">
              <Label className="text-lg">Total</Label>
              <p>{settings.currency}{finalTotal.toFixed(2)}</p>
          </div>
          </div>
          
           <div className="grid grid-cols-3 items-center gap-4 pt-4">
                <Label htmlFor="due-date" className="col-span-1">Due Date</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        variant={"outline"}
                        className={`w-full justify-start text-left font-normal col-span-2 ${!dueDate && "text-muted-foreground"}`}
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                        initialFocus
                        />
                    </PopoverContent>
                </Popover>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" variant="secondary" onClick={() => handleGenerateClick(true)} disabled={!dueDate}>
            <FileText className="mr-2 h-4 w-4" />
            Generate Prescription
          </Button>
          <Button type="button" onClick={() => handleGenerateClick(false)} disabled={!dueDate}>Preview Bill</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
