

'use client';

import { useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Prescription } from '@/context/clinic-context';
import { useClinicContext } from '@/context/clinic-context';
import { Download, QrCode, Copy, Check } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'react-qr-code';
import { Input } from '../ui/input';
import { useToast } from '@/hooks/use-toast';
import ClinicLogo from '../ClinicLogo';

interface BillPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billData: {
    prescription: Prescription;
    prices: Record<string, number>;
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

  const { prescription, prices, dueDate } = billData;
  const total = Object.values(prices).reduce((sum, price) => sum + price, 0);
  
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
    if (!billRef.current) return;

    try {
        const canvas = await html2canvas(billRef.current, { scale: 2, useCORS: true });
        const dataUrl = canvas.toDataURL('image/png');

        const pdf = new jsPDF('p', 'px', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        
        const imgProps= pdf.getImageProperties(dataUrl);
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, imgHeight);
        pdf.save(`bill-${prescription.patientName.replace(/\s/g, '_')}-${prescription.id}.pdf`);
    } catch (error) {
        console.error('oops, something went wrong!', error);
    }
  };
  
  const visitDate = new Date(`${prescription.visitDate}T00:00:00`);
  const visitDateStr = formatDate(visitDate);
  const dueDateStr = formatDate(dueDate);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Bill Preview & Share</DialogTitle>
          <DialogDescription>
            Review the final bill. You can download it, copy a public link, or scan the QR code.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
            <div ref={billRef} className="md:col-span-2 p-6 border rounded-lg bg-white text-black font-sans">
                <header className="flex justify-between items-start pb-4 border-b">
                    <div className="flex items-start gap-4">
                        <ClinicLogo svg={settings.logoSvg} />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">{settings.clinicName}</h1>
                            <p className="text-xs text-gray-500">{settings.clinicAddress}</p>
                        </div>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-600 shrink-0">INVOICE</h2>
                </header>

                <section className="grid grid-cols-2 gap-4 my-4">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500">BILL TO</h3>
                        <p className="font-bold">{prescription.patientName}</p>
                    </div>
                    <div className="text-right">
                        <p><span className="font-semibold">Invoice #:</span> {`INV-${prescription.id}`}</p>
                        <p><span className="font-semibold">Date:</span> {visitDateStr}</p>
                        {dueDateStr && <p><span className="font-semibold">Due Date:</span> {dueDateStr}</p>}
                    </div>
                </section>

                <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-2 text-left font-semibold">Item</th>
                            <th className="p-2 text-right font-semibold">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {prescription.items.map((item, index) => (
                            <tr key={index} className="border-b">
                                <td className="p-2">{item}</td>
                                <td className="p-2 text-right">{settings.currency}{prices[item]?.toFixed(2) || '0.00'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                <div className="flex justify-end mt-4">
                    <div className="w-full sm:w-1/2">
                         <div className="flex justify-between p-2">
                            <span className="font-semibold">Subtotal:</span>
                            <span>{settings.currency}{total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-gray-200 font-bold">
                            <span>Total:</span>
                            <span>{settings.currency}{total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {prescription.advice && (
                    <section className="mt-6">
                        <h3 className="font-bold text-gray-700">Doctor's Advice:</h3>
                        <p className="text-sm text-gray-600 italic mt-1 p-2 border-l-2">
                           {prescription.advice}
                        </p>
                    </section>
                )}

                <footer className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
                    <p>Thank you for choosing {settings.clinicName}. This receipt is valid till the due date.</p>
                </footer>
            </div>
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
