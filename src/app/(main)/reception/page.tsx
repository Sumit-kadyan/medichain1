
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PatientsTab } from '@/components/reception/patients-tab';
import { WaitingRoomTab } from '@/components/reception/waiting-room-tab';
import { DoctorsTab } from '@/components/reception/doctors-tab';
import { SettingsTab } from '@/components/reception/settings-tab';
import {
  Users,
  Clock,
  Stethoscope,
  Settings,
} from 'lucide-react';

export default function ReceptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'waiting-room';

  const onTabChange = (value: string) => {
    router.push(`/reception?tab=${value}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue={defaultTab} onValueChange={onTabChange}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="waiting-room">
            <Clock className="mr-2 h-4 w-4" />
            Waiting Room
          </TabsTrigger>
          <TabsTrigger value="patients">
            <Users className="mr-2 h-4 w-4" />
            Patients
          </TabsTrigger>
          <TabsTrigger value="doctors">
            <Stethoscope className="mr-2 h-4 w-4" />
            Doctors
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>
        <TabsContent value="waiting-room">
          <WaitingRoomTab />
        </TabsContent>
        <TabsContent value="patients">
          <PatientsTab />
        </TabsContent>
        <TabsContent value="doctors">
          <DoctorsTab />
        </TabsContent>
        <TabsContent value="settings">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
