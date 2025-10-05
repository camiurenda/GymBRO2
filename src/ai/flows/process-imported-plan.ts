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
  prompt: `Eres un entrenador personal que analizará un plan de entrenamiento en formato XLSX para extraer días de entrenamiento y ejercicios.

Tu objetivo es:
1.  Identificar cada día de entrenamiento en el plan (ej: Día 1, Día 2, etc.).
2.  Para cada día, extraer la lista de ejercicios.
3.  Limpiar los nombres de los ejercicios eliminando información de series/repeticiones (ej: "Sentadillas 3x10" se convierte en "Sentadillas").
4.  IMPORTANTE: Corregir errores de ortografía y nombres mal escritos de ejercicios. Por ejemplo:
    - "abeduccion" → "Abducción"
    - "puenta ateral dinamico" → "Puente Lateral Dinámico"
    - "press banca" → "Press De Banca"
    - Verificar que los nombres de ejercicios estén correctamente escritos en español.
    - TODOS los nombres de ejercicios deben estar en Proper Case (Primera Letra De Cada Palabra En Mayúscula).
5.  Devolver los datos en formato JSON con una lista de trainingDays, cada uno con el día y un array de ejercicios.

Aquí está el plan de entrenamiento en formato XLSX:
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
