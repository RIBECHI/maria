'use server';

/**
 * @fileOverview Legal Reminder AI agent.
 *
 * - legalReminder - A function that sends a notification when there is a
 *   new legal precedent, rule, or regulation that appears and is relevant to
 *   the lawyer's active cases.
 * - LegalReminderInput - The input type for the legalReminder function.
 * - LegalReminderOutput - The return type for the legalReminder function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LegalReminderInputSchema = z.object({
  caseDescription: z
    .string()
    .describe('The description of the legal case.'),
  legalUpdates: z
    .string()
    .describe(
      'The new legal precedents, rules, and regulations that have emerged.'
    ),
});
export type LegalReminderInput = z.infer<typeof LegalReminderInputSchema>;

const LegalReminderOutputSchema = z.object({
  isRelevant: z
    .boolean()
    .describe(
      'Whether the legal updates are relevant to the case. Return true if there is a relevance, false otherwise.'
    ),
  reasoning: z
    .string()
    .describe(
      'The reasoning for determining whether the legal updates are relevant to the case.'
    ),
});
export type LegalReminderOutput = z.infer<typeof LegalReminderOutputSchema>;

export async function legalReminder(input: LegalReminderInput): Promise<LegalReminderOutput> {
  return legalReminderFlow(input);
}

const prompt = ai.definePrompt({
  name: 'legalReminderPrompt',
  input: {schema: LegalReminderInputSchema},
  output: {schema: LegalReminderOutputSchema},
  prompt: `You are an AI legal assistant that specializes in keeping lawyers aware of changes which may impact their cases.

You will be provided a description of a legal case, as well as recent changes to legal precedents, rules, and regulations.

You will determine if the new legal updates are relevant to the case.

Case Description: {{{caseDescription}}}

Legal Updates: {{{legalUpdates}}}

Is the update relevant to the case? Why or why not? Set isRelevant to true or false according to your determination.
`,config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const legalReminderFlow = ai.defineFlow(
  {
    name: 'legalReminderFlow',
    inputSchema: LegalReminderInputSchema,
    outputSchema: LegalReminderOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
