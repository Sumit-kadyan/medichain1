
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
import { Button } from '@/components/ui/button';
import { MoreHorizontal, User, Play, Check, Send, CircleCheck, AlertTriangle, Hourglass, Stethoscope, FlaskConical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
    prescribed: { label: 'Prescribed', icon: Check, color: 'bg-purple-500' },
    sent_to_pharmacy: { label: 'At Pharmacy', icon: FlaskConical, color: 'bg-indigo-500' },
    dispensed: { label: 'Done', icon: CircleCheck, color: 'bg-green-500' },
} as const;


export function WaitingRoomTab() {
    const { waitingList, updatePatientStatus, notifications, dismissNotification } = useClinicContext();
    
    const handleUpdateStatus = (patientId: string, newStatus: PatientStatus) => {
        updatePatientStatus(patientId, newStatus);
    };

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Today's Waiting Room</CardTitle>
        <CardDescription>
          Manage patients currently in the clinic.
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
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {waitingList.map((visit) => {
              const config = statusConfig[visit.status as keyof typeof statusConfig];
              const Icon = config.icon;
              return (
              <TableRow key={visit.id}>
                <TableCell className="font-medium">{visit.patientName}</TableCell>
                <TableCell>{visit.doctorName}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-white flex items-center gap-2" style={{backgroundColor: config.color}}>
                    <Icon className="h-3 w-3" />
                    <span>{config.label}</span>
                  </Badge>
                </TableCell>
                <TableCell>{visit.time}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleUpdateStatus(visit.id, 'called')}>
                        <User className="mr-2 h-4 w-4" /> Call Patient
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateStatus(visit.id, 'in_consult')}>
                        <Play className="mr-2 h-4 w-4" /> Start Consultation
                      </DropdownMenuItem>
                       <DropdownMenuItem onClick={() => handleUpdateStatus(visit.id, 'prescribed')}>
                        <Check className="mr-2 h-4 w-4" /> Mark Prescribed
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateStatus(visit.id, 'sent_to_pharmacy')}>
                        <Send className="mr-2 h-4 w-4" /> Send to Pharmacy
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
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
