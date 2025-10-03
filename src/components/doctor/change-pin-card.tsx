
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClinicContext, Doctor } from '@/context/clinic-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2, KeyRound } from 'lucide-react';
import { z } from 'zod';

const pinSchema = z.string().length(4, "PIN must be 4 digits").regex(/^\d{4}$/, "PIN must be numeric");

export function ChangePinCard({ doctor }: { doctor: Doctor }) {
    const { updateDoctor, verifyDoctorPincode } = useClinicContext();
    const { toast } = useToast();
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSavePin = async () => {
        setError(null);

        if (newPin !== confirmPin) {
            setError("New PINs do not match.");
            return;
        }

        const validation = pinSchema.safeParse(newPin);
        if (!validation.success) {
            setError(validation.error.errors[0].message);
            return;
        }
        
        setLoading(true);
        try {
            const isCurrentPinValid = await verifyDoctorPincode(doctor.id, currentPin);
            if (!isCurrentPinValid) {
                setError("Your current PIN is incorrect.");
                setLoading(false);
                return;
            }

            await updateDoctor(doctor.id, { pincode: newPin });
            
            toast({
                title: 'PIN Updated',
                description: 'Your access PIN has been changed successfully.',
            });
            setCurrentPin('');
            setNewPin('');
            setConfirmPin('');

        } catch (err) {
            console.error(err);
            toast({
                title: 'Update Failed',
                description: 'Could not update your PIN. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <KeyRound className="h-6 w-6 text-primary" />
                    Change Access PIN
                </CardTitle>
                <CardDescription>
                    Update your 4-digit PIN for accessing this dashboard.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="current-pin">Current PIN</Label>
                    <Input id="current-pin" type="password" maxLength={4} value={currentPin} onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="new-pin">New PIN</Label>
                    <Input id="new-pin" type="password" maxLength={4} value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="confirm-pin">Confirm New PIN</Label>
                    <Input id="confirm-pin" type="password" maxLength={4} value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))} />
                </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-4">
                 {error && <p className="text-sm text-destructive">{error}</p>}
                <Button onClick={handleSavePin} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save New PIN
                </Button>
            </CardFooter>
        </Card>
    );
}
