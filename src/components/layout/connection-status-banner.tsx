
'use client';

import { useClinicContext } from '@/context/clinic-context';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff } from 'lucide-react';

export default function ConnectionStatusBanner() {
  const { onlineStatus } = useClinicContext();

  if (onlineStatus === 'online') {
    return null;
  }

  const isOffline = onlineStatus === 'offline';
  const isReconnected = onlineStatus === 'reconnected';

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center p-3 text-sm font-medium text-white transition-transform duration-300',
        isOffline ? 'bg-yellow-600' : 'bg-green-600',
        onlineStatus === 'online' ? 'translate-y-full' : 'translate-y-0'
      )}
    >
      {isOffline && (
        <>
          <WifiOff className="mr-2 h-4 w-4" />
          You are currently offline. Changes will be synced when you're back online.
        </>
      )}
      {isReconnected && (
        <>
          <Wifi className="mr-2 h-4 w-4" />
          Back online! Your data has been synced.
        </>
      )}
    </div>
  );
}
