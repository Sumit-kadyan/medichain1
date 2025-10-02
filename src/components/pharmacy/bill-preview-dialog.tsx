
'use client';

import { useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Prescription, BillDetails } from '@/context/clinic-context';
import { useClinicContext } from '@/context/clinic-context';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useToast } from '@/hooks/use-toast';
import ClinicLogo from '../ClinicLogo';
import { ScrollArea } from '../ui/scroll-area';

interface BillPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billData: {
    prescription: Prescription;
    billDetails: BillDetails;
    dueDate: Date;
  } | null;
}

function formatDate(date: Date | undefined): string | null {
    if (!date) return null;
    const day = date.getDate();
    const year = date.getFullYear();
    const month = date.toLocaleString('default', { month: 'short' });

    let suffix = 'th';
    if (day === 1 || day === 21 || day === 31) suffix = 'st';
    else if (day === 2 || day === 22) suffix = 'nd';
    else if (day === 3 || day === 23) suffix = 'rd';

    return `${day}${suffix} ${month}, ${year}`;
}

const BillSummary = ({ billDetails, settings }: { billDetails: BillDetails; settings: any; }) => {
    const subtotal = billDetails.items.reduce((sum, item) => sum + item.price, 0);

    return (
        <div className="flex justify-end mt-4">
            <div className="w-full sm:w-2/3 md:w-1/2 space-y-1 text-sm">
                <div className="flex justify-between p-2">
                    <span className="font-semibold text-gray-600">Subtotal:</span>
                    <span>{settings.currency}{subtotal.toFixed(2)}</span>
                </div>
                {billDetails.taxInfo.amount > 0 && (
                    <div className="flex justify-between p-2">
                        <span className="font-semibold text-gray-600">{billDetails.taxInfo.type} ({billDetails.taxInfo.percentage}%):</span>
                        <span>{settings.currency}{billDetails.taxInfo.amount.toFixed(2)}</span>
                    </div>
                )}
                {billDetails.appointmentFee > 0 && (
                    <div className="flex justify-between p-2">
                        <span className="font-semibold text-gray-600">Appointment Fee:</span>
                        <span>{settings.currency}{billDetails.appointmentFee.toFixed(2)}</span>
                    </div>
                )}
                {billDetails.roundOff !== 0 && (
                    <div className="flex justify-between p-2">
                        <span className="font-semibold text-gray-600">Round Off:</span>
                        <span>{settings.currency}{billDetails.roundOff.toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between p-2 bg-gray-100 rounded-md font-bold">
                    <span>Total:</span>
                    <span>{settings.currency}{billDetails.total.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
};

export function BillPreviewDialog({
  open,
  onOpenChange,
  billData,
}: BillPreviewDialogProps) {
  const { settings } = useClinicContext();
  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  if (!billData || !settings) return null;

  const { prescription, billDetails, dueDate } = billData;

  const handleDownload = async () => {
    const page1 = page1Ref.current;
    const page2 = page2Ref.current;
    if (!page1) return;

    try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = 210;
        const pdfHeight = 297;

        const canvas1 = await html2canvas(page1, { scale: 3, useCORS: true, windowWidth: page1.scrollWidth, windowHeight: page1.scrollHeight });
        const imgData1 = canvas1.toDataURL('image/png');
        pdf.addImage(imgData1, 'PNG', 0, 0, pdfWidth, pdfHeight);

        // Check if page 2 has content before adding it
        if (page2 && page2.innerHTML.trim() !== '') {
            const canvas2 = await html2canvas(page2, { scale: 3, useCORS: true, windowWidth: page2.scrollWidth, windowHeight: page2.scrollHeight });
            const imgData2 = canvas2.toDataURL('image/png');
            pdf.addPage();
            pdf.addImage(imgData2, 'PNG', 0, 0, pdfWidth, pdfHeight);
        }
      
        pdf.save(`bill-${prescription.patientName.replace(/\s/g, '_')}-${prescription.id}.pdf`);

    } catch (error) {
        console.error('oops, something went wrong!', error);
        toast({ title: 'PDF Error', description: 'Could not generate PDF. Please try again.', variant: 'destructive' });
    }
  };
  
  const visitDate = new Date(`${prescription.visitDate}T00:00:00`);
  const visitDateStr = formatDate(visitDate);
  const dueDateStr = formatDate(dueDate);

  let validityDays = 0;
  if (dueDate) {
    const diffTime = Math.abs(dueDate.getTime() - visitDate.getTime());
    validityDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Simplified content splitting
  const MAX_ITEMS_PAGE_1 = 15; // Adjust this based on average item height
  const itemsPage1 = billDetails.items.slice(0, MAX_ITEMS_PAGE_1);
  const itemsPage2 = billDetails.items.slice(MAX_ITEMS_PAGE_1);
  const showPage2 = itemsPage2.length > 0;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline">Bill Preview</DialogTitle>
          <DialogDescription>
            Review the final bill. What you see here is what will be downloaded.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-muted/40 p-4 rounded-lg">
          <div className="flex justify-center items-start gap-4">
              {/* Page 1 */}
              <div ref={page1Ref} className="a4-page-container">
                  <div className="a4-page">
                    <header className="flex justify-between items-start pb-4 border-b">
                        <div className="flex items-start gap-4">
                            <ClinicLogo svg={settings.logoSvg} />
                            <div>
                                <h1 className="text-xl font-bold text-gray-800">{settings.clinicName}</h1>
                                <p className="text-xs text-gray-500">{settings.clinicAddress}</p>
                            </div>
                        </div>
                        <h2 className="text-lg font-semibold text-gray-600 shrink-0 uppercase">Invoice</h2>
                    </header>
                    <section className="grid grid-cols-2 gap-4 my-4">
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase">Bill To</h3>
                            <p className="font-bold text-sm">{prescription.patientName}</p>
                            <p className="text-xs text-gray-500">Prescribed by: {prescription.doctor}</p>
                        </div>
                        <div className="text-right text-xs">
                            <p><span className="font-semibold">Invoice #:</span> {`INV-${prescription.id}`}</p>
                            <p><span className="font-semibold">Date:</span> {visitDateStr}</p>
                            {dueDateStr && <p><span className="font-semibold">Due Date:</span> {dueDateStr}</p>}
                        </div>
                    </section>
                    <table className="w-full text-xs">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-2 text-left font-semibold">Item</th>
                                <th className="p-2 text-right font-semibold">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itemsPage1.map((item, index) => (
                                <tr key={index} className="border-b">
                                    <td className="p-2">{item.item}</td>
                                    <td className="p-2 text-right">{settings.currency}{item.price.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!showPage2 && (
                         <div className="mt-auto pt-4">
                            <BillSummary billDetails={billDetails} settings={settings} />
                            {prescription.advice && (
                                <section className="mt-4">
                                    <h3 className="font-bold text-gray-700 text-sm">Doctor's Advice:</h3>
                                    <blockquote className="text-xs text-gray-600 italic mt-1 p-2 border-l-2">
                                      {prescription.advice}
                                    </blockquote>
                                </section>
                            )}
                            <footer className="mt-4 pt-2 border-t text-center text-[10px] text-gray-500">
                                <p>Thank you for choosing {settings.clinicName}.</p>
                                {validityDays > 0 && <p>This receipt is valid for {validityDays} days from the date of issue.</p>}
                            </footer>
                        </div>
                    )}
                  </div>
              </div>
              
              {/* Page 2 */}
              {showPage2 && (
                  <div ref={page2Ref} className="a4-page-container">
                      <div className="a4-page">
                          <p className="text-center text-xs text-gray-400 pb-2">Page 2</p>
                           <table className="w-full text-xs">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-2 text-left font-semibold">Item</th>
                                        <th className="p-2 text-right font-semibold">Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {itemsPage2.map((item, index) => (
                                        <tr key={index} className="border-b">
                                            <td className="p-2">{item.item}</td>
                                            <td className="p-2 text-right">{settings.currency}{item.price.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                             <div className="mt-auto pt-4">
                                <BillSummary billDetails={billDetails} settings={settings} />
                                {prescription.advice && (
                                    <section className="mt-4">
                                        <h3 className="font-bold text-gray-700 text-sm">Doctor's Advice:</h3>
                                        <blockquote className="text-xs text-gray-600 italic mt-1 p-2 border-l-2">
                                        {prescription.advice}
                                        </blockquote>
                                    </section>
                                )}
                                <footer className="mt-4 pt-2 border-t text-center text-[10px] text-gray-500">
                                    <p>Thank you for choosing {settings.clinicName}.</p>
                                    {validityDays > 0 && <p>This receipt is valid for {validityDays} days from the date of issue.</p>}
                                </footer>
                            </div>
                      </div>
                  </div>
              )}
          </div>
        </div>

        <DialogFooter>
            <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" /> Download as PDF
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    