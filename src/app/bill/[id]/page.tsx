import { db } from "@/lib/firebase"; // adjust if your firebase config lives elsewhere
import { doc, getDoc, Timestamp } from "firebase/firestore";

interface BillItem {
  item: string;
  price: number;
}

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
  billItems?: BillItem[];
  dueDate?: Timestamp;
}

async function getPrescription(id: string): Promise<Prescription | null> {
  const ref = doc(db, "prescriptions", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Prescription;
}

export default async function BillPage({ params }: { params: { id: string } }) {
  const prescription = await getPrescription(params.id);

  if (!prescription) {
    return <div className="p-6 text-red-600">Bill not found.</div>;
  }

  const total =
    prescription.billItems?.reduce((sum, b) => sum + (b.price || 0), 0) || 0;

  const dueDateStr = prescription.dueDate
    ? (prescription.dueDate instanceof Timestamp
        ? prescription.dueDate.toDate()
        : new Date(
            (prescription.dueDate as any)._seconds * 1000
          )).toLocaleDateString()
    : null;

  return (
    <div className="max-w-2xl mx-auto bg-white shadow p-6 rounded-lg">
      <h1 className="text-2xl font-bold mb-4">Clinic Bill</h1>
      <p>
        <strong>Patient:</strong> {prescription.patientName}
      </p>
      <p>
        <strong>Doctor:</strong> {prescription.doctor}
      </p>
      <p>
        <strong>Date:</strong> {prescription.visitDate} {prescription.time}
      </p>
      {dueDateStr && (
        <p>
          <strong>Due Date:</strong> {dueDateStr}
        </p>
      )}

      <h2 className="text-xl font-semibold mt-6 mb-2">Prescription Items</h2>
      <ul className="list-disc list-inside">
        {prescription.items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>

      {prescription.advice && (
        <div className="mt-4">
          <strong>Advice:</strong> {prescription.advice}
        </div>
      )}

      {prescription.billItems && (
        <>
          <h2 className="text-xl font-semibold mt-6 mb-2">Bill</h2>
          <ul>
            {prescription.billItems.map((b, i) => (
              <li key={i} className="flex justify-between">
                <span>{b.item}</span>
                <span>₹{b.price.toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 font-bold flex justify-between">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </>
      )}
    </div>
  );
}
