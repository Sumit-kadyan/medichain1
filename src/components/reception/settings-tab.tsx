

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';

const currencies = [
    { value: '$', label: 'USD ($) - Dollar' },
    { value: '€', label: 'EUR (€) - Euro' },
    { value: '¥', label: 'JPY (¥) - Yen' },
    { value: '£', label: 'GBP (£) - Pound' },
    { value: '₹', label: 'INR (₹) - Rupee' },
    { value: 'C$', label: 'CAD (C$) - Canadian Dollar' },
    { value: 'A$', label: 'AUD (A$) - Australian Dollar' },
    { value: 'CHF', label: 'CHF - Swiss Franc' },
    { value: '元', label: 'CNY (元) - Yuan' },
];

export function SettingsTab() {
  const { toast } = useToast();
  const { settings, updateSettings, loading: contextLoading } = useClinicContext();
  const [localSettings, setLocalSettings] = useState<ClinicSettings>({
      clinicName: '',
      clinicAddress: '',
      receiptValidityDays: 0,
      currency: '$',
      logoUrl: '',
      logoSvg: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
        setLocalSettings(settings);
    }
  }, [settings]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { id, value } = e.target;
      setLocalSettings(prev => ({...prev, [id]: id === 'receiptValidityDays' ? Number(value) : value }))
  }

  const handleCurrencyChange = (value: string) => {
      setLocalSettings(prev => ({...prev, currency: value}));
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
            <Input id="clinicName" value={localSettings.clinicName || ''} onChange={handleInputChange} disabled={isSaving || contextLoading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clinicAddress">Address</Label>
            <Input id="clinicAddress" value={localSettings.clinicAddress || ''} onChange={handleInputChange} disabled={isSaving || contextLoading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="logoSvg">Logo SVG Markup</Label>
            <Textarea 
              id="logoSvg" 
              value={localSettings.logoSvg || ''} 
              onChange={handleInputChange} 
              disabled={isSaving || contextLoading} 
              placeholder="<svg>...</svg>"
              className="min-h-[120px] font-code"
            />
             <p className="text-sm text-muted-foreground">
                Paste the raw SVG code for your clinic's logo.
            </p>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="receiptValidityDays">Receipt Validity (Days)</Label>
                    <Input 
                    id="receiptValidityDays" 
                    type="number"
                    value={localSettings.receiptValidityDays || 0} 
                    onChange={handleInputChange} 
                    min="0"
                    disabled={isSaving || contextLoading}
                    />
                    <p className="text-sm text-muted-foreground">
                    Set how many days a receipt is valid for.
                    </p>
                </div>
                <div className="space-y-2">
                     <Label htmlFor="currency">Currency</Label>
                     <Select value={localSettings.currency} onValueChange={handleCurrencyChange} disabled={isSaving || contextLoading}>
                         <SelectTrigger>
                             <SelectValue placeholder="Select a currency" />
                         </SelectTrigger>
                         <SelectContent>
                             {currencies.map(c => (
                                 <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                             ))}
                         </SelectContent>
                     </Select>
                     <p className="text-sm text-muted-foreground">
                        Select the currency for your clinic's billing.
                    </p>
                </div>
           </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || contextLoading || !settings}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save All Settings
        </Button>
      </div>
    </div>
  );
}

    