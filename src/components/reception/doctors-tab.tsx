
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
import {
  MoreHorizontal,
  PlusCircle,
  User,
  Edit,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';


const initialDoctors = [
  {
    name: 'Dr. John Smith',
    specialization: 'Cardiology',
    avatarUrl: 'https://placehold.co/100x100/6699CC/FFFFFF.png',
    initials: 'JS',
  },
  {
    name: 'Dr. Emily White',
    specialization: 'Pediatrics',
    avatarUrl: 'https://placehold.co/100x100/8FBC8F/FFFFFF.png',
    initials: 'EW',
  },
  {
    name: 'Dr. Michael Brown',
    specialization: 'Neurology',
    avatarUrl: 'https://placehold.co/100x100/F0F8FF/333333.png',
    initials: 'MB',
  },
];

export function DoctorsTab() {
  const { toast } = useToast();
  const [doctors, setDoctors] = useState(initialDoctors);

  const addDoctor = () => {
    // In a real app, this would open a form to add a new doctor.
    const newDoctor = {
      name: `Dr. New Doctor ${doctors.length + 1}`,
      specialization: 'General',
      avatarUrl: `https://placehold.co/100x100.png?text=ND`,
      initials: 'ND',
    };
    setDoctors([...doctors, newDoctor]);
    toast({
      title: 'Doctor Added',
      description: `${newDoctor.name} has been added to the list.`,
    });
  };

  const editDoctor = (name: string) => {
    // In a real app, this would open a form to edit the doctor's details.
    alert(`Editing details for ${name}. This is a mock action.`);
  };

  const deleteDoctor = (name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      setDoctors(doctors.filter(d => d.name !== name));
      toast({
        title: 'Doctor Deleted',
        description: `${name} has been removed.`,
        variant: 'destructive',
      });
    }
  };


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-headline">Doctors Management</CardTitle>
          <CardDescription>
            Add, edit, and manage clinic doctors.
          </CardDescription>
        </div>
        <Button size="sm" onClick={addDoctor}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Doctor
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Specialization</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {doctors.map((doctor, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={doctor.avatarUrl} alt={doctor.name} data-ai-hint="doctor person" />
                      <AvatarFallback>{doctor.initials}</AvatarFallback>
                    </Avatar>
                    <span>{doctor.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{doctor.specialization}</Badge>
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
                      <DropdownMenuItem onClick={() => editDoctor(doctor.name)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => deleteDoctor(doctor.name)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
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
