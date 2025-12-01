
'use client';

import { useState } from 'react';
import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Stethoscope,
  Pill,
  Settings,
  CircleHelp,
  BriefcaseMedical,
  UserCog,
} from 'lucide-react';
import { Button } from '../ui/button';
import { HelpSupportDialog } from './help-support-dialog';
import { useClinicContext } from '@/context/clinic-context';


const menuItems = [
  {
    href: '/reception',
    label: 'Reception',
    icon: LayoutDashboard,
  },
  {
    href: '/doctor',
    label: 'Doctor',
    icon: Stethoscope,
  },
  {
    href: '/pharmacy',
    label: 'Pharmacy',
    icon: Pill,
  },
  {
      href: '/oneman',
      label: 'One Man',
      icon: UserCog,
  }
];

export default function MainSidebar() {
  const pathname = usePathname();
  const { settings } = useClinicContext();
  const [isHelpOpen, setHelpOpen] = useState(false);
  
  const visibleMenuItems = menuItems.filter(item => {
    if (settings?.clinicStructure === 'no_pharmacy' && item.href === '/pharmacy') {
        return false;
    }
    return true;
  });

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <BriefcaseMedical className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline text-primary">MediChain</h1>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarMenu>
          {visibleMenuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href) && !pathname.includes('?tab=settings')}
                className="w-full"
            >
                <Link href={item.href}>
                <item.icon className="mr-3 h-5 w-5" />
                <span>{item.label}</span>
                </Link>
            </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 space-y-2">
         <SidebarMenu>
             <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.includes('?tab=settings')}
                className="w-full"
              >
                <Link href="/reception?tab=settings">
                  <Settings className="mr-3 h-5 w-5" />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
         </SidebarMenu>
        <Button variant="outline" className="w-full" onClick={() => setHelpOpen(true)}>
            <CircleHelp className="mr-2 h-4 w-4" />
            Help & Support
        </Button>
      </SidebarFooter>
      <HelpSupportDialog open={isHelpOpen} onOpenChange={setHelpOpen} />
    </>
  );
}
