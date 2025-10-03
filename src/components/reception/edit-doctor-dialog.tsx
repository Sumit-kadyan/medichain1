
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClinicContext, Doctor } from '@/context/clinic-context';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormMessage } from '../ui/form';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  specialization: z.string().min(2, 'Specialization must be at least 2 characters.'),
});

interface EditDoctorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctor: Doctor | null;
}

export function EditDoctorDialog({ open, onOpenChange, doctor }: EditDoctorDialogProps) {
  const { updateDoctor } = useClinicContext();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      specialization: '',
    },
  });
  
  useEffect(() => {
    if (open && doctor) {
        form.reset({
            name: doctor.name,
            specialization: doctor.specialization,
        });
    }
  }, [open, doctor, form])

  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!doctor) return;

    updateDoctor(doctor.id, values);
    toast({
        title: 'Doctor Updated',
        description: `Details for ${values.name} have been updated.`
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Doctor Details</DialogTitle>
          <DialogDescription>
            Update the details for {doctor?.name}.
          </DialogDescription>
        </DialogHeader>
        {doctor && (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                    <FormItem>
                        <Label>Name</Label>
                        <FormControl>
                        <Input placeholder="e.g., Dr. Jane Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="specialization"
                    render={({ field }) => (
                    <FormItem>
                        <Label>Specialization</Label>
                        <FormControl>
                        <Input placeholder="e.g., Cardiologist" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <DialogFooter>
                <Button type="submit">Save Changes</Button>
                </DialogFooter>
            </form>
            </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
