
'use server';

/**
 * @fileOverview Summarizes a website and extracts key information to prepopulate form fields.
 *
 * - summarizeWebsite - A function that summarizes a website and extracts key information.
 * - SummarizeWebsiteInput - The input type for the summarizeWebsite function.
 * - SummarizeWebsiteOutput - The return type for the summarizeWebsite function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeWebsiteInputSchema = z.object({
  websiteUrl: z.string().url({ message: "Invalid URL. Please ensure it starts with http:// or https://." }).describe('The URL of the website to summarize.'),
});
export type SummarizeWebsiteInput = z.infer<typeof SummarizeWebsiteInputSchema>;

// Define the output schema locally for this flow
const SummarizeWebsiteOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the website.'),
  companyName: z.string().optional().describe('The name of the company described on the website.'),
  productDescription: z.string().optional().describe('A brief description of the product or service found on the website.'),
  keywords: z.array(z.string()).optional().describe('A list of keywords relevant to the website.'),
});
export type SummarizeWebsiteOutput = z.infer<typeof SummarizeWebsiteOutputSchema>;


export async function summarizeWebsite(input: SummarizeWebsiteInput): Promise<SummarizeWebsiteOutput> {
  return summarizeWebsiteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeWebsitePrompt',
  input: {schema: SummarizeWebsiteInputSchema},
  output: {schema: SummarizeWebsiteOutputSchema}, 
  prompt: `You are an expert summarizer and data extractor.

  You will be provided a specific website URL. Your primary task is to analyze the content found *exclusively* at this exact URL: {{websiteUrl}}. 
  Do not navigate to other subdomains or different websites unless the content on the provided URL directly and necessarily leads you there for context. Your focus should remain on the single URL given.

  From the content of {{websiteUrl}}, create a concise summary, extract the company name (if clearly stated), provide a brief description of the product or service offered (if present), and list relevant keywords.

  Ensure all fields in the output schema are populated. If information for a particular field cannot be found *on the specified URL*, or if you are unable to access or process the content of {{websiteUrl}}, use an empty string for text fields or an empty array for keyword fields. Do not infer information from external sources or similar-sounding websites. The output should be formatted as a JSON object.

  Website URL: {{websiteUrl}}`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    ],
  },
});

const summarizeWebsiteFlow = ai.defineFlow(
  {
    name: 'summarizeWebsiteFlow',
    inputSchema: SummarizeWebsiteInputSchema,
    outputSchema: SummarizeWebsiteOutputSchema, 
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('The AI model did not return the expected output for website summarization.');
    }
    return output;
  }
);

    
