
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BriefcaseMedical, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useClinicContext } from '@/context/clinic-context';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const { signup } = useClinicContext();
  const { toast } = useToast();
  const router = useRouter();

  const [clinicName, setClinicName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!clinicName || !username || !password) {
        toast({ title: 'Error', description: 'Please fill all fields.', variant: 'destructive' });
        return;
    }
     if (password.length < 6) {
        toast({ title: 'Error', description: 'Password must be at least 6 characters long.', variant: 'destructive' });
        return;
    }
    setLoading(true);
    try {
        const email = `${username.trim()}@medichain.app`; // Create a dummy email for Firebase Auth
        await signup(email, password, clinicName, username);
        toast({ title: 'Signup Successful', description: 'Your clinic has been registered! Redirecting to dashboard...' });
        router.push('/reception');
    } catch (error: any) {
        let message = 'An unknown error occurred.';
        if (error.code === 'auth/email-already-in-use') {
            message = 'This username is already taken. Please choose another one.';
        } else if (error.message) {
            message = error.message;
        }
        toast({ title: 'Signup Failed', description: message, variant: 'destructive' });
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <BriefcaseMedical className="w-10 h-10 text-primary" />
            <h1 className="text-3xl font-bold font-headline text-primary">MediChain</h1>
          </div>
          <CardTitle className="font-headline text-2xl">Register Your Clinic</CardTitle>
          <CardDescription>Create a new account to manage your clinic with MediChain.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="space-y-2">
            <Label htmlFor="clinicName">Clinic Name</Label>
            <Input id="clinicName" type="text" placeholder="e.g., Sunrise Health Clinic" required value={clinicName} onChange={(e) => setClinicName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" type="text" placeholder="e.g., sunrise_health" required value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter className='flex flex-col gap-4'>
          <Button className="w-full" onClick={handleSignup} disabled={loading}>
             {loading ? <Loader2 className="animate-spin" /> : 'Sign Up'}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="underline">
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
