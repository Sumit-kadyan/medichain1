export const dynamic = "force-dynamic";

'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Header from '@/components/layout/header';
import MainSidebar from '@/components/layout/main-sidebar';
import { Sidebar, SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useClinicContext, ClinicStructure } from '@/context/clinic-context';
import { Loader2 } from 'lucide-react';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { ClinicProvider } from '@/context/clinic-context';
import ConnectionStatusBanner from '@/components/layout/connection-status-banner';
import { FirebaseClientProvider } from '@/firebase/client-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

const metadata: Metadata = {
  title: 'MediChain',
  description: 'Smart Clinic Management',
};

const isPageVisible = (pathname: string, structure: ClinicStructure | undefined) => {
  const currentStructure = structure || 'full_workflow';

  // Always show login
  if(pathname.startsWith('/login')) return true;

  // Root redirects so it's fine
  if (pathname === '/') return true;

  const pageVisibility: Record<ClinicStructure, string[]> = {
    full_workflow: ['/reception', '/doctor', '/pharmacy'],
    no_pharmacy: ['/reception', '/doctor'],
    one_man: ['/reception', '/oneman'],
  };

  return pageVisibility[currentStructure].some(p => pathname.startsWith(p));
}

function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, authLoading, settings } = useClinicContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);
  
  useEffect(() => {
    if (!authLoading && settings && user) {
      if (!isPageVisible(pathname, settings.clinicStructure)) {
        console.log(`Redirecting from ${pathname} for structure ${settings.clinicStructure}`);
        router.replace('/reception');
      }
    }
  }, [pathname, settings, authLoading, router, user])

  const isAuthPage = pathname.startsWith('/login');

  if (authLoading || (!settings && !isAuthPage)) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (isAuthPage) {
    return <>{children}</>;
  }


  if (!user) {
    return null; // Should be redirected by the effect
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


export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=PT+Sans:wght@400;700&family=Source+Code+Pro&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-body antialiased',
          inter.variable
        )}
      >
        <FirebaseClientProvider>
          <ClinicProvider>
            <ProtectedLayout>{children}</ProtectedLayout>
            <ConnectionStatusBanner />
          </ClinicProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
