

'use client';

import { useEffect, useState } from 'react';
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
import { Loader2, Save, User, Building2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useClinicContext, ClinicSettings, Doctor, ClinicStructure } from '@/context/clinic-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
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
    { value: 'pharmacy_at_doctor', label: 'Pharmacy at Doctor', description: 'Doctor handles prescriptions and billing directly.' },
    { value: 'no_pharmacy', label: 'No In-house Pharmacy', description: 'Clinic provides consultation and printed prescriptions only.' },
];

export function SettingsTab() {
  const { settings, loading: contextLoading, doctors, clinicId, updateClinicProfile } = useClinicContext();
  const { toast } = useToast();
  const [profileSettings, setProfileSettings] = useState({
      clinicName: '',
      clinicAddress: '',
      logoSvg: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  useEffect(() => {
    if (settings) {
        setProfileSettings({
            clinicName: settings.clinicName,
            clinicAddress: settings.clinicAddress,
            logoSvg: settings.logoSvg || '',
        });
    }
  }, [settings]);

  const handleProfileChange = (field: keyof typeof profileSettings, value: string) => {
    setProfileSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
        await updateClinicProfile(profileSettings);
        toast({
            title: 'Profile Updated',
            description: 'Your clinic profile has been saved successfully.',
        });
    } catch (error) {
         toast({
            title: 'Update Failed',
            description: 'Could not save your profile changes. Please try again.',
            variant: 'destructive',
        });
        console.error(error);
    } finally {
        setIsSaving(false);
    }
  };

  if (contextLoading && !settings) {
      return (
        <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )
  }
  
  if (!settings) return null;


  const firestoreUrl = `https://console.firebase.google.com/project/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/firestore/data/clinics/${clinicId}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
     <div className="lg:col-span-2 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Clinic Profile</CardTitle>
          <CardDescription>Update your clinic's public information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clinicName">Clinic Name</Label>
            <Input 
                id="clinicName" 
                value={profileSettings.clinicName} 
                onChange={(e) => handleProfileChange('clinicName', e.target.value)}
             />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clinicAddress">Address</Label>
            <Input 
                id="clinicAddress" 
                value={profileSettings.clinicAddress} 
                onChange={(e) => handleProfileChange('clinicAddress', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="logoSvg">Logo SVG Markup</Label>
            <Textarea 
              id="logoSvg" 
              value={profileSettings.logoSvg} 
              onChange={(e) => handleProfileChange('logoSvg', e.target.value)}
              placeholder="<svg>...</svg>"
              className="min-h-[120px] font-code"
            />
          </div>
        </CardContent>
        <CardFooter>
            <Button onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
            </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
                <Building2 className="h-6 w-6 text-primary" />
                Clinic Structure
            </CardTitle>
            <CardDescription className="!flex !items-center !gap-2">
                This setting changes the app workflow. To edit, use the Firebase Console.
                <a href={firestoreUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Console
                </Button>
                </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
            <Label htmlFor="clinicStructure">Workflow Mode</Label>
            <Select value={settings.clinicStructure} disabled>
                <SelectTrigger id="clinicStructure">
                    <SelectValue placeholder="Select a workflow" />
                </SelectTrigger>
                <SelectContent>
                    {clinicStructures.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
                {clinicStructures.find(c => c.value === settings.clinicStructure)?.description}
            </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Billing &amp; Tax</CardTitle>
          <CardDescription>To edit, use the Firebase Console.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                     <Label htmlFor="currency">Currency</Label>
                     <Select value={settings.currency} disabled>
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
                        value={settings.appointmentFee || 0} 
                        min="0"
                        disabled
                        />
                </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                     <Label htmlFor="taxType">Tax Type</Label>
                     <Select value={settings.taxType} disabled>
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
                    value={settings.taxPercentage || 0} 
                    min="0"
                    max="100"
                    disabled
                    />
                </div>
           </div>
            <div className="space-y-2">
                <Label htmlFor="receiptValidityDays">Receipt Validity (Days)</Label>
                <Input 
                id="receiptValidityDays" 
                type="number"
                value={settings.receiptValidityDays || 0} 
                min="0"
                disabled
                />
            </div>
        </CardContent>
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
                    <Select onValueChange={(id) => setSelectedDoctor(doctors.find(d => d.id === id) || null)}>
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

                 {selectedDoctor && (
                    <ChangePinCard doctor={selectedDoctor} />
                 )}
            </CardContent>
        </Card>
    </div>
    </div>
  );
}
