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
import { Input } from '@/components/ui/input';
import {
  MoreHorizontal,
  Search,
  UserPlus,
  RefreshCw,
  Play,
  Edit,
  FileText,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const patients = [
  {
    name: 'Liam Johnson',
    phone: '555-0101',
    gender: 'Male',
    age: 28,
    lastVisit: '2023-10-26',
    receiptStatus: 'Active',
  },
  {
    name: 'Olivia Smith',
    phone: '555-0102',
    gender: 'Female',
    age: 45,
    lastVisit: '2023-10-25',
    receiptStatus: 'Expired',
  },
  {
    name: 'Noah Williams',
    phone: '555-0103',
    gender: 'Male',
    age: 12,
    lastVisit: '2023-09-15',
    receiptStatus: 'None',
  },
  {
    name: 'Emma Brown',
    phone: '555-0104',
    gender: 'Female',
    age: 62,
    lastVisit: '2023-10-28',
    receiptStatus: 'Active',
  },
];

export function PatientsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Patient Management</CardTitle>
        <CardDescription>
          Search, add, and manage patient records and visits.
        </CardDescription>
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Search by name or phone..." className="pl-8 sm:w-full" />
            </div>
            <div className='flex gap-2'>
            <Button variant="outline">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Patient
            </Button>
            <Button variant="outline">
              <Play className="mr-2 h-4 w-4" />
              Continue Patient
            </Button>
            <Button variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Renew Patient
            </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Phone</TableHead>
              <TableHead className="hidden md:table-cell">Gender / Age</TableHead>
              <TableHead className="hidden sm:table-cell">Last Visit</TableHead>
              <TableHead>Receipt Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.map((patient, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{patient.name}</TableCell>
                <TableCell className="hidden sm:table-cell">{patient.phone}</TableCell>
                <TableCell className="hidden md:table-cell">{`${patient.gender}, ${patient.age}`}</TableCell>
                <TableCell className="hidden sm:table-cell">{patient.lastVisit}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      patient.receiptStatus === 'Active'
                        ? 'default'
                        : patient.receiptStatus === 'Expired'
                        ? 'destructive'
                        : 'secondary'
                    }
                    className="bg-opacity-20 text-opacity-100"
                  >
                    {patient.receiptStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Patient
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <FileText className="mr-2 h-4 w-4" />
                        View History
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
