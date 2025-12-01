
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Header from '@/components/layout/header';
import MainSidebar from '@/components/layout/main-sidebar';
import { Sidebar, SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useClinicContext, ClinicStructure } from '@/context/clinic-context';
import { Loader2 } from 'lucide-react';

const isPageVisible = (pathname: string, structure: ClinicStructure | undefined) => {
  const currentStructure = structure || 'full_workflow';

  if (pathname.startsWith('/reception')) return true;

  const pageVisibility: Record<ClinicStructure, string[]> = {
    full_workflow: ['/doctor', '/pharmacy'],
    no_pharmacy: ['/doctor'],
    one_man: ['/oneman'],
  };

  return pageVisibility[currentStructure].some(p => pathname.startsWith(p));
}

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, authLoading, settings } = useClinicContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);
  
  useEffect(() => {
    if (!authLoading && settings) {
      if (!isPageVisible(pathname, settings.clinicStructure)) {
        router.replace('/reception');
      }
    }
  }, [pathname, settings, authLoading, router])


  if (authLoading || !settings) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null; // or a login redirect component
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon">
          <MainSidebar />
        </Sidebar>
        <div className="flex flex-1 flex-col">
          <Header />
          <SidebarInset>
            <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}


export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <ProtectedLayout>{children}</ProtectedLayout>
  );
}
