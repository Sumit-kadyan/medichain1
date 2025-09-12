
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/header';
import MainSidebar from '@/components/layout/main-sidebar';
import { Sidebar, SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useClinicContext } from '@/context/clinic-context';
import { Loader2 } from 'lucide-react';

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, authLoading } = useClinicContext();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
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
