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

const waitingList = [
  {
    patientName: 'Liam Johnson',
    doctor: 'Dr. John Smith',
    status: 'waiting',
    time: '10:30 AM',
  },
  {
    patientName: 'Emma Brown',
    doctor: 'Dr. Emily White',
    status: 'called',
    time: '10:35 AM',
  },
  {
    patientName: 'James Wilson',
    doctor: 'Dr. John Smith',
    status: 'in_consult',
    time: '10:40 AM',
  },
  {
    patientName: 'Sophia Miller',
    doctor: 'Dr. Michael Brown',
    status: 'prescribed',
    time: '10:42 AM',
  },
    {
    patientName: 'Ava Davis',
    doctor: 'Dr. Emily White',
    status: 'sent_to_pharmacy',
    time: '10:50 AM',
  },
];

const statusConfig = {
    waiting: { label: 'Waiting', color: 'bg-yellow-500' },
    called: { label: 'Called', color: 'bg-blue-500' },
    in_consult: { label: 'In Consultation', color: 'bg-indigo-500' },
    prescribed: { label: 'Prescribed', color: 'bg-purple-500' },
    sent_to_pharmacy: { label: 'At Pharmacy', color: 'bg-green-500' },
} as const;

type Status = keyof typeof statusConfig;

export function WaitingRoomTab() {
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
            {waitingList.map((visit, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{visit.patientName}</TableCell>
                <TableCell>{visit.doctor}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-white" style={{backgroundColor: statusConfig[visit.status as Status].color}}>
                    {statusConfig[visit.status as Status].label}
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
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" /> Call Patient
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Play className="mr-2 h-4 w-4" /> Start Consultation
                      </DropdownMenuItem>
                       <DropdownMenuItem>
                        <Check className="mr-2 h-4 w-4" /> Mark Prescribed
                      </DropdownMenuItem>
                      <DropdownMenuItem>
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
