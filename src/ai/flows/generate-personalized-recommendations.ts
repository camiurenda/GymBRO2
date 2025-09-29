// This is an AI-powered function, so it must be in a `src/ai` directory.
'use server';

/**
 * @fileOverview AI-powered training recommendation agent.
 *
 * - generatePersonalizedRecommendations - A function that generates personalized training recommendations.
 * - GeneratePersonalizedRecommendationsInput - The input type for the generatePersonalizedRecommendations function.
 * - GeneratePersonalizedRecommendationsOutput - The return type for the generatePersonalizedRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GeneratePersonalizedRecommendationsInputSchema = z.object({
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
export type GeneratePersonalizedRecommendationsInput = z.infer<typeof GeneratePersonalizedRecommendationsInputSchema>;

const GeneratePersonalizedRecommendationsOutputSchema = z.object({
  recommendations: z
    .array(z.string())
    .describe('An array of personalized training recommendations based on the user’s progress, consistency, and training patterns.'),
});
export type GeneratePersonalizedRecommendationsOutput = z.infer<typeof GeneratePersonalizedRecommendationsOutputSchema>;

export async function generatePersonalizedRecommendations(input: GeneratePersonalizedRecommendationsInput): Promise<GeneratePersonalizedRecommendationsOutput> {
  return generatePersonalizedRecommendationsFlow(input);
}

const generatePersonalizedRecommendationsPrompt = ai.definePrompt({
  name: 'generatePersonalizedRecommendationsPrompt',
  input: {schema: GeneratePersonalizedRecommendationsInputSchema},
  output: {schema: GeneratePersonalizedRecommendationsOutputSchema},
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
*   Suggest increased volume or exercises to address weak areas.

Return an array of recommendations.
`,
});

const generatePersonalizedRecommendationsFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedRecommendationsFlow',
    inputSchema: GeneratePersonalizedRecommendationsInputSchema,
    outputSchema: GeneratePersonalizedRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await generatePersonalizedRecommendationsPrompt(input);
    return output!;
  }
);
