
'use client';

import { useState } from 'react';
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
import { Doctor } from '@/context/clinic-context';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

interface PinEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctor: Doctor | null;
  onVerify: (pincode: string) => Promise<void>;
}

export function PinEntryDialog({
  open,
  onOpenChange,
  doctor,
  onVerify,
}: PinEntryDialogProps) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    await onVerify(pin);
    setLoading(false);
    setPin(''); // Clear pin after attempt
  };
  
  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/\D/g, '');
      if (value.length <= 4) {
          setPin(value);
      }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {doctor && (
          <>
            <DialogHeader className="items-center text-center">
              <Avatar className="h-20 w-20 mb-4">
                  <AvatarImage src={doctor.avatarUrl} alt={doctor.name} data-ai-hint="doctor person" />
                  <AvatarFallback>{doctor.initials}</AvatarFallback>
              </Avatar>
              <DialogTitle className="font-headline">Welcome, {doctor.name}</DialogTitle>
              <DialogDescription>
                Enter your 4-digit PIN to access your dashboard.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="pin" className="sr-only">
                  PIN
                </Label>
                <Input
                  id="pin"
                  type="password"
                  value={pin}
                  onChange={handlePinChange}
                  maxLength={4}
                  className="text-center text-2xl h-14 tracking-[1em]"
                  placeholder="----"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="button" onClick={handleVerify} disabled={loading || pin.length < 4}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify PIN
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
