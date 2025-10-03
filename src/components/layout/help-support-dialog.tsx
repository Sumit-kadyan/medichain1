
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CircleHelp, Phone } from 'lucide-react';
import { Separator } from '../ui/separator';

interface HelpSupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const troubleshootingItems = [
    {
        question: "App is showing an 'offline' banner, but my internet is working.",
        answer: "This can happen if the connection to our servers is interrupted. Try refreshing the page. If the issue persists, the service might be temporarily down. All your data is saved locally and will sync once the connection is restored."
    },
    {
        question: "I can't log in.",
        answer: "Please double-check your username and password. Usernames are unique to your clinic. If you have forgotten your password, you will need to contact the administrator to reset it."
    },
    {
        question: "A new patient/doctor is not appearing in the list.",
        answer: "It might take a few moments for new data to appear everywhere. Try refreshing the page. If you are offline, the new entry will appear once your connection is back."
    },
    {
        question: "The bill preview is not generating or looks incorrect.",
        answer: "Ensure all price fields have been filled correctly. If the PDF download fails, please check your browser's permissions for downloading files and try again."
    }
]

export function HelpSupportDialog({ open, onOpenChange }: HelpSupportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline">
            <CircleHelp className="h-6 w-6 text-primary" />
            Help & Troubleshooting
          </DialogTitle>
          <DialogDescription>
            Find solutions to common issues or get in touch with support.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 max-h-[60vh] overflow-y-auto pr-4">
             <Accordion type="single" collapsible className="w-full">
                {troubleshootingItems.map((item, index) => (
                    <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger>{item.question}</AccordionTrigger>
                        <AccordionContent>
                           {item.answer}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>

        <DialogFooter className="flex-col items-start pt-4 border-t">
            <h3 className="text-sm font-semibold">Still having issues?</h3>
            <p className="text-sm text-muted-foreground">
                Contact the application administrator, Sumit Kadyan, directly on WhatsApp for further assistance.
            </p>
            <div className="flex items-center gap-2 pt-2">
                 <Phone className="h-4 w-4" />
                 <span className="font-mono text-sm font-semibold tracking-wider">+91 7297028537</span>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
