
'use server';

/**
 * @fileOverview Creates a structured marketing brief blueprint from various data sources.
 * This file contains the server-side logic for the flow.
 *
 * - createMarketingBriefBlueprint - A function that creates the blueprint.
 */

import {ai} from '@/ai/genkit';
import { MarketingBriefBlueprint, MarketingBriefBlueprintSchema, CreateMarketingBriefBlueprintInput, CreateMarketingBriefBlueprintInputSchema } from '@/ai/schemas/marketing-brief-schemas';


export async function createMarketingBriefBlueprint(input: CreateMarketingBriefBlueprintInput): Promise<MarketingBriefBlueprint> {
  // Manual validation to ensure exactly one input source is provided.
  const providedInputs = [input.documentDataUri, input.websiteUrl, input.rawText].filter(Boolean);
  if (providedInputs.length !== 1) {
    throw new Error('Exactly one input source (document, URL, or text) must be provided.');
  }
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
IMPORTANT: If you are unable to access or process the content at the provided URL for any reason, you MUST NOT invent or infer information. Instead, you must throw an error with the message "The specified website could not be analyzed. Please check the URL for accuracy or try another source."
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
