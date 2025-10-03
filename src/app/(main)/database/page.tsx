

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
import { useClinicContext, Patient } from '@/context/clinic-context';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';


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
  const { doctors, loading: contextLoading, clinicId } = useClinicContext();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(true);

  useEffect(() => {
    async function fetchAllPatients() {
        if (!clinicId) return;
        setPatientsLoading(true);
        try {
            const patientsCollection = collection(db, 'clinics', clinicId, 'patients');
            const patientSnapshot = await getDocs(patientsCollection);
            const patientList = patientSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
            setPatients(patientList);
        } catch (error) {
            console.error("Failed to fetch all patients for database view", error);
        } finally {
            setPatientsLoading(false);
        }
    }
    fetchAllPatients();
  }, [clinicId])

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
            <DataTable columns={patientColumns} data={patients} loading={patientsLoading} />
          </TabsContent>
          <TabsContent value="doctors">
             <DataTable columns={doctorColumns} data={doctors} loading={contextLoading} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
