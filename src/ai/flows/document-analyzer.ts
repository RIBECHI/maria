
'use server';
/**
 * @fileOverview An AI agent for analyzing legal documents.
 *
 * - analyzeDocument - A function that handles document analysis.
 * - DocumentAnalyzerInput - The input type for the analyzeDocument function.
 * - DocumentAnalyzerOutput - The return type for the analyzeDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const DocumentAnalyzerInputSchema = z.object({
  documentText: z.string().describe('The full text of the document to be analyzed.'),
  analysisType: z.enum(['summary', 'entities', 'nextSteps']).describe('The type of analysis to perform.'),
});
export type DocumentAnalyzerInput = z.infer<typeof DocumentAnalyzerInputSchema>;

export const DocumentAnalyzerOutputSchema = z.object({
  analysisResult: z.string().describe('The result of the AI analysis.'),
});
export type DocumentAnalyzerOutput = z.infer<typeof DocumentAnalyzerOutputSchema>;

export async function analyzeDocument(input: DocumentAnalyzerInput): Promise<DocumentAnalyzerOutput> {
  return documentAnalyzerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'documentAnalyzerPrompt',
  input: {schema: DocumentAnalyzerInputSchema},
  output: {schema: DocumentAnalyzerOutputSchema},
  prompt: `You are an expert legal AI assistant. Your task is to analyze the provided document text based on the requested analysis type.

Document Text:
'''
{{{documentText}}}
'''

Analysis Type: {{{analysisType}}}

{{#if (eq analysisType "summary")}}
Your instructions: Provide a concise summary of the document, highlighting the main points, parties involved, and the core legal issue or purpose of the document.
The output should be the summary ONLY.
{{/if}}

{{#if (eq analysisType "entities")}}
Your instructions: Extract key entities from the document. List all people, organizations, locations, and important dates mentioned. Format the output clearly with headings for each category (e.g., Pessoas, Organizações, Datas).
The output should be the list of entities ONLY.
{{/if}}

{{#if (eq analysisType "nextSteps")}}
Your instructions: Based on the content of the document, suggest 3 to 5 potential next steps or action items for the lawyer handling the case. The steps should be practical and legally relevant.
The output should be the suggested next steps ONLY.
{{/if}}
`,
config: {
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

const documentAnalyzerFlow = ai.defineFlow(
  {
    name: 'documentAnalyzerFlow',
    inputSchema: DocumentAnalyzerInputSchema,
    outputSchema: DocumentAnalyzerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
