
'use server';

/**
 * @fileOverview AI agent that generates marketing copy variations based on keywords and content type.
 *
 * - generateMarketingCopy - A function that generates marketing copy.
 * - GenerateMarketingCopyInput - The input type for the generateMarketingCopy function.
 * - GenerateMarketingCopyOutput - The return type for the generateMarketingCopy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMarketingCopyInputSchema = z.object({
  keywords: z
    .string()
    .describe('Keywords to guide the marketing copy generation.'),
  contentType: z
    .string()
    .describe(
      'The type of content to generate (e.g., website copy, social media post, blog post, radio script, tv script, billboard, website wireframe).'
    ),
  additionalInstructions: z
    .string()
    .optional()
    .describe('Any additional instructions for copy generation.'),
  companyName: z.string().optional().describe('The company name, useful for wireframe generation.'),
  productDescription: z.string().optional().describe('The product description, useful for wireframe generation.')
});
export type GenerateMarketingCopyInput = z.infer<
  typeof GenerateMarketingCopyInputSchema
>;

const GenerateMarketingCopyOutputSchema = z.object({
  marketingCopy: z
    .string()
    .describe('The generated marketing copy tailored to the specified content type.'),
});
export type GenerateMarketingCopyOutput = z.infer<
  typeof GenerateMarketingCopyOutputSchema
>;

export async function generateMarketingCopy(
  input: GenerateMarketingCopyInput
): Promise<GenerateMarketingCopyOutput> {
  return generateMarketingCopyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMarketingCopyPrompt',
  input: {schema: GenerateMarketingCopyInputSchema}, // Schema for documentation/LLM, actual prompt() call can have more for Handlebars
  output: {schema: GenerateMarketingCopyOutputSchema},
  prompt: `You are a marketing expert specializing in creating engaging content.

  Generate marketing copy tailored for the following content type: {{contentType}}.
  Incorporate these keywords: {{keywords}}.
  Company Name (if provided): {{companyName}}
  Product Description (if provided): {{productDescription}}

  {{#if isRadioScript}}
  The radio script should be approximately 30 seconds in length.
  {{/if}}
  {{#if isTvScript}}
  The TV script should be approximately 30 seconds in length.
  {{/if}}
  {{#if isBillboard}}
  The billboard ad should be highly creative and concise, using no more than 8 words.
  {{/if}}
  {{#if isBlogPost}}
  The blog post should be approximately 200 to 360 words in length.
  {{/if}}
  {{#if isWebsiteWireframe}}
  Generate a textual wireframe for a minimum three-page website (e.g., Homepage, About Us, Services/Product Page).
  For each page, outline the key sections and elements (e.g., Navbar, Hero Section, Feature List, Call to Action, Footer).
  Use the provided Company Name, Product Description, and Keywords to suggest relevant placeholder content for headlines, navigation links, service names, etc.
  The output should be a structured textual description of the wireframe. For example:

  **Homepage**
  *   **Navbar:** Logo ({{companyName}}), Home, About Us, Services, Contact Us
  *   **Hero Section:**
      *   Headline: [Compelling headline based on {{productDescription}} and {{keywords}}]
      *   Sub-headline: [Brief explanation or benefit]
      *   CTA Button: "Learn More" or "Get Started"
      *   Background Image: Placeholder for a relevant image
  *   **Services Overview (using {{keywords}}):**
      *   Section Title: Our Core Offerings
      *   Service 1: [Name based on keyword 1] - [Short description]
      *   Service 2: [Name based on keyword 2] - [Short description]
      *   Service 3: [Name based on keyword 3] - [Short description]
  *   **About Us Snippet:**
      *   Text: Brief introduction to {{companyName}} and its mission.
      *   Link: "Read More About Us" (to About Us page)
  *   **Call to Action:**
      *   Headline: Ready to experience [key benefit from {{productDescription}}]?
      *   Button: "Contact Us Today"
  *   **Footer:** Copyright {{companyName}} {{currentYear}}, Social Media Links, Privacy Policy

  **About Us Page**
  *   **Navbar:** (Same as Homepage)
  *   **Page Title:** About {{companyName}}
  *   **Our Mission:** [Detailed text about company mission, values, related to {{productDescription}}]
  *   **Our Story:** [Brief history or founding story of {{companyName}}]
  *   **Team Section (Optional):** Placeholder for "Meet Our Team"
  *   **Footer:** (Same as Homepage)

  **Services/Product Page**
  *   **Navbar:** (Same as Homepage)
  *   **Page Title:** Our Services/Products (tailor based on {{productDescription}})
  *   **Service/Product 1 (based on {{keywords}}):**
      *   Headline: [Detailed name of Service/Product 1]
      *   Image/Icon Placeholder
      *   Description: [Detailed description of features and benefits]
      *   CTA: "Request a Demo" or "View Pricing"
  *   **Service/Product 2 (if applicable, based on {{keywords}}):**
      *   Headline: [Detailed name of Service/Product 2]
      *   Image/Icon Placeholder
      *   Description: [Detailed description of features and benefits]
      *   CTA: "Explore Feature"
  *   **Testimonial Section (Optional):** Placeholder for client quotes
  *   **Footer:** (Same as Homepage)

  Ensure the wireframe is described clearly and provides a good foundation for design and development.
  {{/if}}

  {{#if additionalInstructions}}
  Additional instructions: {{additionalInstructions}}
  {{/if}}
  `,
});

const generateMarketingCopyFlow = ai.defineFlow(
  {
    name: 'generateMarketingCopyFlow',
    inputSchema: GenerateMarketingCopyInputSchema,
    outputSchema: GenerateMarketingCopyOutputSchema,
  },
  async (input: GenerateMarketingCopyInput) => {
    const currentYear = new Date().getFullYear().toString();
    const isRadioScript = input.contentType === "radio script";
    const isTvScript = input.contentType === "tv script";
    const isBillboard = input.contentType === "billboard";
    const isWebsiteWireframe = input.contentType === "website wireframe";
    const isBlogPost = input.contentType === "blog post";

    const promptData = {
      ...input,
      currentYear,
      isRadioScript,
      isTvScript,
      isBillboard,
      isWebsiteWireframe,
      isBlogPost,
    };
    
    const {output} = await prompt(promptData);
    return output!;
  }
);

