
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

const defaultLogin = {
  username: 'test',
  password: 'password'
}

export default function LoginPage() {
  const { login, signup } = useClinicContext();
  const { toast } = useToast();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
        toast({ title: 'Error', description: 'Please enter username and password.', variant: 'destructive' });
        return;
    }
    setLoading(true);
    try {
        const email = `${username.trim()}@medichain.app`;
        const user = await login(email, password);
        if (user) {
            toast({ title: 'Login Successful', description: 'Redirecting to your dashboard...' });
            router.push('/reception');
        } else {
             toast({ title: 'Login Failed', description: 'Invalid username or password.', variant: 'destructive' });
        }
    } catch (error: any) {
        // This is a simplified error handling. 
        // In a real app, you'd check error.code for specifics like 'auth/user-not-found'
        if (error.code === 'auth/user-not-found') {
            // If user doesn't exist, try to sign them up with the credentials
            try {
                const email = `${username.trim()}@medichain.app`;
                const newUser = await signup(username, password);
                 if (newUser) {
                    toast({ title: 'Account Created!', description: 'Your new clinic account is ready.' });
                    router.push('/reception');
                }
            } catch (signupError) {
                 toast({ title: 'Registration Failed', description: 'Could not create a new account.', variant: 'destructive' });
            }
        } else {
             toast({ title: 'Login Failed', description: 'Invalid username or password.', variant: 'destructive' });
        }
    } finally {
        setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
                <BriefcaseMedical className="w-10 h-10 text-primary" />
                <h1 className="text-3xl font-bold font-headline text-primary">MediChain</h1>
            </div>
          <CardTitle className="font-headline text-2xl">Welcome Back</CardTitle>
          <CardDescription>Enter your clinic credentials to access your dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" type="text" placeholder="yourclinic_username" required value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter className='flex flex-col gap-4'>
          <Button className="w-full" onClick={handleLogin} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : 'Log in or Sign up'}
          </Button>
          <p className="text-xs text-muted-foreground">
            First time? Just enter your desired username and password and we'll create an account for you.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
