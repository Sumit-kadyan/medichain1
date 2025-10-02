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
import { Prescription, BillDetails } from "@/context/clinic-context";
import { useClinicContext } from "@/context/clinic-context";
import { Download, Loader2, BriefcaseMedical } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useToast } from "@/hooks/use-toast";
import ClinicLogo from "../ClinicLogo";

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
  const { settings } = useClinicContext();
  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  if (!billData || !settings) return null;
  const { prescription, billDetails, dueDate } = billData;

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
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="font-headline">Bill Preview & Share</DialogTitle>
          <DialogDescription>The layout you see is what will be downloaded.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden px-6 pb-6">
          {/* Left side: Two-page Preview */}
          <div className="md:col-span-2 overflow-y-auto bg-muted/40 p-4 rounded-lg border flex flex-row gap-6 justify-center items-start bill-preview-container">
            
            {/* Page 1 */}
            <div ref={page1Ref} className="a4-page bg-white p-8 w-[210mm] min-h-[297mm] shadow-md relative">
              <header className="flex justify-between items-start pb-6 border-b border-gray-200">
                <div className="flex items-start gap-6">
                  <ClinicLogo svg={settings.logoSvg} />
                  <div>
                    <h1 className="text-4xl font-bold">{settings.clinicName}</h1>
                    <p className="text-md text-gray-500">{settings.clinicAddress}</p>
                  </div>
                </div>
                <h2 className="text-3xl font-semibold text-gray-500 uppercase">Invoice</h2>
              </header>

              <section className="grid grid-cols-2 gap-4 my-8">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase">Bill To</h3>
                  <p className="text-lg font-bold">{prescription.patientName}</p>
                  <p className="text-md text-gray-600">Prescribed by: {prescription.doctor}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">Invoice #: INV-{prescription.id}</p>
                  <p className="text-sm">Date: {visitDateStr}</p>
                  {dueDateStr && <p className="text-sm">Due Date: {dueDateStr}</p>}
                </div>
              </section>

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
            </div>

            {/* Page 2 */}
            <div ref={page2Ref} className="a4-page bg-white p-8 w-[210mm] min-h-[297mm] shadow-md relative flex flex-col">
              <BillSummary billDetails={billDetails} settings={settings} />

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
          <div className="col-span-1 space-y-6 flex flex-col">
            <div className="space-y-4 rounded-lg border bg-background p-4 flex-1 flex flex-col items-center justify-center">
               <BriefcaseMedical className="w-16 h-16 text-primary/70" />
                <h3 className="text-lg font-bold font-headline text-primary">MediChain</h3>
                <p className="text-sm text-center text-muted-foreground">This bill was generated using the MediChain platform.</p>
            </div>
            <Button onClick={handleDownload} className="w-full" disabled={isDownloading}>
              {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              {isDownloading ? "Generating PDF..." : "Download as PDF"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
