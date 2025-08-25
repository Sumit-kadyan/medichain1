
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
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useClinicContext, ClinicSettings } from '@/context/clinic-context';

export function SettingsTab() {
  const { toast } = useToast();
  const { settings, updateSettings, loading: contextLoading } = useClinicContext();
  const [localSettings, setLocalSettings] = useState<ClinicSettings>({
      clinicName: '',
      clinicAddress: '',
      receiptValidityDays: 0,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Only update localSettings from context if it's not currently being saved
    // and if the context settings are actually loaded.
    if (!isSaving && settings && Object.keys(settings).length > 0) {
        setLocalSettings(settings);
    }
  }, [settings, isSaving]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { id, value } = e.target;
      setLocalSettings(prev => ({...prev, [id]: id === 'receiptValidityDays' ? Number(value) : value }))
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
        await updateSettings(localSettings);
        toast({
            title: 'Settings Saved',
            description: 'Your clinic profile has been updated.',
        });
    } catch (error) {
         toast({
            title: 'Error',
            description: 'Failed to save settings. Please try again.',
            variant: 'destructive'
        });
    } finally {
        setIsSaving(false);
    }
  }

  if (contextLoading && !settings) {
      return (
        <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )
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
            <Label htmlFor="clinicName">Clinic Name</Label>
            <Input id="clinicName" value={localSettings.clinicName} onChange={handleInputChange} disabled={isSaving} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clinicAddress">Address</Label>
            <Input id="clinicAddress" value={localSettings.clinicAddress} onChange={handleInputChange} disabled={isSaving} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="receiptValidityDays">Receipt Validity (Days)</Label>
            <Input 
              id="receiptValidityDays" 
              type="number"
              value={localSettings.receiptValidityDays} 
              onChange={handleInputChange} 
              min="0"
              disabled={isSaving}
            />
            <p className="text-sm text-muted-foreground">
              Set how many days a receipt is valid for from the date of issue.
            </p>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || contextLoading}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save All Settings
        </Button>
      </div>
    </div>
  );
}
