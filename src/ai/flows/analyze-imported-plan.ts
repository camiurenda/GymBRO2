// This is an AI-powered function, so it must be in a `src/ai` directory.
'use server';

/**
 * @fileOverview Analyzes an imported XLSX training plan to extract key information.
 *
 * - analyzeImportedPlan - Analyzes an XLSX training plan to extract key information.
 * - AnalyzeImportedPlanInput - The input type for the analyzeImportedPlan function.
 * - AnalyzeImportedPlanOutput - The return type for the analyzeImportedPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const AnalyzeImportedPlanInputSchema = z.object({
  xlsxDataUri: z
    .string()
    .describe(
      "The XLSX training plan file as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
});
export type AnalyzeImportedPlanInput = z.infer<typeof AnalyzeImportedPlanInputSchema>;

const AnalyzeImportedPlanOutputSchema = z.object({
  numberOfTrainingDays: z
    .number()
    .describe('The number of training days in the plan.'),
  exercisesByDay: z.record(
    z.string().describe('Day number'),
    z.array(z.string()).describe('List of exercises for the day')
  ),
});
export type AnalyzeImportedPlanOutput = z.infer<typeof AnalyzeImportedPlanOutputSchema>;

export async function analyzeImportedPlan(
  input: AnalyzeImportedPlanInput
): Promise<AnalyzeImportedPlanOutput> {
  return analyzeImportedPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeImportedPlanPrompt',
  input: {schema: AnalyzeImportedPlanInputSchema},
  output: {schema: AnalyzeImportedPlanOutputSchema},
  prompt: `You are a personal trainer who will analyze a workout plan in XLSX format.

    Your goal is to extract the following information:
    - How many training days are in the plan?
    - What exercises correspond to each day?
    - Extract the name of each exercise, cleaning the text of sets/reps (e.g., "Squats 3x10" becomes "Squats").

    Here is the workout plan in XLSX format:
    {{media url=xlsxDataUri}}
  `,
});

const analyzeImportedPlanFlow = ai.defineFlow(
  {
    name: 'analyzeImportedPlanFlow',
    inputSchema: AnalyzeImportedPlanInputSchema,
    outputSchema: AnalyzeImportedPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
