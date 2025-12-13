// src/app/prescription/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { ClinicSettings, Prescription } from "@/context/clinic-context";
import ClinicLogo from "@/components/ClinicLogo";
import { Loader2 } from 'lucide-react';


async function getPrescriptionData(
  id: string
): Promise<{ prescription: Prescription; settings: ClinicSettings } | null> {
  const [clinicId, prescriptionId] = id.split("_");

  if (!clinicId || !prescriptionId) {
    console.error("Invalid composite ID for prescription:", id);
    return null;
  }

  return null;
}

function formatDate(date: Date | undefined): string | null {
  if (!date) return null;
  const day = date.getDate();
  const year = date.getFullYear();
  const month = date.toLocaleString("default", { month: "short" });

  let suffix = "th";
  if (day === 1 || day === 21 || day === 31) suffix = "st";
  else if (day === 2 || day === 22) suffix = "nd";
  else if (day === 3 || day === 23) suffix = "rd";

  return `${day}${suffix} ${month}, ${year}`;
}

export default function PrescriptionPage({
  params,
}: {
  params: { id: string };
}) {
  const db = useFirestore();
  const [data, setData] = useState<{ prescription: Prescription; settings: ClinicSettings } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getPrescriptionData() {
        if (!db || !params.id) {
            setError("Invalid request.");
            setLoading(false);
            return;
        }

        const [clinicId, prescriptionId] = params.id.split("_");

        if (!clinicId || !prescriptionId) {
            setError("Invalid prescription identifier.");
            setLoading(false);
            return;
        }

        try {
            const clinicRef = doc(db, "clinics", clinicId);
            const prescriptionRef = doc(clinicRef, "pharmacyQueue", prescriptionId);

            const [clinicSnap, prescriptionSnap] = await Promise.all([
                getDoc(clinicRef),
                getDoc(prescriptionRef),
            ]);

            if (!clinicSnap.exists() || !prescriptionSnap.exists()) {
                setError("Prescription not found.");
                setLoading(false);
                return;
            }

            const prescription = { id: prescriptionSnap.id, ...prescriptionSnap.data() } as Prescription;
            const settings = clinicSnap.data() as ClinicSettings;

            setData({ prescription, settings });
        } catch (err) {
            console.error("Error fetching prescription data from Firestore:", err);
            setError("An error occurred while fetching the prescription.");
        } finally {
            setLoading(false);
        }
    }

    getPrescriptionData();
  }, [db, params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="p-10 text-center bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            {error || "Prescription Not Found"}
          </h1>
          <p>The link may be invalid or this prescription does not exist.</p>
        </div>
      </div>
    );
  }

  const { prescription, settings } = data;
  const visitDate = new Date(`${prescription.visitDate}T00:00:00`);
  const visitDateStr = formatDate(visitDate);

  return (
    <div className="w-[210mm] min-h-[297mm] mx-auto my-6 bg-white rounded-lg shadow-2xl font-sans text-gray-800 print:shadow-none print:my-0 flex flex-col">
      <div className="p-8 flex-1 flex flex-col">
        <header className="flex justify-between items-start pb-6 border-b-2 border-gray-300">
          <div className="flex items-center gap-6">
            <ClinicLogo svg={settings.logoSvg} />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {settings.clinicName}
              </h1>
              <p className="text-md text-gray-500 mt-1">
                {settings.clinicAddress}
              </p>
               <p className="text-md font-semibold text-gray-700 mt-2">
                Dr. {prescription.doctor}
              </p>
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-500 uppercase tracking-widest shrink-0">
            Prescription
          </h2>
        </header>

        <section className="grid grid-cols-2 gap-4 my-8 pb-4 border-b border-gray-200">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase">
              Patient
            </h3>
            <p className="text-lg font-bold mt-1">{prescription.patientName}</p>
          </div>
          <div className="text-right">
            <p className="text-sm">
              <span className="font-semibold text-gray-600">
                Prescription #:
              </span>{" "}
              {`PRESC-${prescription.id.substring(0, 8).toUpperCase()}`}
            </p>
            <p className="text-sm">
              <span className="font-semibold text-gray-600">Date:</span>{" "}
              {visitDateStr}
            </p>
          </div>
        </section>

        <section className="flex-1">
          <h3 className="text-lg font-bold mb-4 flex items-center">
             <span className="text-2xl mr-2">℞</span> Prescribed Medication
          </h3>
          <div className="space-y-3 pl-4">
             {prescription.items.map((item, index) => (
                <div key={index} className="text-md">
                   <p>{item}</p>
                </div>
            ))}
          </div>
        </section>

        {prescription.advice && (
          <section className="mt-8">
            <h3 className="font-bold text-gray-700">Doctor's Advice:</h3>
            <blockquote className="text-md text-gray-600 italic mt-2 p-3 border-l-4 border-gray-200 bg-gray-50 rounded-r-lg">
              {prescription.advice}
            </blockquote>
          </section>
        )}
        
        {prescription.billDetails?.appointmentFee && prescription.billDetails.appointmentFee > 0 && (
          <div className="mt-8 pt-4">
              <h3 className="font-semibold text-gray-800">Fees</h3>
              <div className="flex justify-between items-center mt-2 border-t border-b py-2">
                  <p>Consultation / Appointment Fee</p>
                  <p className="font-bold">{settings.currency}{prescription.billDetails.appointmentFee.toFixed(2)}</p>
              </div>
          </div>
        )}


        <footer className="mt-auto pt-8 border-t border-dashed border-gray-400 text-center text-xs text-gray-500">
          <p>This is a medical prescription and should be used responsibly.</p>
          <p>Thank you for choosing {settings.clinicName}.</p>
        </footer>
      </div>
    </div>
  );
}
