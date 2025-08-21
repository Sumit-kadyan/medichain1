// drug-suggestions.ts
'use server';
/**
 * @fileOverview An AI agent that suggests drug prescriptions based on patient history and chief complaints.
 *
 * - suggestDrugs - A function that handles the drug suggestion process.
 * - SuggestDrugsInput - The input type for the suggestDrugs function.
 * - SuggestDrugsOutput - The return type for the suggestDrugs function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestDrugsInputSchema = z.object({
  patientHistory: z
    .string()
    .describe('The medical history of the patient.'),
  chiefComplaint: z.string().describe('The primary complaint of the patient.'),
});
export type SuggestDrugsInput = z.infer<typeof SuggestDrugsInputSchema>;

const SuggestDrugsOutputSchema = z.object({
  suggestedDrugs: z
    .array(z.string())
    .describe('A list of suggested drug prescriptions.'),
  reasoning: z
    .string()
    .describe('The reasoning behind the suggested drug prescriptions.'),
});
export type SuggestDrugsOutput = z.infer<typeof SuggestDrugsOutputSchema>;

export async function suggestDrugs(input: SuggestDrugsInput): Promise<SuggestDrugsOutput> {
  return suggestDrugsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestDrugsPrompt',
  input: {schema: SuggestDrugsInputSchema},
  output: {schema: SuggestDrugsOutputSchema},
  prompt: `You are an AI assistant that suggests drug prescriptions based on patient history and chief complaints.

  Consider the following patient history and chief complaint:

  Patient History: {{{patientHistory}}}
  Chief Complaint: {{{chiefComplaint}}}

  Suggest a list of drug prescriptions that would be appropriate for this patient, and explain your reasoning.
  Format the output as a JSON object with "suggestedDrugs" and "reasoning" fields.
  `,
});

const suggestDrugsFlow = ai.defineFlow(
  {
    name: 'suggestDrugsFlow',
    inputSchema: SuggestDrugsInputSchema,
    outputSchema: SuggestDrugsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
