'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { suggestDrugs, type SuggestDrugsOutput } from '@/ai/flows/drug-suggestions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Pill } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Badge } from '../ui/badge';

const formSchema = z.object({
  patientHistory: z.string().min(20, {
    message: 'Patient history must be at least 20 characters.',
  }),
  chiefComplaint: z.string().min(10, {
    message: 'Chief complaint must be at least 10 characters.',
  }),
});

export function DrugSuggestionForm() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SuggestDrugsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientHistory: '',
      chiefComplaint: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await suggestDrugs(values);
      setResult(response);
    } catch (e) {
      console.error(e);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="text-primary h-6 w-6" />
          <CardTitle className="font-headline">AI Drug Suggestion</CardTitle>
        </div>
        <CardDescription>
          Get AI-powered drug recommendations based on patient data.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="patientHistory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient History</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., 45-year-old male with a history of hypertension, diagnosed 5 years ago, currently on Lisinopril 10mg daily..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="chiefComplaint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chief Complaint</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Patient presents with a persistent dry cough and shortness of breath for the last 3 days..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Get Suggestions
                </>
              )}
            </Button>
            
            {error && <p className="text-sm text-destructive">{error}</p>}
            
            {loading && (
              <div className="w-full space-y-4">
                <Skeleton className="h-8 w-1/3" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
                 <Skeleton className="h-8 w-1/4" />
                 <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-8 w-24 rounded-full" />
                    <Skeleton className="h-8 w-32 rounded-full" />
                 </div>
              </div>
            )}

            {result && (
              <div className="w-full space-y-4 rounded-lg border bg-secondary/50 p-4">
                <div>
                  <h3 className="font-headline text-lg font-semibold">Suggested Drugs</h3>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {result.suggestedDrugs.map((drug, index) => (
                       <Badge key={index} variant="secondary" className="text-base py-1 px-3">
                         <Pill className="mr-2 h-4 w-4" />
                         {drug}
                       </Badge>
                    ))}
                  </div>
                </div>
                <Separator/>
                <div>
                  <h3 className="font-headline text-lg font-semibold">Reasoning</h3>
                  <blockquote className="mt-2 border-l-2 pl-4 italic text-muted-foreground">
                    {result.reasoning}
                  </blockquote>
                </div>
              </div>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
