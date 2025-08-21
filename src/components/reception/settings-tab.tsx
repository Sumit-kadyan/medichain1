
'use client';

import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Save } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

const initialTemplate = `
<div style="font-family: sans-serif; border: 1px solid #ddd; padding: 20px; width: 300px; margin: auto;">
  <div style="text-align: center; margin-bottom: 20px;">
    <img src="{{clinic.logoUrl}}" alt="Clinic Logo" style="width: 80px; height: 80px;"/>
    <h2 style="margin: 0;">{{clinic.name}}</h2>
    <p style="margin: 0; font-size: 12px;">{{clinic.address}}</p>
    <p style="margin: 0; font-size: 12px;">Phone: {{clinic.phone}}</p>
  </div>
  <hr style="border: 0; border-top: 1px dashed #ddd; margin: 20px 0;">
  <div style="margin-bottom: 20px;">
    <p><strong>Receipt No:</strong> {{receipt.receiptNumber}}</p>
    <p><strong>Date:</strong> {{receipt.issueDate}}</p>
    <p><strong>Valid Until:</strong> {{receipt.validUntil}}</p>
  </div>
  <div style="margin-bottom: 20px;">
    <p><strong>Patient:</strong> {{patient.name}}</p>
    <p><strong>Patient ID:</strong> {{patient.id}}</p>
  </div>
  <div style="text-align: right;">
    <p><strong>Amount:</strong> $ {{receipt.amount}}</p>
  </div>
</div>
`;

const placeholders = {
  '{{clinic.name}}': 'MediChain Clinic',
  '{{clinic.address}}': '123 Health St, Wellness City',
  '{{clinic.phone}}': '555-123-4567',
  '{{clinic.logoUrl}}': 'https://placehold.co/100x100/6699CC/FFFFFF.png?text=Logo',
  '{{receipt.receiptNumber}}': 'REC-2024-00123',
  '{{receipt.issueDate}}': new Date().toLocaleDateString(),
  '{{receipt.validUntil}}': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
  '{{patient.name}}': 'John Doe',
  '{{patient.id}}': 'PAT-00456',
  '{{receipt.amount}}': '50.00',
};


export function SettingsTab() {
  const { toast } = useToast();
  const [template, setTemplate] = useState(initialTemplate);

  const getLivePreview = () => {
    let previewHtml = template;
    for (const [key, value] of Object.entries(placeholders)) {
        previewHtml = previewHtml.replace(new RegExp(key, 'g'), value);
    }
    return previewHtml;
  }

  const handleSave = () => {
    // In a real app, this would save the settings to a backend.
    toast({
        title: 'Settings Saved',
        description: 'Your clinic profile and receipt template have been updated.',
    });
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Clinic Profile</CardTitle>
          <CardDescription>Update your clinic's public information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clinic-name">Clinic Name</Label>
            <Input id="clinic-name" defaultValue="MediChain Clinic" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clinic-address">Address</Label>
            <Input id="clinic-address" defaultValue="123 Health St, Wellness City" />
          </div>
           <div className="space-y-2">
            <Label htmlFor="receipt-validity">Receipt Validity (Days)</Label>
            <Input id="receipt-validity" type="number" defaultValue="30" />
          </div>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Receipt Template Editor</CardTitle>
          <CardDescription>Customize the HTML for printed receipts. Use placeholders for dynamic data.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="template-editor">HTML Template</Label>
                    <Textarea
                        id="template-editor"
                        value={template}
                        onChange={(e) => setTemplate(e.target.value)}
                        className="font-code min-h-[400px]"
                    />
                </div>
                 <div className="space-y-2">
                    <Label>Live Preview</Label>
                    <div className="rounded-lg border bg-white p-4 overflow-auto min-h-[400px]">
                        <div dangerouslySetInnerHTML={{ __html: getLivePreview() }} />
                    </div>
                </div>
            </div>
             <div className="mt-4 text-xs text-muted-foreground">
                <strong>Available Placeholders:</strong> {Object.keys(placeholders).join(', ')}
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
