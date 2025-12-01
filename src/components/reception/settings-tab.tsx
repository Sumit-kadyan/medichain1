

'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, User, UserCog } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useClinicContext, ClinicSettings, Doctor, ClinicStructure } from '@/context/clinic-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ChangePinCard } from '../doctor/change-pin-card';

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

const taxTypes = ['VAT', 'GST', 'Sales Tax', 'No Tax'];

const clinicStructures: { value: ClinicStructure, label: string, description: string }[] = [
    { value: 'full_workflow', label: 'Full Workflow', description: 'Separate Reception, Doctor, and Pharmacy roles.' },
    { value: 'no_pharmacy', label: 'No In-house Pharmacy', description: 'Clinic provides consultation and printed prescriptions only.' },
];

export function SettingsTab() {
  const { settings, updateSettings, loading: contextLoading, doctors } = useClinicContext();
  const { toast } = useToast();
  const [localSettings, setLocalSettings] = useState<ClinicSettings | null>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPinDoctor, setSelectedPinDoctor] = useState<Doctor | null>(null);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSettingChange = (field: keyof ClinicSettings, value: string | number) => {
    if (localSettings) {
      setLocalSettings({ ...localSettings, [field]: value });
    }
  };
  
  const handleSaveChanges = () => {
    if (!localSettings) return;
    setIsSaving(true);
    updateSettings(localSettings);
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: 'Settings Updated',
        description: 'Your clinic settings have been saved successfully.',
      });
    }, 1000);
  };

  if (contextLoading && !settings) {
      return (
        <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )
  }
  
  if (!localSettings) return null;


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
     <div className="lg:col-span-2 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Clinic Settings</CardTitle>
          <CardDescription>Manage your clinic's public profile, workflow, and main doctor.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="clinicName">Clinic Name</Label>
            <Input id="clinicName" value={localSettings.clinicName} onChange={(e) => handleSettingChange('clinicName', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clinicAddress">Address</Label>
            <Input id="clinicAddress" value={localSettings.clinicAddress} onChange={(e) => handleSettingChange('clinicAddress', e.target.value)} />
          </div>
           <div className="space-y-2">
            <Label htmlFor="clinicStructure">Workflow Mode</Label>
            <Select value={localSettings.clinicStructure} onValueChange={(value) => handleSettingChange('clinicStructure', value)}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a workflow" />
                </SelectTrigger>
                <SelectContent>
                    {clinicStructures.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
                {clinicStructures.find(c => c.value === localSettings.clinicStructure)?.description}
            </p>
           </div>
            <div className="space-y-2">
                <Label htmlFor="mainDoctor">Main Doctor (for 'One Man' Dashboard)</Label>
                <Select value={localSettings.mainDoctorId} onValueChange={(value) => handleSettingChange('mainDoctorId', value)}>
                    <SelectTrigger id="mainDoctor">
                        <SelectValue placeholder="Select a main doctor..." />
                    </SelectTrigger>
                    <SelectContent>
                        {doctors.map(d => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                    This doctor will be the default for the 'One Man' dashboard.
                </p>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Billing &amp; Tax</CardTitle>
          <CardDescription>Set your currency, fees, and tax information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                     <Label htmlFor="currency">Currency</Label>
                     <Select value={localSettings.currency} onValueChange={(value) => handleSettingChange('currency', value)}>
                         <SelectTrigger>
                             <SelectValue placeholder="Select a currency" />
                         </SelectTrigger>
                         <SelectContent>
                             {currencies.map(c => (
                                 <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                             ))}
                         </SelectContent>
                     </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="appointmentFee">Appointment/Consultation Fee</Label>
                    <Input 
                        id="appointmentFee" 
                        type="number"
                        value={localSettings.appointmentFee || 0} 
                        onChange={(e) => handleSettingChange('appointmentFee', Number(e.target.value))}
                        min="0"
                        />
                </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                     <Label htmlFor="taxType">Tax Type</Label>
                     <Select value={localSettings.taxType} onValueChange={(value) => handleSettingChange('taxType', value)}>
                         <SelectTrigger>
                             <SelectValue placeholder="Select a tax type" />
                         </SelectTrigger>
                         <SelectContent>
                             {taxTypes.map(t => (
                                 <SelectItem key={t} value={t}>{t}</SelectItem>
                             ))}
                         </SelectContent>
                     </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="taxPercentage">Tax Percentage (%)</Label>
                    <Input 
                    id="taxPercentage" 
                    type="number"
                    value={localSettings.taxPercentage || 0} 
                    onChange={(e) => handleSettingChange('taxPercentage', Number(e.target.value))}
                    min="0"
                    max="100"
                    />
                </div>
           </div>
            <div className="space-y-2">
                <Label htmlFor="receiptValidityDays">Receipt Validity (Days)</Label>
                <Input 
                id="receiptValidityDays" 
                type="number"
                value={localSettings.receiptValidityDays || 0} 
                onChange={(e) => handleSettingChange('receiptValidityDays', Number(e.target.value))}
                min="0"
                />
            </div>
        </CardContent>
        <CardFooter>
            <Button onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save All Settings
            </Button>
        </CardFooter>
      </Card>
    </div>
    
    <div className="lg:col-span-1">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Doctor Security</CardTitle>
                <CardDescription>Select a doctor to manage their PIN.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="doctor-select">Select Doctor</Label>
                    <Select onValueChange={(id) => setSelectedPinDoctor(doctors.find(d => d.id === id) || null)}>
                        <SelectTrigger id="doctor-select">
                            <SelectValue placeholder="Select a doctor..." />
                        </SelectTrigger>
                        <SelectContent>
                             {doctors.map(d => (
                                <SelectItem key={d.id} value={d.id}>
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        <span>{d.name}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                 </div>

                 {selectedPinDoctor && (
                    <ChangePinCard doctor={selectedPinDoctor} />
                 )}
            </CardContent>
        </Card>
    </div>
    </div>
  );
}
