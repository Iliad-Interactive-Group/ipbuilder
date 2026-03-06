'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing AI-powered maintenance suggestions for broadcast equipment.
 *
 * - aiPoweredSuggestions - A function that takes site equipment data and a user prompt to generate maintenance suggestions.
 * - AiPoweredSuggestionsInput - The input type for the aiPoweredSuggestions function.
 * - AiPoweredSuggestionsOutput - The return type for the aiPoweredSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiPoweredSuggestionsInputSchema = z.object({
  siteData: z.string().describe('The current maintenance data of the broadcast site.'),
  userPrompt: z.string().describe('The user prompt for specific maintenance suggestions.'),
});
export type AiPoweredSuggestionsInput = z.infer<typeof AiPoweredSuggestionsInputSchema>;

const AiPoweredSuggestionsOutputSchema = z.object({
  suggestions: z.string().describe('AI-powered suggestions for proactive maintenance.'),
});
export type AiPoweredSuggestionsOutput = z.infer<typeof AiPoweredSuggestionsOutputSchema>;

export async function aiPoweredSuggestions(input: AiPoweredSuggestionsInput): Promise<AiPoweredSuggestionsOutput> {
  return aiPoweredSuggestionsFlow(input);
}

const aiPoweredSuggestionsPrompt = ai.definePrompt({
  name: 'aiPoweredSuggestionsPrompt',
  input: {schema: AiPoweredSuggestionsInputSchema},
  output: {schema: AiPoweredSuggestionsOutputSchema},
  prompt: `You are an expert broadcast engineer. Use the provided site data and the user prompt to generate proactive maintenance suggestions.

Site Data:
{{siteData}}

User Prompt:
{{userPrompt}}`,
});

const aiPoweredSuggestionsFlow = ai.defineFlow(
  {
    name: 'aiPoweredSuggestionsFlow',
    inputSchema: AiPoweredSuggestionsInputSchema,
    outputSchema: AiPoweredSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await aiPoweredSuggestionsPrompt(input);
    return output!;
  }
);
