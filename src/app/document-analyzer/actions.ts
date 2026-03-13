
"use server";

import { analyzeDocument, type DocumentAnalyzerInput, type DocumentAnalyzerOutput } from "@/ai/flows/document-analyzer";

export async function handleDocumentAnalysis(input: DocumentAnalyzerInput): Promise<DocumentAnalyzerOutput> {
  try {
    const output = await analyzeDocument(input);
    return output;
  } catch (error) {
    console.error("Error in documentAnalyzerFlow:", error);
    if (error instanceof Error) {
      throw new Error(`AI processing failed: ${error.message}`);
    }
    throw new Error("An unknown error occurred during AI processing.");
  }
}
