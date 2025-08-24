
'use client';

import { useState, useEffect } from 'react';
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
import { useClinicContext } from '@/context/clinic-context';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  specialization: z.string().min(2, 'Specialization must be at least 2 characters.'),
});

interface AddDoctorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddDoctorDialog({ open, onOpenChange }: AddDoctorDialogProps) {
  const { addDoctor } = useClinicContext();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      specialization: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: '',
        specialization: '',
      });
      setIsSubmitting(false);
    }
  }, [open, form]);
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const doctorData = {
          ...values,
          avatarUrl: `https://placehold.co/100x100.png?text=${values.name.charAt(0)}`,
          initials: values.name.split(' ').map(n => n[0]).join('').toUpperCase(),
      };
      
      await addDoctor(doctorData);
      
      toast({
        title: 'Doctor Added',
        description: `${values.name} has been added to the clinic.`,
      });

      onOpenChange(false);

    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to add new doctor. Please try again.',
        variant: 'destructive'
      });
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Doctor</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new doctor to the clinic.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
               <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
              <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Doctor'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
