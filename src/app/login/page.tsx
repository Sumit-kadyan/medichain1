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
import { BriefcaseMedical } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
                <BriefcaseMedical className="w-10 h-10 text-primary" />
                <h1 className="text-3xl font-bold font-headline text-primary">MediChain</h1>
            </div>
          <CardTitle className="font-headline text-2xl">Welcome Back</CardTitle>
          <CardDescription>Enter your credentials to access your clinic dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="doctor@medichain.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required />
          </div>
        </CardContent>
        <CardFooter className='flex flex-col gap-4'>
          <Button className="w-full" asChild>
            <Link href="/reception">Log in</Link>
          </Button>
           <p className="text-xs text-center text-muted-foreground">
            Having trouble logging in? <a href="#" className="underline">Contact support</a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
