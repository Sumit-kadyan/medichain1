
'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useClinicContext } from '@/context/clinic-context';

export function SettingsTab() {
  const { toast } = useToast();
  const { settings, updateSettings } = useClinicContext();
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [receiptValidityDays, setReceiptValidityDays] = useState(0);

  useEffect(() => {
    if (settings) {
      setClinicName(settings.clinicName);
      setClinicAddress(settings.clinicAddress);
      setReceiptValidityDays(settings.receiptValidityDays);
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings({
      clinicName,
      clinicAddress,
      receiptValidityDays: Number(receiptValidityDays),
    });
    toast({
        title: 'Settings Saved',
        description: 'Your clinic profile has been updated.',
    });
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Clinic Profile</CardTitle>
          <CardDescription>Update your clinic's public information and receipt settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clinic-name">Clinic Name</Label>
            <Input id="clinic-name" value={clinicName} onChange={(e) => setClinicName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clinic-address">Address</Label>
            <Input id="clinic-address" value={clinicAddress} onChange={(e) => setClinicAddress(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="receipt-validity">Receipt Validity (Days)</Label>
            <Input 
              id="receipt-validity" 
              type="number"
              value={receiptValidityDays} 
              onChange={(e) => setReceiptValidityDays(Number(e.target.value))} 
              min="0"
            />
            <p className="text-sm text-muted-foreground">
              Set how many days a receipt is valid for from the date of issue.
            </p>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save All Settings
        </Button>
      </div>
    </div>
  );
}
