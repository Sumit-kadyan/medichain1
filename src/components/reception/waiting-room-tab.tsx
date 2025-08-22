
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    Stethoscope,
    Hourglass,
    AlertTriangle,
    Check,
    FlaskConical,
    CircleCheck,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useClinicContext, PatientStatus } from '@/context/clinic-context';

const statusConfig = {
    waiting: { label: 'Waiting', icon: Hourglass, color: 'bg-yellow-500' },
    called: { label: 'Called', icon: AlertTriangle, color: 'bg-orange-500' },
    in_consult: { label: 'In Consultation', icon: Stethoscope, color: 'bg-blue-500' },
    prescribed: { label: 'Consulted', icon: Check, color: 'bg-purple-500' },
    sent_to_pharmacy: { label: 'At Pharmacy', icon: FlaskConical, color: 'bg-indigo-500' },
    dispensed: { label: 'Done', icon: CircleCheck, color: 'bg-green-500' },
} as const;


export function WaitingRoomTab() {
    const { waitingList, notifications, dismissNotification } = useClinicContext();

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Today's Waiting Room</CardTitle>
        <CardDescription>
          Live view of patients currently in the clinic.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient Name</TableHead>
              <TableHead>Assigned Doctor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {waitingList.map((visit) => {
              const config = statusConfig[visit.status as keyof typeof statusConfig];
              const Icon = config.icon;
              return (
              <TableRow key={visit.id} className={visit.status === 'dispensed' ? 'text-muted-foreground' : ''}>
                <TableCell className="font-medium">{visit.patientName}</TableCell>
                <TableCell>{visit.doctorName}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-white flex items-center gap-2" style={{backgroundColor: config.color}}>
                    <Icon className="h-3 w-3" />
                    <span>{config.label}</span>
                  </Badge>
                </TableCell>
                <TableCell>{visit.time}</TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    {notifications.map((notification) => (
        <AlertDialog key={notification.id} open={true} onOpenChange={() => dismissNotification(notification.id)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Doctor Calling Patient</AlertDialogTitle>
                    <AlertDialogDescription>
                        {notification.message}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={() => dismissNotification(notification.id)}>OK</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    ))}
    </>
  );
}

    