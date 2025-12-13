// src/app/bill/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Timestamp } from 'firebase/firestore';
import ClinicLogo from '@/components/ClinicLogo';
import type { ClinicSettings, BillDetails } from '@/context/clinic-context';
import { Loader2 } from 'lucide-react';

interface Prescription {
  id: string;
  waitingPatientId: string;
  patientName: string;
  doctor: string;
  time: string;
  items: string[];
  status: string;
  visitDate: string;
  advice?: string;
  billDetails?: BillDetails;
  dueDate?: Timestamp;
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

function BillSummary({
  billDetails,
  settings,
  compressed = false,
}: {
  billDetails: BillDetails;
  settings: ClinicSettings;
  compressed?: boolean;
}) {
  const subtotal = billDetails.items.reduce((sum, item) => sum + item.price, 0);

  return (
    <div
      className={`mt-6 w-full flex justify-end ${
        compressed ? "summary-compressed" : ""
      }`}
      style={{ pageBreakInside: "avoid", breakInside: "avoid" }}
    >
      <div
        className={`w-full sm:w-1/2 md:w-2/5 space-y-1 ${
          compressed ? "p-2 text-sm" : "p-3 text-base"
        } bg-transparent`}
      >
        <div className="flex justify-between">
          <span className="font-semibold text-gray-600">Subtotal:</span>
          <span>
            {settings.currency}
            {subtotal.toFixed(2)}
          </span>
        </div>

        {billDetails.taxInfo.amount > 0 && (
          <div className="flex justify-between">
            <span className="font-semibold text-gray-600">
              {billDetails.taxInfo.type} ({billDetails.taxInfo.percentage}%):
            </span>
            <span>
              {settings.currency}
              {billDetails.taxInfo.amount.toFixed(2)}
            </span>
          </div>
        )}

        {billDetails.appointmentFee > 0 && (
          <div className="flex justify-between">
            <span className="font-semibold text-gray-600">
              Appointment Fee:
            </span>
            <span>
              {settings.currency}
              {billDetails.appointmentFee.toFixed(2)}
            </span>
          </div>
        )}

        {billDetails.roundOff !== 0 && (
          <div className="flex justify-between">
            <span className="font-semibold text-gray-600">Round Off:</span>
            <span>
              {settings.currency}
              {billDetails.roundOff.toFixed(2)}
            </span>
          </div>
        )}

        <div className="flex justify-between bg-gray-200 rounded-md font-bold text-xl p-2">
          <span>Total:</span>
          <span>
            {settings.currency}
            {billDetails.total.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function BillPage({
  params,
}: {
  params: { id: string };
}) {
  const db = useFirestore();
  const [billData, setBillData] = useState<{ prescription: Prescription; settings: ClinicSettings } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getBillData() {
      if (!db || !params.id) {
        setError("Invalid request.");
        setLoading(false);
        return;
      }

      const [clinicId, prescriptionId] = params.id.split("_");

      if (!clinicId || !prescriptionId) {
        setError("Invalid bill identifier.");
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
          setError("Bill not found.");
          setLoading(false);
          return;
        }

        const prescription = {
          id: prescriptionSnap.id,
          ...prescriptionSnap.data(),
        } as Prescription;

        const settings = clinicSnap.data() as ClinicSettings;

        if (!prescription.billDetails) {
          setError("Bill details have not been generated for this prescription yet.");
          setLoading(false);
          return;
        }

        setBillData({ prescription, settings });
      } catch (err) {
        console.error("Error fetching bill data from Firestore:", err);
        setError("An error occurred while fetching the bill.");
      } finally {
        setLoading(false);
      }
    }

    getBillData();
  }, [db, params.id]);

  if (loading) {
     return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !billData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="p-10 text-center bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            {error || "Bill Not Found"}
          </h1>
          <p>The link may be invalid or the bill has not been generated yet.</p>
        </div>
      </div>
    );
  }

  const { prescription, settings } = billData;
  const { billDetails } = prescription;

  if (!billDetails) return <p>Bill details not found.</p>;

  const itemsCount = billDetails.items.length;

  const visitDate = new Date(`${prescription.visitDate}T00:00:00`);
  const visitDateStr = formatDate(visitDate);
  const dueDate = prescription.dueDate?.toDate();
  const dueDateStr = formatDate(dueDate);

  let validityDays = 0;
  if (dueDate) {
    const diffTime = Math.abs(dueDate.getTime() - visitDate.getTime());
    validityDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Placement rules
  const summaryOnPage2 = itemsCount >= 8;
  const summaryCompressed = itemsCount === 7;
  const showSummaryOnPage1 = !summaryOnPage2;

  return (
    <div className="w-[210mm] mx-auto my-6 bg-white rounded-lg font-sans text-gray-800 print:w-full">
      {/* PAGE 1 */}
      <div className="page h-[297mm] mx-auto p-8 flex flex-col justify-start relative bg-white">
        <header className="flex justify-between items-start pb-6 border-b border-gray-200">
          <div className="flex items-start gap-6">
            <ClinicLogo svg={settings.logoSvg} />
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                {settings.clinicName}
              </h1>
              <p className="text-md text-gray-500 mt-1">
                {settings.clinicAddress}
              </p>
            </div>
          </div>

          <h2 className="text-3xl font-semibold text-gray-500 uppercase tracking-widest shrink-0">
            Invoice
          </h2>
        </header>

        <section className="grid grid-cols-2 gap-4 my-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase">
              Bill To
            </h3>
            <p className="text-lg font-bold mt-1">
              {prescription.patientName}
            </p>
            <p className="text-md text-gray-600">
              Prescribed by: {prescription.doctor}
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm">
              <span className="font-semibold text-gray-600">Invoice #:</span>{" "}
              {`INV-${prescription.id}`}
            </p>
            <p className="text-sm">
              <span className="font-semibold text-gray-600">Date:</span>{" "}
              {visitDateStr}
            </p>
            {dueDateStr && (
              <p className="text-sm">
                <span className="font-semibold text-gray-600">Due Date:</span>{" "}
                {dueDateStr}
              </p>
            )}
          </div>
        </section>

        {/* Items */}
        <div className="flex-1 overflow-hidden">
          <table className="w-full text-md">
            <thead className="bg-gray-100 rounded-lg">
              <tr>
                <th className="p-3 text-left font-semibold text-gray-600">
                  Item
                </th>
                <th className="p-3 text-right font-semibold text-gray-600">
                  Price
                </th>
              </tr>
            </thead>
            <tbody>
              {billDetails.items.map((it, i) => (
                <tr
                  key={i}
                  className="border-b border-gray-100"
                  style={{ pageBreakInside: "avoid" }}
                >
                  <td className="p-3">{it.item}</td>
                  <td className="p-3 text-right">
                    {settings.currency}
                    {it.price.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary on Page 1 if rules allow */}
        {showSummaryOnPage1 && (
          <BillSummary
            billDetails={billDetails}
            settings={settings}
            compressed={summaryCompressed}
          />
        )}
      </div>

      {/* PAGE 2 */}
      <div className="page h-[297mm] mx-auto p-8 relative bg-white flex flex-col">
        {/* Summary if >=8 items */}
        {summaryOnPage2 && (
          <BillSummary billDetails={billDetails} settings={settings} />
        )}

        {/* Doctor's advice */}
        {prescription.advice && (
          <section
            className="mt-6"
            style={{ pageBreakInside: "avoid", breakInside: "avoid" }}
          >
            <h3 className="font-bold text-gray-700">Doctor's Advice:</h3>
            <blockquote className="text-md text-gray-600 italic mt-2 p-3 border-l-4 border-gray-200 bg-gray-50 rounded-r-lg">
              {prescription.advice}
            </blockquote>
          </section>
        )}

        {/* Footer pinned bottom */}
        <footer className="bill-footer pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>Thank you for choosing {settings.clinicName}.</p>
          {validityDays > 0 && (
            <p>This receipt is valid for {validityDays} days from the date of issue.</p>
          )}
        </footer>
      </div>
    </div>
  );
}
