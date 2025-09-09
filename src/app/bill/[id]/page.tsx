
import { doc, getDoc, collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BriefcaseMedical, Download, Printer } from 'lucide-react';
import { ClinicSettings, Prescription } from '@/context/clinic-context';


async function getBillData(compositeId: string) {
    const [clinicId, prescriptionId] = compositeId.split('_');

    if (!clinicId || !prescriptionId) {
        console.error('Invalid composite ID format');
        return null;
    }

    try {
        const clinicDocRef = doc(db, 'clinics', clinicId);
        const prescriptionDocRef = doc(db, 'clinics', clinicId, 'pharmacyQueue', prescriptionId);

        const clinicDocSnap = await getDoc(clinicDocRef);
        const prescriptionDocSnap = await getDoc(prescriptionDocRef);

        if (!clinicDocSnap.exists() || !prescriptionDocSnap.exists()) {
            return null;
        }

        const settings = clinicDocSnap.data() as ClinicSettings;
        const prescriptionData = prescriptionDocSnap.data();

        // This part is tricky as prices are not stored with the prescription.
        // For now, we will render the bill without prices.
        // In a real app, you would store priced items with the bill.
        const prices = prescriptionData.items.reduce((acc: Record<string, number>, item: string) => {
            // Find price in billItems if it exists, otherwise default to 0
            const billItem = prescriptionData.billItems?.find((bi: any) => bi.item === item);
            acc[item] = billItem ? billItem.price : 0;
            return acc;
        }, {});


        const prescription: Prescription & { prices?: Record<string, number>, dueDate?: string } = {
             id: prescriptionDocSnap.id, 
             ...prescriptionData,
             prices,
             dueDate: prescriptionData.dueDate?.toDate().toLocaleDateString()
        } as any;
        

        return { settings, prescription };

    } catch (error) {
        console.error("Error fetching bill data:", error);
        return null;
    }
}


export default async function BillPage({ params }: { params: { id: string } }) {
    const data = await getBillData(params.id);

    if (!data) {
        notFound();
    }

    const { settings, prescription } = data;
    const prices = prescription.prices || {};
    const total = Object.values(prices).reduce((sum, price) => sum + price, 0);


    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 font-sans">
            <div className="w-full max-w-3xl bg-white shadow-2xl rounded-lg p-8" id="bill-content">
                <header className="flex justify-between items-start pb-4 border-b">
                    <div className="flex items-center gap-3">
                         <BriefcaseMedical className="w-10 h-10 text-primary" />
                         <div>
                            <h1 className="text-3xl font-bold text-gray-800">{settings.clinicName}</h1>
                            <p className="text-sm text-gray-500">{settings.clinicAddress}</p>
                         </div>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-600">INVOICE</h2>
                </header>

                <section className="grid grid-cols-2 gap-4 my-6">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Bill To</h3>
                        <p className="font-bold text-lg">{prescription.patientName}</p>
                    </div>
                    <div className="text-right">
                        <p><span className="font-semibold">Invoice #:</span> {`INV-${prescription.id}`}</p>
                        <p><span className="font-semibold">Date:</span> {new Date().toLocaleDateString()}</p>
                        {prescription.dueDate && <p><span className="font-semibold">Due Date:</span> {prescription.dueDate}</p>}
                    </div>
                </section>

                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-3 text-left font-semibold text-gray-600">Item</th>
                                <th className="p-3 text-right font-semibold text-gray-600">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {prescription.items.map((item, index) => (
                                <tr key={index} className="border-b">
                                    <td className="p-3">{item}</td>
                                    <td className="p-3 text-right">{settings.currency}{prices[item]?.toFixed(2) || '0.00'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                <div className="flex justify-end mt-6">
                    <div className="w-full sm:w-1/2">
                         <div className="flex justify-between p-3">
                            <span className="font-semibold text-gray-600">Subtotal:</span>
                            <span className="font-mono">{settings.currency}{total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-gray-100 rounded-lg font-bold text-lg">
                            <span>Total:</span>
                            <span className="font-mono">{settings.currency}{total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {prescription.advice && (
                    <section className="mt-8">
                        <h3 className="font-bold text-gray-700">Doctor's Advice:</h3>
                        <blockquote className="text-sm text-gray-600 italic mt-2 p-3 border-l-4 bg-gray-50 rounded-r-lg">
                           {prescription.advice}
                        </blockquote>
                    </section>
                )}

                <footer className="mt-10 pt-6 border-t text-center text-xs text-gray-500">
                    <p>Thank you for choosing {settings.clinicName}. This receipt is valid till the due date.</p>
                </footer>
            </div>
             <div className="w-full max-w-3xl mt-6 flex justify-end gap-2 print:hidden">
                 <Button variant="outline" onClick={() => window.print()}>
                     <Printer className="mr-2" />
                     Print / Save PDF
                 </Button>
            </div>
        </div>
    );
}
