
'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarTrigger } from '../ui/sidebar';
import { LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const getTitle = () => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return 'Dashboard';
    // Handle tabbed navigation in reception
    if (segments[0] === 'reception' && segments.length > 1) {
        const tab = segments.find(s => s.startsWith('tab='))?.split('=')[1] || 'waiting-room';
        const title = tab.replace('-', ' ');
        return title.charAt(0).toUpperCase() + title.slice(1);
    }
    const title = segments[segments.length - 1];
    return title.charAt(0).toUpperCase() + title.slice(1);
  };
  
  const handleLogout = () => {
    toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
    });
    router.push('/login');
  }

  const handleProfileClick = () => {
      // In a real app this would go to a profile page
      toast({
          title: 'Profile Clicked',
          description: 'This is a mock action.',
      })
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <h1 className="text-xl font-semibold md:text-2xl font-headline">{getTitle()}</h1>
      <div className="ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src="https://placehold.co/100x100.png" alt="@user" data-ai-hint="person doctor" />
                <AvatarFallback>DR</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Dr. Smith</p>
                <p className="text-xs leading-none text-muted-foreground">
                  doctor@medichain.com
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleProfileClick}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
