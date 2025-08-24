
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
import { Prescription, useClinicContext } from '@/context/clinic-context';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface GenerateBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prescription: Prescription | null;
  onBillGenerated: (prices: Record<string, number>, dueDate: Date) => void;
}

export function GenerateBillDialog({
  open,
  onOpenChange,
  prescription,
  onBillGenerated,
}: GenerateBillDialogProps) {
  const { settings } = useClinicContext();
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [dueDate, setDueDate] = useState<Date | undefined>();

  useEffect(() => {
    if (prescription && settings.receiptValidityDays) {
        const today = new Date();
        const newDueDate = new Date(today);
        newDueDate.setDate(today.getDate() + settings.receiptValidityDays);
        setDueDate(newDueDate);
        
        // Initialize prices
        const initialPrices = prescription.items.reduce((acc, item) => {
            acc[item] = 0;
            return acc;
        }, {} as Record<string, number>);
        setPrices(initialPrices);

    } else if (prescription) {
        // Fallback due date if settings not loaded
        const today = new Date();
        const newDueDate = new Date(today);
        newDueDate.setDate(today.getDate() + 7); // Default 7 days
        setDueDate(newDueDate);
    }
  }, [prescription, settings]);

  if (!prescription) return null;

  const handlePriceChange = (item: string, value: string) => {
    const newPrices = { ...prices };
    newPrices[item] = Number(value) || 0;
    setPrices(newPrices);
  };

  const total = Object.values(prices).reduce((sum, price) => sum + (price || 0), 0);
  
  const handleGenerateClick = () => {
    if (dueDate) {
        onBillGenerated(prices, dueDate);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">Generate Bill for {prescription.patientName}</DialogTitle>
          <DialogDescription>
            Enter the price for each prescribed item and set the due date.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {prescription.items.map((item, index) => (
            <div key={index} className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor={`price-${index}`} className="col-span-2 truncate">{item}</Label>
              <Input
                id={`price-${index}`}
                type="number"
                value={prices[item] || ''}
                onChange={(e) => handlePriceChange(item, e.target.value)}
                className="text-right"
                placeholder="0.00"
              />
            </div>
          ))}
          <div className="grid grid-cols-3 items-center gap-4 border-t pt-4">
              <Label className="col-span-2 text-lg font-bold">Total</Label>
              <p className="text-right text-lg font-bold">${total.toFixed(2)}</p>
          </div>
           <div className="grid grid-cols-3 items-center gap-4 border-t pt-4">
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
          <Button type="button" onClick={handleGenerateClick} disabled={!dueDate}>Preview Bill</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
