
'use client';
import { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Stethoscope,
    Hourglass,
    AlertTriangle,
    Check,
    FlaskConical,
    CircleCheck,
    CheckCircle2,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useClinicContext, WaitingPatient } from '@/context/clinic-context';
import { useToast } from '@/hooks/use-toast';

const statusConfig = {
    waiting: { label: 'Waiting', icon: Hourglass, color: 'bg-yellow-500' },
    called: { label: 'Called', icon: AlertTriangle, color: 'bg-orange-500' },
    in_consult: { label: 'In Consultation', icon: Stethoscope, color: 'bg-blue-500' },
    prescribed: { label: 'Consulted', icon: Check, color: 'bg-purple-500' },
    sent_to_pharmacy: { label: 'At Pharmacy', icon: FlaskConical, color: 'bg-indigo-500' },
    dispensed: { label: 'Done', icon: CircleCheck, color: 'bg-green-500' },
} as const;


function MarkAsDoneButton({ patient }: { patient: WaitingPatient }) {
  const { toast } = useToast();
  const { updatePatientStatus } = useClinicContext();
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleMarkAsDone = () => {
    updatePatientStatus(patient.id, 'dispensed');
    toast({
        title: 'Patient Marked as Done',
        description: `${patient.patientName} has been moved to the completed list.`,
    });
    setIsDialogOpen(false);
  };

  // Reset confirmation when dialog is closed
  const onOpenChange = (open: boolean) => {
    if (!open) {
        setIsConfirmed(false);
    }
    setIsDialogOpen(open);
  }

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full">
            <CheckCircle2 className="h-5 w-5" />
            <span className="sr-only">Mark {patient.patientName} as Done</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will manually mark <strong>{patient.patientName}</strong> as "Done". This is usually handled by the pharmacy but can be done here to clear the active queue. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
         <div className="flex items-center space-x-2 my-4">
            <Checkbox id="confirm-done" checked={isConfirmed} onCheckedChange={() => setIsConfirmed(!isConfirmed)} />
            <Label htmlFor="confirm-done" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                I understand and wish to proceed.
            </Label>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsConfirmed(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={!isConfirmed} onClick={handleMarkAsDone}>
            Mark as Done
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


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
              <TableHead className="text-right">Actions</TableHead>
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
                <TableCell className="text-right">
                    {visit.status !== 'dispensed' && (
                        <MarkAsDoneButton patient={visit} />
                    )}
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
