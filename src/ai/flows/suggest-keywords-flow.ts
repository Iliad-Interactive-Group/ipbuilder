
'use server';
/**
 * @fileOverview AI agent that suggests keywords based on company name and product description.
 *
 * - suggestKeywords - A function that suggests relevant keywords.
 * - SuggestKeywordsInput - The input type for the suggestKeywords function.
 * - SuggestKeywordsOutput - The return type for the suggestKeywords function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestKeywordsInputSchema = z.object({
  companyName: z
    .string()
    .describe('The name of the company.'),
  productDescription: z
    .string()
    .describe('A description of the product or service.'),
});
export type SuggestKeywordsInput = z.infer<typeof SuggestKeywordsInputSchema>;

const SuggestKeywordsOutputSchema = z.object({
  suggestedKeywords: z
    .array(z.string())
    .describe('A list of 5-10 suggested keywords or short key phrases.'),
});
export type SuggestKeywordsOutput = z.infer<typeof SuggestKeywordsOutputSchema>;

export async function suggestKeywords(
  input: SuggestKeywordsInput
): Promise<SuggestKeywordsOutput> {
  return suggestKeywordsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestKeywordsPrompt',
  input: {schema: SuggestKeywordsInputSchema},
  output: {schema: SuggestKeywordsOutputSchema},
  prompt: `You are an expert marketing strategist and SEO specialist.
Based on the following company name and product description, suggest 5-10 diverse and highly relevant keywords or short key phrases that would be effective for online marketing, content creation, and SEO.
Ensure the keywords are concise and actionable. Return these as a simple list of strings.

Company Name: {{companyName}}
Product Description: {{productDescription}}
`,
});

const suggestKeywordsFlow = ai.defineFlow(
  {
    name: 'suggestKeywordsFlow',
    inputSchema: SuggestKeywordsInputSchema,
    outputSchema: SuggestKeywordsOutputSchema,
  },
  async (input: SuggestKeywordsInput) => {
    const {output} = await prompt(input);
    if (!output || !output.suggestedKeywords) {
        // Fallback if the model doesn't return the expected structure, though the schema should guide it.
        return { suggestedKeywords: [] };
    }
    return output;
  }
);
