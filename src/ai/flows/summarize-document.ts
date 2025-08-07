
// Summarize the uploaded document and prepopulate the form fields with key information.
'use server';

/**
 * @fileOverview Summarizes a document and extracts key information to prepopulate form fields.
 *
 * - summarizeDocument - A function that summarizes a document and extracts key information.
 * - SummarizeDocumentInput - The input type for the summarizeDocument function.
 * - SummarizeDocumentOutput - The return type for the summarizeDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeDocumentInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "A document (PDF or Word) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
});
export type SummarizeDocumentInput = z.infer<typeof SummarizeDocumentInputSchema>;

const SummarizeDocumentOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the document.'),
  companyName: z.string().optional().describe('The name of the company described in the document.'),
  productDescription: z.string().optional().describe('A detailed and comprehensive description of the product or service, capturing key features, benefits, and target audience. Aim for 2-4 sentences.'),
  keywords: z.array(z.string()).optional().describe('A list of keywords relevant to the document.'),
});
export type SummarizeDocumentOutput = z.infer<typeof SummarizeDocumentOutputSchema>;

export async function summarizeDocument(input: SummarizeDocumentInput): Promise<SummarizeDocumentOutput> {
  return summarizeDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeDocumentPrompt',
  input: {schema: SummarizeDocumentInputSchema},
  output: {schema: SummarizeDocumentOutputSchema},
  prompt: `You are an expert summarizer and data extractor.

  You will be provided a document. Your job is to perform the following tasks:
  1. Create a concise summary of the document.
  2. Extract the company name.
  3. Provide a detailed and comprehensive description of the product or service offered. This should capture the key features, benefits, and intended audience. Aim for a 2-4 sentence description that is rich enough to be used as a basis for generating marketing copy.
  4. List relevant keywords.

  Ensure all fields in the output schema are populated. If information for a field is not found, use an empty string or empty array as appropriate. The output should be formatted as a JSON object.

  Document: {{media url=documentDataUri}}`,
});

const summarizeDocumentFlow = ai.defineFlow(
  {
    name: 'summarizeDocumentFlow',
    inputSchema: SummarizeDocumentInputSchema,
    outputSchema: SummarizeDocumentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('The AI model did not return the expected output format for document summarization.');
    }
    return output;
  }
);

