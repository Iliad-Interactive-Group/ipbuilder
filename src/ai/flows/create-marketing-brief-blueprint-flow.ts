
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
  prompt: `You are a marketing analyst. Analyze the provided input and extract these elements:

1. **companyName**: The company name (or infer from domain if not explicit)
2. **productDescription**: A 2-3 sentence description capturing key features, benefits, and target audience
3. **keywords**: 5-8 relevant keywords or short phrases

Return concise, actionable information.

{{#if documentDataUri}}
Document: {{media url=documentDataUri}}
{{/if}}

{{#if websiteUrl}}
Website: {{websiteUrl}}
{{/if}}

{{#if rawText}}
Text: {{rawText}}
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
    try {
      console.log('[Blueprint Flow - OPTIMIZED] Starting with reduced prompt');
      
      // Use the optimized prompt with reduced token output
      const {output} = await prompt(input);
      
      if (!output) {
        console.error('[Blueprint Flow - OPTIMIZED] No output from prompt');
        throw new Error('The AI model did not return the expected blueprint output.');
      }
      
      console.log('[Blueprint Flow - OPTIMIZED] Success:', {
        companyName: output.companyName,
        keywordCount: output.keywords?.length,
        descriptionLength: output.productDescription?.length,
      });
      
      return output;
    } catch (error) {
      console.error('[Blueprint Flow - OPTIMIZED] Error:', error instanceof Error ? error.message : String(error));
      if (error instanceof Error && error.stack) {
        console.error('[Blueprint Flow - OPTIMIZED] Stack:', error.stack);
      }
      throw error;
    }
  }
);

    
