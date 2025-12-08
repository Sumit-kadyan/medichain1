
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
import { Prescription } from "@/context/clinic-context";
import { useClinicContext } from "@/context/clinic-context";
import { Download, Copy, ExternalLink, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useToast } from "@/hooks/use-toast";
import ClinicLogo from "../ClinicLogo";
import QRCode from "react-qr-code";

interface PrescriptionPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prescriptionData: Prescription | null;
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

export function PrescriptionPreviewDialog({ open, onOpenChange, prescriptionData }: PrescriptionPreviewDialogProps) {
  const { settings, clinicId } = useClinicContext();
  const pageRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  if (!prescriptionData || !settings) return null;

  const publicPrescriptionUrl = clinicId
    ? `${window.location.origin}/prescription/${clinicId}_${prescriptionData.id}`
    : "";

  const visitDate = new Date(`${prescriptionData.visitDate}T00:00:00`);
  const visitDateStr = formatDate(visitDate);
  
  const handleDownload = async () => {
    if (!pageRef.current) return;
    try {
      setIsDownloading(true);
      const canvas = await html2canvas(pageRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      
      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      const pdfWidth = 210;
      const pdfHeight = 297;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`prescription-${prescriptionData.patientName.replace(/\s/g, "_")}-${prescriptionData.id}.pdf`);
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
          <DialogTitle>Prescription Preview & Share</DialogTitle>
          <DialogDescription>The layout you see is what will be downloaded.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden px-6 pb-6">
          {/* Left side: Preview */}
          <div className="md:col-span-2 overflow-y-auto bg-muted/40 p-4 rounded-lg border">
            <div ref={pageRef} className="page bg-white p-8 w-[210mm] min-h-[297mm] mx-auto shadow-md flex flex-col">
              <header className="flex justify-between items-start pb-6 border-b-2 border-gray-300">
                <div className="flex items-center gap-6">
                  <ClinicLogo svg={settings.logoSvg} />
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{settings.clinicName}</h1>
                    <p className="text-md text-gray-500 mt-1">{settings.clinicAddress}</p>
                    <p className="text-md font-semibold text-gray-700 mt-2">Dr. {prescriptionData.doctor}</p>
                  </div>
                </div>
                <h2 className="text-2xl font-semibold text-gray-500 uppercase tracking-widest shrink-0">
                  Prescription
                </h2>
              </header>

              <section className="grid grid-cols-2 gap-4 my-8 pb-4 border-b border-gray-200">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase">Patient</h3>
                  <p className="text-lg font-bold mt-1">{prescriptionData.patientName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">
                    <span className="font-semibold text-gray-600">Prescription #:</span>{" "}
                    {`PRESC-${prescriptionData.id.substring(0, 8).toUpperCase()}`}
                  </p>
                  <p className="text-sm"><span className="font-semibold text-gray-600">Date:</span> {visitDateStr}</p>
                </div>
              </section>

              <section className="flex-1">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <span className="text-2xl mr-2">℞</span> Prescribed Medication
                </h3>
                <div className="space-y-3 pl-4">
                  {prescriptionData.items.map((item, index) => (
                    <div key={index} className="text-md"><p>{item}</p></div>
                  ))}
                </div>
              </section>

              {prescriptionData.advice && (
                <section className="mt-8">
                  <h3 className="font-bold text-gray-700">Doctor's Advice:</h3>
                  <blockquote className="text-md text-gray-600 italic mt-2 p-3 border-l-4 border-gray-200 bg-gray-50 rounded-r-lg">
                    {prescriptionData.advice}
                  </blockquote>
                </section>
              )}
              
              {prescriptionData.billDetails?.appointmentFee && prescriptionData.billDetails.appointmentFee > 0 && (
                <div className="mt-8 pt-4">
                    <h3 className="font-semibold text-gray-800">Fees</h3>
                    <div className="flex justify-between items-center mt-2 border-t border-b py-2">
                        <p>Consultation / Appointment Fee</p>
                        <p className="font-bold">{settings.currency}{prescriptionData.billDetails.appointmentFee.toFixed(2)}</p>
                    </div>
                </div>
              )}

              <footer className="mt-auto pt-8 border-t border-dashed border-gray-400 text-center text-xs text-gray-500">
                <p>This is a medical prescription and should be used responsibly.</p>
                <p>Thank you for choosing {settings.clinicName}.</p>
              </footer>
            </div>
          </div>

          {/* Right side: Actions */}
          <div className="col-span-1 space-y-6">
            <Button onClick={handleDownload} className="w-full" disabled={isDownloading}>
              {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              {isDownloading ? "Generating PDF..." : "Download as PDF"}
            </Button>

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

