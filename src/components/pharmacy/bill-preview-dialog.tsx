
'use client';

import { useRef, useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Prescription, BillDetails } from '@/context/clinic-context';
import { useClinicContext } from '@/context/clinic-context';
import { Download, Copy, ExternalLink, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useToast } from '@/hooks/use-toast';
import ClinicLogo from '../ClinicLogo';
import QRCode from 'react-qr-code';

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
        <div className="flex justify-end mt-6">
            <div className="w-full sm:w-2/3 md:w-1/2 space-y-2 text-sm">
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
                <div className="flex justify-between p-3 bg-gray-100 rounded-md font-bold text-lg">
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
  const { settings, clinicId } = useClinicContext();
  const billContentRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const publicBillUrl = useMemo(() => {
    if (!billData || !clinicId) return '';
    const compositeId = `${clinicId}_${billData.prescription.id}`;
    return `${window.location.origin}/bill/${compositeId}`;
  }, [billData, clinicId]);

  if (!billData || !settings) return null;

  const { prescription, billDetails, dueDate } = billData;

  const handleDownload = async () => {
    const billContent = billContentRef.current;
    if (!billContent) return;

    setIsDownloading(true);
    try {
        const canvas = await html2canvas(billContent, {
            scale: 2, // Higher scale for better quality
            useCORS: true,
        });

        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
        });
        
        const pdfWidth = 210;
        const pdfHeight = 297;
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        
        let imgHeight = pdfWidth / ratio;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(canvas, 'PNG', 0, 0, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(canvas, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;
        }

        pdf.save(`bill-${prescription.patientName.replace(/\s/g, '_')}-${prescription.id}.pdf`);
    } catch (error) {
        console.error('oops, something went wrong!', error);
        toast({ title: 'PDF Error', description: 'Could not generate PDF. Please try again.', variant: 'destructive' });
    } finally {
        setIsDownloading(false);
    }
  };
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicBillUrl);
    toast({ title: 'Link Copied', description: 'Public bill link copied to clipboard.' });
  }

  const visitDate = new Date(`${prescription.visitDate}T00:00:00`);
  const visitDateStr = formatDate(visitDate);
  const dueDateStr = formatDate(dueDate);

  let validityDays = 0;
  if (dueDate) {
    const diffTime = Math.abs(dueDate.getTime() - visitDate.getTime());
    validityDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="font-headline">Bill Preview & Share</DialogTitle>
          <DialogDescription>
            Review the final bill and share it with the patient. The layout you see is what will be downloaded.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden px-6 pb-6">
            {/* Left side: Bill Preview */}
            <div className="md:col-span-2 overflow-y-auto bg-muted/40 p-4 rounded-lg border">
                 <div ref={billContentRef} className="bg-white p-8 w-[210mm] min-h-[297mm] mx-auto text-gray-800 font-sans shadow-md">
                    {/* Header */}
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
                    {/* Bill To & Info */}
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
                    {/* Items Table */}
                    <table className="w-full text-md">
                        <thead className="bg-gray-100 rounded-lg">
                           <tr>
                                <th className="p-3 text-left font-semibold text-gray-600">Item</th>
                                <th className="p-3 text-right font-semibold text-gray-600">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {billDetails.items.map((it, i) => (
                                <tr key={i} className="border-b border-gray-100">
                                    <td className="p-3">{it.item}</td>
                                    <td className="p-3 text-right">{settings.currency}{it.price.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {/* Summary */}
                    <BillSummary billDetails={billDetails} settings={settings} />
                    
                    {/* Doctor's Advice */}
                    {prescription.advice && (
                        <section className="mt-8">
                            <h3 className="font-bold text-gray-700">Doctor's Advice:</h3>
                            <blockquote className="text-md text-gray-600 italic mt-2 p-3 border-l-4 border-gray-200 bg-gray-50 rounded-r-lg">
                                {prescription.advice}
                            </blockquote>
                        </section>
                    )}

                    {/* Footer */}
                     <footer className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
                        <p>Thank you for choosing {settings.clinicName}.</p>
                        {validityDays > 0 && <p>This receipt is valid for {validityDays} days from the date of issue.</p>}
                    </footer>
                 </div>
            </div>

            {/* Right side: Actions */}
            <div className="col-span-1 space-y-6">
                <Button onClick={handleDownload} className="w-full" disabled={isDownloading}>
                    {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4" />}
                    {isDownloading ? 'Generating PDF...' : 'Download as PDF'}
                </Button>
                <div className="space-y-4 rounded-lg border bg-background p-4">
                    <h3 className="font-headline text-lg">Shareable Link</h3>
                    <p className="text-sm text-muted-foreground">
                        Use this public link to share the bill directly.
                    </p>
                     <div className="flex items-center space-x-2">
                        <Input id="link" value={publicBillUrl} readOnly />
                        <Button type="button" size="sm" onClick={handleCopyLink}>
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">Copy</span>
                        </Button>
                         <a href={publicBillUrl} target="_blank" rel="noopener noreferrer">
                            <Button type="button" size="sm" variant="outline">
                                <ExternalLink className="h-4 w-4" />
                                <span className="sr-only">Open in new tab</span>
                            </Button>
                        </a>
                    </div>
                     <div className="p-4 bg-white rounded-md flex items-center justify-center">
                        <QRCode value={publicBillUrl} size={128} />
                    </div>
                    <p className="text-xs text-center text-muted-foreground">Scan QR code to view bill on any device.</p>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
