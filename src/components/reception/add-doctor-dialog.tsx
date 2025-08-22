
'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      specialization: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    const doctorData = {
        ...values,
        avatarUrl: `https://placehold.co/100x100.png?text=${values.name.charAt(0)}`,
        initials: values.name.split(' ').map(n => n[0]).join('').toUpperCase(),
    }
    await addDoctor(doctorData);
    setLoading(false);
    reset();
    onOpenChange(false);
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
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input id="name" {...field} className="col-span-3" placeholder="e.g., Dr. Jane Smith" />
                )}
              />
              {errors.name && <p className="col-span-4 text-xs text-destructive text-right">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="specialization" className="text-right">
                Specialization
              </Label>
              <Controller
                name="specialization"
                control={control}
                render={({ field }) => (
                   <Input
                    id="specialization"
                    {...field}
                    placeholder="e.g., Cardiologist"
                    className="col-span-3"
                  />
                )}
              />
               {errors.specialization && <p className="col-span-4 text-xs text-destructive text-right">{errors.specialization.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Doctor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
