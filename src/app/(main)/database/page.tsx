
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
import { useClinicContext, Patient, Doctor } from '@/context/clinic-context';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


function DataTable({
  columns,
  data,
}: {
  columns: { key: string; label: string }[];
  data: Record<string, any>[];
}) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key}>{col.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                    No records found.
                </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow key={row.id}>
                {columns.map((col) => (
                  <TableCell key={col.key} className="max-w-[200px] truncate">
                    {String(row[col.key] ?? '')}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}


export default function DatabaseViewerPage() {
  const { patients, doctors, loading } = useClinicContext();

  const patientColumns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'age', label: 'Age' },
    { key: 'gender', label: 'Gender' },
    { key: 'lastVisit', label: 'Last Visit' },
    { key: 'registrationType', label: 'Reg. Type' },
  ];
  
  const doctorColumns = [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'specialization', label: 'Specialization' },
      { key: 'initials', label: 'Initials' },
  ];

  if (loading) {
    return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="ml-2">Loading database...</p>
        </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Database Viewer</CardTitle>
        <CardDescription>
          A read-only view of your Firestore collections.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="patients">
          <TabsList>
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="doctors">Doctors</TabsTrigger>
          </TabsList>
          <TabsContent value="patients">
            <DataTable columns={patientColumns} data={patients} />
          </TabsContent>
          <TabsContent value="doctors">
             <DataTable columns={doctorColumns} data={doctors} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
