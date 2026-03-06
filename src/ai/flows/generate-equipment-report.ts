'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating equipment reports based on user prompts.
 *
 * It includes:
 * - generateEquipmentReport - A function that generates an equipment report.
 * - GenerateEquipmentReportInput - The input type for the generateEquipmentReport function.
 * - GenerateEquipmentReportOutput - The output type for the generateEquipmentReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateEquipmentReportInputSchema = z.object({
  equipmentData: z
    .string()
    .describe('The current maintenance data for the broadcast equipment.'),
  userPrompt: z.string().describe('The prompt from the user requesting specific information in the report.'),
  siteHealth: z.string().describe('Overall site health information'),
});

export type GenerateEquipmentReportInput = z.infer<typeof GenerateEquipmentReportInputSchema>;

const GenerateEquipmentReportOutputSchema = z.object({
  report: z.string().describe('The generated equipment report.'),
});

export type GenerateEquipmentReportOutput = z.infer<typeof GenerateEquipmentReportOutputSchema>;

export async function generateEquipmentReport(input: GenerateEquipmentReportInput): Promise<GenerateEquipmentReportOutput> {
  return generateEquipmentReportFlow(input);
}

const generateEquipmentReportPrompt = ai.definePrompt({
  name: 'generateEquipmentReportPrompt',
  input: {schema: GenerateEquipmentReportInputSchema},
  output: {schema: GenerateEquipmentReportOutputSchema},
  prompt: `You are a broadcast equipment technician who compiles reports based on equipment data, site health, and user prompts.

  Based on the equipment data, site health and the prompt determine what information to incorporate into the report.

  Equipment Data: {{{equipmentData}}}
  Site Health: {{{siteHealth}}}
  User Prompt: {{{userPrompt}}}

  Generate a detailed report.`,
});

const generateEquipmentReportFlow = ai.defineFlow(
  {
    name: 'generateEquipmentReportFlow',
    inputSchema: GenerateEquipmentReportInputSchema,
    outputSchema: GenerateEquipmentReportOutputSchema,
  },
  async input => {
    const {output} = await generateEquipmentReportPrompt(input);
    return output!;
  }
);
