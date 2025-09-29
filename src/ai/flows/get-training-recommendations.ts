'use server';
/**
 * @fileOverview AI-powered training recommendation agent.
 *
 * - getTrainingRecommendations - A function that generates personalized training recommendations.
 * - GetTrainingRecommendationsInput - The input type for the getTrainingRecommendations function.
 * - GetTrainingRecommendationsOutput - The return type for the getTrainingRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetTrainingRecommendationsInputSchema = z.object({
  progressData: z
    .string()
    .describe("A JSON string containing the user's training progress data, including exercise history, weight lifted, repetitions, and dates."),
  consistencyData: z
    .string()
    .describe("A JSON string representing the user's training consistency, including workout frequency, missed sessions, and any extra activities."),
  trainingPatterns: z
    .string()
    .describe('A JSON string describing the user’s training patterns, such as muscle groups trained, exercise types, and workout duration.'),
});
export type GetTrainingRecommendationsInput = z.infer<typeof GetTrainingRecommendationsInputSchema>;

const GetTrainingRecommendationsOutputSchema = z.object({
  recommendations: z
    .array(z.string())
    .describe('An array of personalized training recommendations based on the user’s progress, consistency, and training patterns.'),
});
export type GetTrainingRecommendationsOutput = z.infer<typeof GetTrainingRecommendationsOutputSchema>;

export async function getTrainingRecommendations(input: GetTrainingRecommendationsInput): Promise<GetTrainingRecommendationsOutput> {
  return getTrainingRecommendationsFlow(input);
}

const getTrainingRecommendationsPrompt = ai.definePrompt({
  name: 'getTrainingRecommendationsPrompt',
  input: {schema: GetTrainingRecommendationsInputSchema},
  output: {schema: GetTrainingRecommendationsOutputSchema},
  prompt: `You are a personal fitness coach who analyzes a user's workout data to provide personalized training recommendations.

Analyze the following data to generate relevant and actionable recommendations for the user.

Progress Data: {{{progressData}}}
Consistency Data: {{{consistencyData}}}
Training Patterns: {{{trainingPatterns}}}

Consider the following aspects when formulating your recommendations:

*   Progress on exercises (weight lifted, reps, sets).
*   Consistency of workouts (frequency, missed sessions).
*   Training patterns (muscle groups, exercise types).
*   Identify areas where the user is excelling and areas that need improvement.
*   Suggest specific exercises or adjustments to the training plan.

Return an array of recommendations.
`,
});

const getTrainingRecommendationsFlow = ai.defineFlow(
  {
    name: 'getTrainingRecommendationsFlow',
    inputSchema: GetTrainingRecommendationsInputSchema,
    outputSchema: GetTrainingRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await getTrainingRecommendationsPrompt(input);
    return output!;
  }
);
