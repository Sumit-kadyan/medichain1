// src/app/bill/[id]/page.tsx
import dynamic from "next/dynamic";
import { adminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import ClinicLogo from "@/components/ClinicLogo";
import type { ClinicSettings, BillDetails } from "@/context/clinic-context";

const BillAdjuster = dynamic(() => import("@/components/BillAdjuster"), {
  ssr: false,
});

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

async function getBillData(
  id: string
): Promise<{ prescription: Prescription; settings: ClinicSettings } | null> {
  const [clinicId, prescriptionId] = id.split("_");
  if (!clinicId || !prescriptionId) return null;

  try {
    const clinicRef = adminDb.collection("clinics").doc(clinicId);
    const prescriptionRef = clinicRef.collection("pharmacyQueue").doc(prescriptionId);

    const [clinicSnap, prescriptionSnap] = await Promise.all([clinicRef.get(), prescriptionRef.get()]);

    if (!clinicSnap.exists || !prescriptionSnap.exists) return null;

    const prescription = { id: prescriptionSnap.id, ...(prescriptionSnap.data() as object) } as Prescription;
    const settings = clinicSnap.data() as ClinicSettings;
    return { prescription, settings };
  } catch (e) {
    console.error("getBillData error:", e);
    return null;
  }
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

export default async function BillPage({ params }: { params: { id: string } }) {
  const billData = await getBillData(params.id);
  if (!billData || !billData.prescription.billDetails) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="p-10 text-center bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Bill Not Found</h1>
          <p>The link may be invalid or the bill has not been generated yet.</p>
        </div>
      </div>
    );
  }

  const { prescription, settings } = billData;
  const { billDetails } = prescription;
  if (!billDetails) return <p>Bill details not found.</p>;

  const itemsCount = billDetails.items.length;
  const subtotal = billDetails.items.reduce((s, it) => s + it.price, 0);

  const visitDate = new Date(`${prescription.visitDate}T00:00:00`);
  const visitDateStr = formatDate(visitDate);
  const dueDate = prescription.dueDate?.toDate();
  const dueDateStr = formatDate(dueDate);

  let validityDays = 0;
  if (dueDate) {
    const diffTime = Math.abs(dueDate.getTime() - visitDate.getTime());
    validityDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // server initial placement rules
  const summaryOnPage2 = itemsCount >= 8;
  const summaryCompressed = itemsCount === 7;
  const summaryOnPage1 = !summaryOnPage2;

  // Summary block as a small component for re-use
  const SummaryBlock = ({ compressed = false }: { compressed?: boolean }) => (
    <div id="bill-summary" className={compressed ? "summary-compressed" : ""} style={{ pageBreakInside: "avoid" }}>
      <div className="w-full sm:w-1/2 md:w-2/5 space-y-1">
        <div className="flex justify-between">
          <span className="font-semibold text-gray-600">Subtotal:</span>
          <span>{settings.currency}{subtotal.toFixed(2)}</span>
        </div>

        {billDetails.taxInfo.amount > 0 && (
          <div className="flex justify-between">
            <span className="font-semibold text-gray-600">{billDetails.taxInfo.type} ({billDetails.taxInfo.percentage}%):</span>
            <span>{settings.currency}{billDetails.taxInfo.amount.toFixed(2)}</span>
          </div>
        )}

        {billDetails.appointmentFee > 0 && (
          <div className="flex justify-between">
            <span className="font-semibold text-gray-600">Appointment Fee:</span>
            <span>{settings.currency}{billDetails.appointmentFee.toFixed(2)}</span>
          </div>
        )}

        {billDetails.roundOff !== 0 && (
          <div className="flex justify-between">
            <span className="font-semibold text-gray-600">Round Off:</span>
            <span>{settings.currency}{billDetails.roundOff.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between bg-gray-200 rounded-md font-bold text-xl p-2">
          <span>Total:</span>
          <span>{settings.currency}{billDetails.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-[210mm] mx-auto my-6 bg-white rounded-lg font-sans text-gray-800 print:w-full">
      {/* Client adjuster: debug=false in production. Set true to log actions to console. */}
      <BillAdjuster itemsCount={itemsCount} />

      {/* PAGE 1 */}
      <div id="page1" className="page">
        <div className="page-body">
          <header className="flex justify-between items-start pb-6 border-b border-gray-200">
            <div className="flex items-start gap-6">
              <ClinicLogo svg={settings.logoSvg} />
              <div>
                <h1 className="text-4xl font-bold text-gray-900">{settings.clinicName}</h1>
                <p className="text-md text-gray-500 mt-1">{settings.clinicAddress}</p>
              </div>
            </div>
            <h2 className="text-3xl font-semibold text-gray-500 uppercase tracking-widest shrink-0">Invoice</h2>
          </header>

          <section className="grid grid-cols-2 gap-4 my-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase">Bill To</h3>
              <p className="text-lg font-bold mt-1">{prescription.patientName}</p>
              <p className="text-md text-gray-600">Prescribed by: {prescription.doctor}</p>
            </div>

            <div className="text-right">
              <p className="text-sm"><span className="font-semibold text-gray-600">Invoice #:</span> {`INV-${prescription.id}`}</p>
              <p className="text-sm"><span className="font-semibold text-gray-600">Date:</span> {visitDateStr}</p>
              {dueDateStr && <p className="text-sm"><span className="font-semibold text-gray-600">Due Date:</span> {dueDateStr}</p>}
            </div>
          </section>

          {/* items table: initially all items are rendered into page1-items */}
          <div style={{ overflow: "visible" }}>
            <table className="w-full text-md">
              <thead className="bg-gray-100 rounded-lg">
                <tr>
                  <th className="p-3 text-left font-semibold text-gray-600">Item</th>
                  <th className="p-3 text-right font-semibold text-gray-600">Price</th>
                </tr>
              </thead>
              <tbody id="page1-items">
                {billDetails.items.map((it, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="p-3">{it.item}</td>
                    <td className="p-3 text-right">{settings.currency}{it.price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* server chooses where summary goes initially */}
          {summaryOnPage1 && (
            <div className="mt-6 w-full flex justify-end no-page-break">
              <SummaryBlock compressed={summaryCompressed} />
            </div>
          )}
        </div>
      </div>

      {/* PAGE 2 */}
      <div id="page2" className="page">
        <div className="page-body">
          {/* page2 summary placeholder (client may move summary here) */}
          <div id="page2-summary" className="mb-4">
            {summaryOnPage2 && (
              <div className="mb-6 w-full flex justify-end no-page-break">
                <SummaryBlock />
              </div>
            )}
          </div>

          {/* table on page2 that will receive overflow rows */}
          <div style={{ overflow: "visible" }}>
            <table className="w-full text-md">
              <thead className="bg-gray-100 rounded-lg">
                <tr>
                  <th className="p-3 text-left font-semibold text-gray-600">Item</th>
                  <th className="p-3 text-right font-semibold text-gray-600">Price</th>
                </tr>
              </thead>
              <tbody id="page2-items">{/* BillAdjuster will append rows here when needed */}</tbody>
            </table>
          </div>

          {/* doctor's advice */}
          {prescription.advice && (
            <section className="mt-4 no-page-break">
              <h3 className="font-bold text-gray-700">Doctor's Advice:</h3>
              <blockquote className="text-md text-gray-600 italic mt-2 p-3 border-l-4 border-gray-200 bg-gray-50 rounded-r-lg">
                {prescription.advice}
              </blockquote>
            </section>
          )}
        </div>

        {/* footer pinned to bottom */}
        <footer id="page2-footer" className="footer-absolute">
          <p>Thank you for choosing {settings.clinicName}.</p>
          {validityDays > 0 && <p>This receipt is valid for {validityDays} days from the date of issue.</p>}
        </footer>
      </div>
    </div>
  );
}
