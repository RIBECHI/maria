"use server";

import { legalReminder, type LegalReminderInput, type LegalReminderOutput } from "@/ai/flows/legal-reminder";

export async function handleLegalReminder(input: LegalReminderInput): Promise<LegalReminderOutput> {
  try {
    const output = await legalReminder(input);
    return output;
  } catch (error) {
    console.error("Error in legalReminder flow:", error);
    // It's better to throw a more specific error or handle it appropriately
    // For now, re-throwing to be caught by the client component
    if (error instanceof Error) {
      throw new Error(`AI processing failed: ${error.message}`);
    }
    throw new Error("An unknown error occurred during AI processing.");
  }
}
