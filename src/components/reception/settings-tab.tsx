

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
  const { settings, loading: contextLoading, doctors, clinicId } = useClinicContext();
  const [localSettings, setLocalSettings] = useState<ClinicSettings>({
      clinicName: '',
      clinicAddress: '',
      receiptValidityDays: 0,
      currency: '$',
      logoUrl: '',
      logoSvg: '',
      taxType: 'No Tax',
      taxPercentage: 0,
      appointmentFee: 0,
      clinicStructure: 'full_workflow',
  });
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  useEffect(() => {
    if (settings) {
        setLocalSettings(settings);
    }
  }, [settings]);

  if (contextLoading && !settings) {
      return (
        <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )
  }

  const firestoreUrl = `https://console.firebase.google.com/project/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/firestore/data/clinics/${clinicId}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
     <div className="lg:col-span-2 space-y-6">
       <Card>
        <CardHeader>
          <CardTitle className="font-headline">View Clinic Settings</CardTitle>
          <CardDescription className="!flex !items-center !gap-2">
            Settings are read-only. To make changes, please edit the document directly in the Firebase Console.
            <a href={firestoreUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Console
              </Button>
            </a>
          </CardDescription>
        </CardHeader>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Clinic Profile</CardTitle>
          <CardDescription>Your clinic's public information and receipt settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clinicName">Clinic Name</Label>
            <Input id="clinicName" value={localSettings.clinicName || ''} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clinicAddress">Address</Label>
            <Input id="clinicAddress" value={localSettings.clinicAddress || ''} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="logoSvg">Logo SVG Markup</Label>
            <Textarea 
              id="logoSvg" 
              value={localSettings.logoSvg || ''} 
              disabled
              placeholder="<svg>...</svg>"
              className="min-h-[120px] font-code"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
                <Building2 className="h-6 w-6 text-primary" />
                Clinic Structure
            </CardTitle>
            <CardDescription>The application workflow configured for your clinic.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
            <Label htmlFor="clinicStructure">Workflow Mode</Label>
            <Select value={localSettings.clinicStructure} disabled>
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
                {clinicStructures.find(c => c.value === localSettings.clinicStructure)?.description}
            </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Billing &amp; Tax</CardTitle>
          <CardDescription>Configured currency, taxes, and standard fees.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                     <Label htmlFor="currency">Currency</Label>
                     <Select value={localSettings.currency} disabled>
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
                        min="0"
                        disabled
                        />
                </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                     <Label htmlFor="taxType">Tax Type</Label>
                     <Select value={localSettings.taxType} disabled>
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
                value={localSettings.receiptValidityDays || 0} 
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
