
"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Prescription, BillDetails } from "@/context/clinic-context";
import { useClinicContext } from "@/context/clinic-context";
import { Download, Copy, ExternalLink, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useToast } from "@/hooks/use-toast";
import ClinicLogo from "../ClinicLogo";
import QRCode from "react-qr-code";
import { Separator } from "../ui/separator";

export interface BillPreviewData {
  prescription: Prescription;
  billDetails: BillDetails | null;
  dueDate: Date;
  generatePrescriptionOnly?: boolean;
}

interface BillPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billData: BillPreviewData | null;
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

const BillSummary = ({ billDetails, settings }: { billDetails: BillDetails; settings: any }) => {
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
            <span className="font-semibold text-gray-600">
              {billDetails.taxInfo.type} ({billDetails.taxInfo.percentage}%):
            </span>
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

export function BillPreviewDialog({ open, onOpenChange, billData }: BillPreviewDialogProps) {
  const { settings, clinicId } = useClinicContext();
  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  if (!billData || !settings) return null;
  const { prescription, billDetails, dueDate, generatePrescriptionOnly } = billData;

  const publicBillUrl = clinicId && !generatePrescriptionOnly
    ? `${window.location.origin}/bill/${clinicId}_${prescription.id}`
    : "";
    
  const publicPrescriptionUrl = clinicId
    ? `${window.location.origin}/prescription/${clinicId}_${prescription.id}`
    : "";

  const visitDate = new Date(`${prescription.visitDate}T00:00:00`);
  const visitDateStr = formatDate(visitDate);
  const dueDateStr = formatDate(dueDate);

  let validityDays = 0;
  if (dueDate) {
    const diffTime = Math.abs(dueDate.getTime() - visitDate.getTime());
    validityDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  const handleDownload = async () => {
    try {
      setIsDownloading(true);

      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      const pages = [page1Ref.current, page2Ref.current];

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        if (!page) continue;
        const canvas = await html2canvas(page, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL("image/png");
        const pdfWidth = 210;
        const pdfHeight = 297;
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save(`bill-${prescription.patientName.replace(/\s/g, "_")}-${prescription.id}.pdf`);
    } catch (err) {
      console.error(err);
      toast({ title: "PDF Error", description: "Could not generate PDF.", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{generatePrescriptionOnly ? 'Prescription' : 'Bill'} Preview & Share</DialogTitle>
          <DialogDescription>The layout you see is what will be downloaded.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden px-6 pb-6">
          {/* Left side: Preview */}
          <div className="md:col-span-2 overflow-y-auto bg-muted/40 p-4 rounded-lg border flex flex-col gap-6">
            
            {/* Page 1 */}
            <div ref={page1Ref} className="page bg-white p-8 w-[210mm] h-[297mm] mx-auto shadow-md relative">
              <header className="flex justify-between items-start pb-6 border-b border-gray-200">
                <div className="flex items-start gap-6">
                  <ClinicLogo svg={settings.logoSvg} />
                  <div>
                    <h1 className="text-4xl font-bold">{settings.clinicName}</h1>
                    <p className="text-md text-gray-500">{settings.clinicAddress}</p>
                  </div>
                </div>
                <h2 className="text-3xl font-semibold text-gray-500 uppercase">{generatePrescriptionOnly ? 'Prescription' : 'Invoice'}</h2>
              </header>

              <section className="grid grid-cols-2 gap-4 my-8">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase">Bill To</h3>
                  <p className="text-lg font-bold">{prescription.patientName}</p>
                  <p className="text-md text-gray-600">Prescribed by: {prescription.doctor}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">Ref #: {prescription.id}</p>
                  <p className="text-sm">Date: {visitDateStr}</p>
                  {dueDateStr && <p className="text-sm">Due Date: {dueDateStr}</p>}
                </div>
              </section>
              
              {billDetails ? (
                <table className="w-full text-md">
                    <thead className="bg-gray-100">
                    <tr>
                        <th className="p-3 text-left font-semibold">Item</th>
                        <th className="p-3 text-right font-semibold">Price</th>
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
              ) : (
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
              )}
            </div>

            {/* Page 2 */}
            <div ref={page2Ref} className="page bg-white p-8 w-[210mm] h-[297mm] mx-auto shadow-md relative flex flex-col">
              {billDetails && <BillSummary billDetails={billDetails} settings={settings} />}

              {prescription.advice && (
                <section className="mt-8">
                  <h3 className="font-bold">Doctor's Advice:</h3>
                  <blockquote className="text-md text-gray-600 italic mt-2 p-3 border-l-4 border-gray-200 bg-gray-50 rounded-r-lg">
                    {prescription.advice}
                  </blockquote>
                </section>
              )}

              <footer className="mt-auto pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
                <p>Thank you for choosing {settings.clinicName}.</p>
                {validityDays > 0 && (
                  <p>This receipt is valid for {validityDays} days.</p>
                )}
              </footer>
            </div>
          </div>

          {/* Right side: Actions */}
          <div className="col-span-1 space-y-6">
            <Button onClick={handleDownload} className="w-full" disabled={isDownloading}>
              {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              {isDownloading ? "Generating PDF..." : "Download as PDF"}
            </Button>

            {publicBillUrl && (
                <div className="space-y-4 rounded-lg border bg-background p-4">
                    <h3 className="text-lg font-bold">Shareable Invoice Link</h3>
                    <div className="flex items-center space-x-2">
                        <Input id="link-invoice" value={publicBillUrl} readOnly />
                        <Button type="button" size="sm" onClick={() => navigator.clipboard.writeText(publicBillUrl)}>
                            <Copy className="h-4 w-4" />
                        </Button>
                        <a href={publicBillUrl} target="_blank" rel="noopener noreferrer">
                            <Button type="button" size="sm" variant="outline"><ExternalLink className="h-4 w-4" /></Button>
                        </a>
                    </div>
                    <div className="p-4 bg-white rounded-md flex items-center justify-center">
                        <QRCode value={publicBillUrl} size={128} />
                    </div>
                </div>
            )}
            
            <Separator />
            
             {publicPrescriptionUrl && (
                <div className="space-y-4 rounded-lg border bg-background p-4">
                    <h3 className="text-lg font-bold">Shareable Prescription Link</h3>
                    <div className="flex items-center space-x-2">
                        <Input id="link-prescription" value={publicPrescriptionUrl} readOnly />
                        <Button type="button" size="sm" onClick={() => navigator.clipboard.writeText(publicPrescriptionUrl)}>
                            <Copy className="h-4 w-4" />
                        </Button>
                        <a href={publicPrescriptionUrl} target="_blank" rel="noopener noreferrer">
                            <Button type="button" size="sm" variant="outline"><ExternalLink className="h-4 w-4" /></Button>
                        </a>
                    </div>
                    <div className="p-4 bg-white rounded-md flex items-center justify-center">
                        <QRCode value={publicPrescriptionUrl} size={128} />
                    </div>
                </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
