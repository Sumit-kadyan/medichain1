'use client';

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
} from 'lucide-react';
import { Button } from '../ui/button';

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
    href: '/settings',
    label: 'Settings',
    icon: Settings,
  },
];

export default function MainSidebar() {
  const pathname = usePathname();

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
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  isActive={pathname.startsWith(item.href)}
                  className="w-full"
                  asChild
                >
                  <a>
                    <item.icon className="mr-3 h-5 w-5" />
                    <span>{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <Button variant="outline" className="w-full">
            <CircleHelp className="mr-2 h-4 w-4" />
            Help & Support
        </Button>
      </SidebarFooter>
    </>
  );
}
