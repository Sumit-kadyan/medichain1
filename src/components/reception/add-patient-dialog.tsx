
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useClinicContext, Patient } from '@/context/clinic-context';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  phone: z.string().regex(/^\d{3}-\d{3}-\d{4}$/, 'Phone number must be in XXX-XXX-XXXX format.'),
  age: z.coerce.number().int().min(0, 'Age must be a positive number.'),
  gender: z.enum(['Male', 'Female', 'Other']),
  doctorId: z.string().min(1, 'You must select a doctor.'),
});

interface AddPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPatientDialog({ open, onOpenChange }: AddPatientDialogProps) {
  const { doctors, addPatient, addPatientToWaitingList } = useClinicContext();
  const { toast } = useToast();
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
      phone: '',
      age: '' as any, // To fix uncontrolled component error
      gender: 'Male',
      doctorId: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      const newPatient = await addPatient(values);
      if (newPatient) {
        addPatientToWaitingList(newPatient.id, values.doctorId);
      }
      
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to add new patient. Please try again.',
        variant: 'destructive'
      })
    } finally {
        setLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, fieldChange: (value: string) => void) => {
    const input = e.target.value.replace(/\D/g, '');
    let formattedInput = '';
    if (input.length > 0) {
      formattedInput = input.substring(0, 3);
    }
    if (input.length >= 4) {
      formattedInput += '-' + input.substring(3, 6);
    }
    if (input.length >= 7) {
      formattedInput += '-' + input.substring(6, 10);
    }
    fieldChange(formattedInput);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Patient</DialogTitle>
          <DialogDescription>
            Fill in the details below to register a new patient and add them to the waiting list.
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
                  <Input id="name" {...field} className="col-span-3" />
                )}
              />
              {errors.name && <p className="col-span-4 text-xs text-destructive text-right">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                   <Input
                    id="phone"
                    {...field}
                    onChange={(e) => handlePhoneChange(e, field.onChange)}
                    placeholder="555-123-4567"
                    className="col-span-3"
                  />
                )}
              />
               {errors.phone && <p className="col-span-4 text-xs text-destructive text-right">{errors.phone.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="age" className="text-right">
                Age
              </Label>
              <Controller
                name="age"
                control={control}
                render={({ field }) => (
                  <Input
                    id="age"
                    type="number"
                    {...field}
                    value={field.value === undefined || field.value === null ? '' : field.value}
                    className="col-span-3"
                  />
                )}
              />
               {errors.age && <p className="col-span-4 text-xs text-destructive text-right">{errors.age.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Gender</Label>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="col-span-3 flex items-center space-x-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Male" id="r1" />
                      <Label htmlFor="r1">Male</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Female" id="r2" />
                      <Label htmlFor="r2">Female</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Other" id="r3" />
                      <Label htmlFor="r3">Other</Label>
                    </div>
                  </RadioGroup>
                )}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="doctor" className="text-right">
                Assign Doctor
              </Label>
              <Controller
                name="doctorId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map(doc => (
                        <SelectItem key={doc.id} value={doc.id}>
                          {doc.name} - {doc.specialization}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.doctorId && <p className="col-span-4 text-xs text-destructive text-right">{errors.doctorId.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save and Add to Waitlist'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

    