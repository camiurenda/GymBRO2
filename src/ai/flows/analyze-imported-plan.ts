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
  xlsxContent: z
    .string()
    .describe(
      "The XLSX training plan file content converted to text format, with each sheet and row clearly labeled"
    ),
});
export type AnalyzeImportedPlanInput = z.infer<typeof AnalyzeImportedPlanInputSchema>;

const AnalyzeImportedPlanOutputSchema = z.object({
  numberOfTrainingDays: z
    .number()
    .describe('The number of training days in the plan.'),
  exercisesByDay: z.array(z.object({
    day: z.string().describe('Day number'),
    exercises: z.array(z.string()).describe('List of exercises for the day')
  })).describe('List of training days with their exercises'),
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
  prompt: `You are a personal trainer who will analyze a workout plan.

    Your goal is to extract the following information:
    - How many training days are in the plan?
    - What exercises correspond to each day?
    - Extract the name of each exercise, cleaning the text of sets/reps (e.g., "Squats 3x10" becomes "Squats").

    Here is the workout plan content:
    {{xlsxContent}}
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
