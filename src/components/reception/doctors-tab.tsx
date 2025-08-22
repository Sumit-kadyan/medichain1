
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
import {
  MoreHorizontal,
  PlusCircle,
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
import { useClinicContext, Doctor } from '@/context/clinic-context';
import { AddDoctorDialog } from './add-doctor-dialog';
import { EditDoctorDialog } from './edit-doctor-dialog';

export function DoctorsTab() {
  const { toast } = useToast();
  const { doctors, deleteDoctor } = useClinicContext();
  const [isAddDoctorOpen, setAddDoctorOpen] = useState(false);
  const [isEditDoctorOpen, setEditDoctorOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const handleEditDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setEditDoctorOpen(true);
  };

  const handleDeleteDoctor = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      deleteDoctor(id);
      toast({
        title: 'Doctor Deleted',
        description: `${name} has been removed.`,
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline">Doctors Management</CardTitle>
            <CardDescription>
              Add, edit, and manage clinic doctors.
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setAddDoctorOpen(true)}>
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
              {doctors.map((doctor) => (
                <TableRow key={doctor.id}>
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
                        <DropdownMenuItem onClick={() => handleEditDoctor(doctor)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteDoctor(doctor.id, doctor.name)}>
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
      <AddDoctorDialog open={isAddDoctorOpen} onOpenChange={setAddDoctorOpen} />
      {selectedDoctor && (
        <EditDoctorDialog 
            open={isEditDoctorOpen} 
            onOpenChange={setEditDoctorOpen}
            doctor={selectedDoctor}
        />
      )}
    </>
  );
}
