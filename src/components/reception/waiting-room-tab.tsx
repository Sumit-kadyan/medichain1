
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
import { MoreHorizontal, User, Play, Check, Send } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useClinicContext, PatientStatus } from '@/context/clinic-context';

const statusConfig = {
    waiting: { label: 'Waiting', color: 'bg-yellow-500' },
    called: { label: 'Called', color: 'bg-blue-500' },
    in_consult: { label: 'In Consultation', color: 'bg-indigo-500' },
    prescribed: { label: 'Prescribed', color: 'bg-purple-500' },
    sent_to_pharmacy: { label: 'At Pharmacy', color: 'bg-green-500' },
} as const;


export function WaitingRoomTab() {
    const { waitingList, updatePatientStatus } = useClinicContext();
    const receptionWaitingList = waitingList.filter(p => p.status !== 'dispensed');

    const handleUpdateStatus = (patientId: string, newStatus: PatientStatus) => {
        updatePatientStatus(patientId, newStatus);
    };

  return (
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
            {receptionWaitingList.map((visit) => (
              <TableRow key={visit.id}>
                <TableCell className="font-medium">{visit.patientName}</TableCell>
                <TableCell>{visit.doctorName}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-white" style={{backgroundColor: statusConfig[visit.status as keyof typeof statusConfig].color}}>
                    {statusConfig[visit.status as keyof typeof statusConfig].label}
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
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
