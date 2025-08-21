import { DrugSuggestionForm } from '@/components/ai/drug-suggestion-form';
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
import { Play, Clock, FileText, Pill } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const waitingPatients = [
  { name: 'Liam Johnson', status: 'waiting', time: '10:30 AM' },
  { name: 'Emma Brown', status: 'called', time: '10:35 AM' },
];

const patientHistory = [
    { date: '2023-08-15', type: 'visit', description: 'Consultation with Dr. Smith for annual check-up.', icon: FileText },
    { date: '2023-08-15', type: 'prescription', description: 'Prescribed Lisinopril 10mg.', icon: Pill },
    { date: '2023-02-10', type: 'visit', description: 'Follow-up for hypertension management.', icon: FileText },
];

export default function DoctorPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Waiting List</CardTitle>
            <CardDescription>
              Patients waiting for consultation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Waiting Since</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {waitingPatients.map((patient, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{patient.name}</TableCell>
                    <TableCell>
                      <Badge variant={patient.status === 'called' ? 'default' : 'secondary'}>{patient.status}</Badge>
                    </TableCell>
                    <TableCell>{patient.time}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline">
                        <Play className="mr-2 h-4 w-4" />
                        Start Consultation
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <DrugSuggestionForm />
      </div>
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
             <div className="flex items-center gap-3 mb-2">
                <Avatar className="h-12 w-12">
                    <AvatarImage src="https://placehold.co/100x100.png" alt="Liam Johnson" />
                    <AvatarFallback>LJ</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="font-headline">Liam Johnson</CardTitle>
                    <CardDescription>Male, 28 years</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent>
             <h3 className="font-semibold text-lg mb-4 text-foreground">Patient History</h3>
             <div className="relative pl-6">
                <div className="absolute left-0 top-0 h-full w-0.5 bg-border -translate-x-1/2 ml-3"></div>
                {patientHistory.map((item, index) => (
                    <div key={index} className="mb-6 flex items-start gap-4">
                        <div className="absolute left-0 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary">
                            <item.icon className="h-4 w-4"/>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-foreground">{item.description}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Clock className="h-3 w-3" />{item.date}</p>
                        </div>
                    </div>
                ))}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
