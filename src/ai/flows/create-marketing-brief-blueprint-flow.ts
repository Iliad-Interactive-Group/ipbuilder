
'use server';

/**
 * @fileOverview Creates a structured marketing brief blueprint from various data sources.
 *
 * - createMarketingBriefBlueprint - A function that creates the blueprint.
 * - CreateMarketingBriefBlueprintInput - The input type for the function.
 * - MarketingBriefBlueprint - The output type (the blueprint itself).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const MarketingBriefBlueprintSchema = z.object({
  companyName: z.string().describe('The name of the company.'),
  productDescription: z.string().describe('A detailed and comprehensive description of the product or service, suitable for generating marketing copy. It should be at least 3-4 sentences long and capture key features and benefits.'),
  keywords: z.array(z.string()).describe('A list of 5-10 relevant keywords and key phrases.'),
});
export type MarketingBriefBlueprint = z.infer<typeof MarketingBriefBlueprintSchema>;

export const CreateMarketingBriefBlueprintInputSchema = z.object({
  documentDataUri: z.string().optional().describe(
      "A document (PDF or Word) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
  ),
  websiteUrl: z.string().url({ message: "Invalid URL. Please ensure it starts with http:// or https://." }).optional().describe('The URL of a website.'),
  rawText: z.string().optional().describe('A block of raw text, like a marketing plan or notes.'),
}).refine(data => {
    const provided = [data.documentDataUri, data.websiteUrl, data.rawText].filter(Boolean);
    return provided.length === 1;
}, {
    message: 'Exactly one input source (documentDataUri, websiteUrl, or rawText) must be provided.',
});
export type CreateMarketingBriefBlueprintInput = z.infer<typeof CreateMarketingBriefBlueprintInputSchema>;


export async function createMarketingBriefBlueprint(input: CreateMarketingBriefBlueprintInput): Promise<MarketingBriefBlueprint> {
  return createMarketingBriefBlueprintFlow(input);
}

const prompt = ai.definePrompt({
  name: 'createMarketingBriefBlueprintPrompt',
  input: {schema: CreateMarketingBriefBlueprintInputSchema},
  output: {schema: MarketingBriefBlueprintSchema},
  prompt: `You are an expert marketing analyst and data extractor. Your task is to analyze the provided input and generate a structured JSON marketing brief based on the output schema.

You will receive one of three possible inputs: a document, a website URL, or a block of raw text.

Based *only* on the content of the provided input, your job is to extract the following information and populate the JSON object:
1.  **companyName**: The name of the company. If not explicitly found, make a reasonable inference from context (e.g., the website domain).
2.  **productDescription**: A detailed and comprehensive description of the product or service being offered. This description must be thorough enough to be used as a basis for generating creative marketing materials. It should be at least 3-4 sentences long and capture the key features, benefits, and target audience. Do not just use a single sentence.
3.  **keywords**: A list of 5-10 relevant keywords or short key phrases that accurately reflect the company and its offerings.

Ensure all fields in the output schema are populated. Do not leave any fields empty.

{{#if documentDataUri}}
Input Source: Document
Document: {{media url=documentDataUri}}
{{/if}}

{{#if websiteUrl}}
Input Source: Website URL
Your analysis must be based exclusively on the content found at this exact URL.
URL: {{websiteUrl}}
{{/if}}

{{#if rawText}}
Input Source: Raw Text
Text:
---
{{rawText}}
---
{{/if}}
`,
});

const createMarketingBriefBlueprintFlow = ai.defineFlow(
  {
    name: 'createMarketingBriefBlueprintFlow',
    inputSchema: CreateMarketingBriefBlueprintInputSchema,
    outputSchema: MarketingBriefBlueprintSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('The AI model did not return the expected blueprint output.');
    }
    return output;
  }
);
