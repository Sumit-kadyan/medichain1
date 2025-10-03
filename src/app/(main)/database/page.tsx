

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
import { useClinicContext } from '@/context/clinic-context';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


function DataTable({
  columns,
  data,
  loading,
}: {
  columns: { key: string; label: string }[];
  data: Record<string, any>[];
  loading: boolean;
}) {
  if (loading) {
    return (
        <div className="flex h-24 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
        </div>
    )
  }
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
  ];
  
  const doctorColumns = [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'specialization', label: 'Specialization' },
      { key: 'initials', label: 'Initials' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Database Viewer</CardTitle>
        <CardDescription>
          A read-only view of your primary data collections. This shows all records, not just today's.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="patients">
          <TabsList>
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="doctors">Doctors</TabsTrigger>
          </TabsList>
          <TabsContent value="patients">
            <DataTable columns={patientColumns} data={patients} loading={loading} />
          </TabsContent>
          <TabsContent value="doctors">
             <DataTable columns={doctorColumns} data={doctors} loading={loading} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
