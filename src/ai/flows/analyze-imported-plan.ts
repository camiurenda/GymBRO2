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
  prompt: `Eres un entrenador personal que analizará un plan de entrenamiento.

    Tu objetivo es extraer la siguiente información:
    - ¿Cuántos días de entrenamiento hay en el plan?
    - ¿Qué ejercicios corresponden a cada día?
    - Extraer el nombre de cada ejercicio, limpiando el texto de series/repeticiones (ej: "Sentadillas 3x10" se convierte en "Sentadillas").
    - IMPORTANTE: Corregir errores de ortografía y nombres mal escritos de ejercicios. Por ejemplo:
      * "abeduccion" → "Abducción"
      * "puenta ateral dinamico" → "Puente Lateral Dinámico"
      * "press banca" → "Press De Banca"
      * Verificar que los nombres de ejercicios estén correctamente escritos en español.
      * TODOS los nombres de ejercicios deben estar en Proper Case (Primera Letra De Cada Palabra En Mayúscula).

    Aquí está el contenido del plan de entrenamiento:
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
