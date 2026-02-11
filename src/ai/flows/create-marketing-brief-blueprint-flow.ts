
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
    
  // Pre-validate the URL before calling the AI model to prevent hallucinations on inaccessible sites.
  if (input.websiteUrl) {
    try {
      // Using a longer timeout and a common user-agent to improve success rate
      const response = await fetch(input.websiteUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      if (!response.ok) {
        // Throw a specific error if the website is not accessible (e.g., 404, 500)
        throw new Error(`The specified website could not be analyzed (Status: ${response.status}). Please check the URL or try another source.`);
      }
      const text = await response.text();
      if (!text || text.length < 100) {
        // If the page returns ok but has very little content, it's likely a JS-rendered page or an error page.
         throw new Error('The website content appears to be empty or too short for analysis. It may rely on client-side JavaScript.');
      }
    } catch (e: any) {
      // Catch fetch errors (e.g., DNS, network issues, timeout)
      console.error("URL fetch failed:", e);
      // Return a more specific error message based on the caught error.
      throw new Error(e.message || 'The specified website could not be analyzed. Please check the URL for accuracy or try another source.');
    }
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

If you are given a websiteUrl and you cannot access it, you MUST respond with an error. Do not invent information.

{{#if documentDataUri}}
Input Source: Document
Document: {{media url=documentDataUri}}
{{/if}}

{{#if websiteUrl}}
Input Source: Website URL
Your analysis must be based exclusively on the content found at this exact URL. If you cannot access the URL, you must not invent information.
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
  async (input: CreateMarketingBriefBlueprintInput) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('The AI model did not return the expected blueprint output.');
    }
    return output;
  }
);

    
