
import {z} from 'genkit';

/**
 * @fileOverview This file contains the Zod schemas and TypeScript types 
 * for the marketing brief blueprint. These are used to define the data 
 * structure for both input and output of the AI flows.
 */

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
});
export type CreateMarketingBriefBlueprintInput = z.infer<typeof CreateMarketingBriefBlueprintInputSchema>;
