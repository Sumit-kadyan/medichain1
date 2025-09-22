

'use client';

import { useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Prescription, BillDetails } from '@/context/clinic-context';
import { useClinicContext } from '@/context/clinic-context';
import { Download, QrCode, Copy, Check } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'react-qr-code';
import { Input } from '../ui/input';
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


export function BillPreviewDialog({
  open,
  onOpenChange,
  billData,
}: BillPreviewDialogProps) {
  const { settings, clinicId } = useClinicContext();
  const billRef = useRef<HTMLDivElement>(null);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  if (!billData || !settings) return null;

  const { prescription, billDetails, dueDate } = billData;
  const { items, taxInfo, appointmentFee, roundOff, total } = billDetails;
  
  const publicUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/bill/${clinicId}_${prescription.id}` 
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl).then(() => {
        setIsCopied(true);
        toast({ title: 'Copied!', description: 'Bill link copied to clipboard.'});
        setTimeout(() => setIsCopied(false), 2000);
    });
  }

  const handleDownload = async () => {
    const input = billRef.current;
    if (!input) return;

    try {
      const canvas = await html2canvas(input, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'px', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
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

  const subtotal = items.reduce((sum, item) => sum + item.price, 0);

  const footerBlockStyle: React.CSSProperties = items.length > 7
    ? { pageBreakBefore: 'always' }
    : { pageBreakInside: 'avoid' };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline">Bill Preview & Share</DialogTitle>
          <DialogDescription>
            Review the final bill. You can download it, copy a public link, or scan the QR code.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4 flex-1 overflow-hidden">
            <ScrollArea className="md:col-span-2 h-full">
              <div ref={billRef} className="p-6 border rounded-lg bg-white text-black font-sans">
                  <header className="flex justify-between items-start pb-4 border-b" style={{ pageBreakInside: 'avoid' }}>
                      <div className="flex items-start gap-4">
                          <ClinicLogo svg={settings.logoSvg} />
                          <div>
                              <h1 className="text-2xl font-bold text-gray-800">{settings.clinicName}</h1>
                              <p className="text-xs text-gray-500">{settings.clinicAddress}</p>
                          </div>
                      </div>
                      <h2 className="text-xl font-semibold text-gray-600 shrink-0">INVOICE</h2>
                  </header>

                  <section className="grid grid-cols-2 gap-4 my-4" style={{ pageBreakInside: 'avoid' }}>
                      <div>
                          <h3 className="text-sm font-semibold text-gray-500 uppercase">BILL TO</h3>
                          <p className="font-bold">{prescription.patientName}</p>
                          <p className="text-sm text-gray-500">Prescribed by: {prescription.doctor}</p>
                      </div>
                      <div className="text-right">
                          <p><span className="font-semibold">Invoice #:</span> {`INV-${prescription.id}`}</p>
                          <p><span className="font-semibold">Date:</span> {visitDateStr}</p>
                          {dueDateStr && <p><span className="font-semibold">Due Date:</span> {dueDateStr}</p>}
                      </div>
                  </section>

                  <table className="w-full text-sm" style={{ pageBreakInside: 'avoid' }}>
                      <thead className="bg-gray-100">
                          <tr>
                              <th className="p-2 text-left font-semibold">Item</th>
                              <th className="p-2 text-right font-semibold">Price</th>
                          </tr>
                      </thead>
                      <tbody>
                          {items.map((item, index) => (
                              <tr key={index} className="border-b">
                                  <td className="p-2">{item.item}</td>
                                  <td className="p-2 text-right">{settings.currency}{item.price.toFixed(2)}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
                  
                  <div style={footerBlockStyle}>
                    <div className="flex justify-end mt-4">
                        <div className="w-full sm:w-2/3 md:w-1/2 space-y-1">
                            <div className="flex justify-between p-2">
                                <span className="font-semibold">Subtotal:</span>
                                <span>{settings.currency}{subtotal.toFixed(2)}</span>
                            </div>
                            {taxInfo.amount > 0 && (
                                <div className="flex justify-between p-2">
                                    <span className="font-semibold">{taxInfo.type} ({taxInfo.percentage}%):</span>
                                    <span>{settings.currency}{taxInfo.amount.toFixed(2)}</span>
                                </div>
                            )}
                            {appointmentFee > 0 && (
                                <div className="flex justify-between p-2">
                                    <span className="font-semibold">Appointment Fee:</span>
                                    <span>{settings.currency}{appointmentFee.toFixed(2)}</span>
                                </div>
                            )}
                            {roundOff !== 0 && (
                                <div className="flex justify-between p-2">
                                    <span className="font-semibold">Round Off:</span>
                                    <span>{settings.currency}{roundOff.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between p-2 bg-gray-200 font-bold text-base">
                                <span>Total:</span>
                                <span>{settings.currency}{total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {prescription.advice && (
                        <section className="mt-6">
                            <h3 className="font-bold text-gray-700">Doctor's Advice:</h3>
                            <blockquote className="text-sm text-gray-600 italic mt-1 p-2 border-l-2">
                              {prescription.advice}
                            </blockquote>
                        </section>
                    )}

                    <footer className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
                        <p>Thank you for choosing {settings.clinicName}.</p>
                        {validityDays > 0 && <p>This receipt is valid for {validityDays} days from the date of issue.</p>}
                    </footer>
                  </div>
              </div>
            </ScrollArea>
            <div className="flex flex-col items-center justify-center gap-6 p-4 border rounded-lg">
                <div className="bg-white p-4 rounded-lg shadow-md">
                     <QRCode
                        value={publicUrl}
                        size={180}
                        bgColor="#ffffff"
                        fgColor="#000000"
                        level="L"
                     />
                </div>
                <p className="text-sm text-center text-muted-foreground">Scan this code to view and download a copy of your bill.</p>
                 <div className="w-full space-y-2">
                    <label className="text-sm font-medium">Public Link</label>
                    <div className="flex items-center gap-2">
                        <Input readOnly value={publicUrl} className="text-xs h-9"/>
                        <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleCopy}>
                            {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
                <Button onClick={handleDownload} className="w-full">
                    <Download className="mr-2" /> Download as PDF
                </Button>
            </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
