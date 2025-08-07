
'use server';

/**
 * @fileOverview Summarizes raw text and extracts key information to generate a marketing brief.
 *
 * - summarizeText - A function that takes a string of text and extracts key information.
 * - SummarizeTextInput - The input type for the summarizeText function.
 * - SummarizeTextOutput - The return type for the summarizeText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeTextInputSchema = z.object({
  text: z
    .string()
    .describe('A block of text, such as a marketing strategy, to be summarized.'),
});
export type SummarizeTextInput = z.infer<typeof SummarizeTextInputSchema>;

const SummarizeTextOutputSchema = z.object({
  companyName: z.string().optional().describe('The name of the company described in the text.'),
  productDescription: z.string().optional().describe('A detailed and comprehensive description of the product or service from the text, capturing key features, benefits, and target audience. Aim for 2-4 sentences.'),
  keywords: z.array(z.string()).optional().describe('A list of keywords relevant to the text.'),
});
export type SummarizeTextOutput = z.infer<typeof SummarizeTextOutputSchema>;

export async function summarizeText(input: SummarizeTextInput): Promise<SummarizeTextOutput> {
  return summarizeTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeTextPrompt',
  input: {schema: SummarizeTextInputSchema},
  output: {schema: SummarizeTextOutputSchema},
  prompt: `You are an expert at analyzing marketing strategy documents.

  You will be provided with a marketing strategy as a block of text. Your job is to extract the following key pieces of information:
  1. The company name.
  2. A detailed and comprehensive description of the product or service being marketed. This should capture the key features, benefits, and intended audience from the text. Aim for a 2-4 sentence description that is rich enough to be used as a basis for generating marketing copy.
  3. A list of 5-10 relevant keywords or key phrases.

  Ensure all fields in the output schema are populated. If information for a field is not found, use an empty string or empty array as appropriate. The output must be formatted as a JSON object.

  Marketing Strategy Text:
  ---
  {{text}}
  ---
  `,
});

const summarizeTextFlow = ai.defineFlow(
  {
    name: 'summarizeTextFlow',
    inputSchema: SummarizeTextInputSchema,
    outputSchema: SummarizeTextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('The AI model did not return the expected output for text summarization.');
    }
    return output;
  }
);

