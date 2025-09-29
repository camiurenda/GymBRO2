// This is an AI-powered function, so it must be in a `src/ai` directory.
'use server';

/**
 * @fileOverview Processes an imported XLSX training plan to extract key information.
 *
 * - processImportedPlan - Processes an XLSX training plan to extract key information.
 * - ProcessImportedPlanInput - The input type for the processImportedPlan function.
 * - ProcessImportedPlanOutput - The return type for the processImportedPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ProcessImportedPlanInputSchema = z.object({
  xlsxDataUri: z
    .string()
    .describe(
      "The XLSX training plan file as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
});
export type ProcessImportedPlanInput = z.infer<typeof ProcessImportedPlanInputSchema>;

const ProcessImportedPlanOutputSchema = z.object({
  trainingDays: z.array(z.object({
    day: z.string().describe('The day of the training plan (e.g., Day 1)'),
    exercises: z.array(z.string()).describe('The list of exercises for the day, cleaned of sets/reps info'),
  })).describe('An array of training days, each containing the day and its exercises')
});
export type ProcessImportedPlanOutput = z.infer<typeof ProcessImportedPlanOutputSchema>;

export async function processImportedPlan(
  input: ProcessImportedPlanInput
): Promise<ProcessImportedPlanOutput> {
  return processImportedPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'processImportedPlanPrompt',
  input: {schema: ProcessImportedPlanInputSchema},
  output: {schema: ProcessImportedPlanOutputSchema},
  prompt: `You are a personal trainer who will analyze a workout plan in XLSX format to extract training days and exercises.

Your goal is to:
1.  Identify each training day in the plan (e.g., Day 1, Day 2, etc.).
2.  For each day, extract the list of exercises.
3.  Clean the exercise names by removing sets/reps information (e.g., "Squats 3x10" becomes "Squats").
4.  Return the data in JSON format with a list of trainingDays, each with the day and an array of exercises.

Here is the workout plan in XLSX format:
{{media url=xlsxDataUri}}
  `,
});

const processImportedPlanFlow = ai.defineFlow(
  {
    name: 'processImportedPlanFlow',
    inputSchema: ProcessImportedPlanInputSchema,
    outputSchema: ProcessImportedPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
