
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
      'The type of content to generate (e.g., website copy, social media post, blog post, radio script, tv script, billboard, website wireframe, podcast outline, display ad copy, lead generation email).'
    ),
  tone: z.string().optional().describe('The desired tone for the generated copy (e.g., professional, casual, humorous).'),
  additionalInstructions: z
    .string()
    .optional()
    .describe('Any additional instructions for copy generation.'),
  companyName: z.string().optional().describe('The company name, useful for wireframe generation.'),
  productDescription: z.string().optional().describe('The product description, useful for wireframe generation.'),
  socialMediaPlatform: z
    .string()
    .optional()
    .describe('The specific social media platform (e.g., Twitter, Facebook, Instagram, LinkedIn, TikTok) if contentType is "social media post".'),
  tvScriptLength: z
    .string()
    .optional()
    .describe("The desired length for the TV script (e.g., '8s', '15s', '30s'). Defaults to 30s if not specified. '8s' is for VEO."),
  radioScriptLength: z
    .string()
    .optional()
    .describe("The desired length for the Radio script (e.g., '10s', '15s', '30s', '60s'). Defaults to all lengths if not specified.")
});
export type GenerateMarketingCopyInput = z.infer<
  typeof GenerateMarketingCopyInputSchema
>;

const PodcastOutlineStructureSchema = z.object({
  episodeTitle: z.string().describe("A catchy, descriptive title reflecting the episode’s topic."),
  episodeGoal: z.string().describe("A one-sentence summary of the episode's purpose."),
  targetAudience: z.string().describe("A brief description of the intended listeners."),
  totalLength: z.string().describe("The target duration for the podcast, e.g., '20–30 minutes'."),
  introduction: z.object({
    title: z.string().default("Introduction"),
    duration: z.string().describe("Approximate duration, e.g., '2–3 minutes'."),
    hook: z.string().describe("An engaging question, statistic, or anecdote to grab attention."),
    episodeOverview: z.string().describe("A brief summary of what the episode covers."),
  }),
  mainContent: z.array(z.object({
    segmentTitle: z.string().describe("A descriptive title for this content segment."),
    duration: z.string().describe("Approximate duration, e.g., '5–7 minutes'."),
    keyPoints: z.array(z.string()).describe("A list of the main ideas for this segment."),
    talkingPoints: z.array(z.string()).describe("Specific questions or details to elaborate on the key points."),
    supportingMaterial: z.string().optional().describe("A brief example, story, or statistic to support the segment."),
  })).describe("An array of 2-3 main content segments."),
  conclusion: z.object({
    title: z.string().default("Conclusion"),
    duration: z.string().describe("Approximate duration, e.g., '2–3 minutes'."),
    callToAction: z.string().describe("A clear call-to-action for the listener."),
    recap: z.string().describe("A summary of the 2-3 main takeaways from the episode."),
    teaser: z.string().describe("A brief preview of the topic for the next episode."),
  }),
});
export type PodcastOutlineStructure = z.infer<typeof PodcastOutlineStructureSchema>;


const GenerateMarketingCopyOutputSchema = z.object({
  marketingCopy: z.union([
    z.string(),
    z.array(z.string()),
    PodcastOutlineStructureSchema, // Added structured podcast outline
  ]).describe('The generated marketing copy. Can be a single string, an array of strings, or a structured podcast outline object. If "display ad copy", 3 common ad sizes. If "radio script", specific length or 10, 15, 30, 60 sec versions. If "tv script", specific length (8s, 15s, 30s) or default 30s; 8s scripts are ultra-concise and creative for VEO. If "podcast outline", a structured JSON object. If "blog post", approx 2450 words. If "lead generation email", a complete email structure.'),
  imageSuggestion: z.string().optional().describe("A brief, descriptive prompt for a relevant image, especially for visual content types like social media, display ads, or billboards.")
});
export type GenerateMarketingCopyOutput = z.infer<
  typeof GenerateMarketingCopyOutputSchema
>;

export async function generateMarketingCopy(
  input: GenerateMarketingCopyInput
): Promise<GenerateMarketingCopyOutput> {
  return generateMarketingCopyFlow(input);
}

const socialMediaPrompt = ai.definePrompt({
    name: 'generateSocialMediaCopyPrompt',
    input: {schema: GenerateMarketingCopyInputSchema},
    output: {schema: z.object({ 
        marketingCopy: z.array(z.string()).describe("An array of 5 distinct social media post strings, tailored to the platform if specified."),
        imageSuggestion: z.string().optional().describe("A single, creative, and descriptive prompt for a relevant image that could accompany these social media posts."),
    })},
    prompt: `You are a marketing expert specializing in creating engaging social media content.
    Generate 5 distinct variations of a social media post.
    Also, provide a single, creative, and descriptive prompt for a relevant image that could work for these posts.

    {{#if socialMediaPlatform}}
    Tailor these posts specifically for the "{{socialMediaPlatform}}" platform. Consider platform-specific best practices such as optimal length, tone, use of hashtags, emojis, and any typical content formats for "{{socialMediaPlatform}}".
    {{else}}
    These posts should be general enough for use on multiple platforms.
    {{/if}}
    
    {{#if tone}}
    Adapt all generated copy to have a {{tone}} tone.
    {{/if}}

    Incorporate these keywords: {{keywords}}.
    Company Name (if provided): {{companyName}}
    Product Description (if provided): {{productDescription}}

    {{#if additionalInstructions}}
    Additional instructions: {{additionalInstructions}}
    {{/if}}
    Return the 5 variations as a JSON array of strings in the 'marketingCopy' field and the image prompt in the 'imageSuggestion' field.
    `,
});

const podcastPrompt = ai.definePrompt({
    name: 'generatePodcastOutlinePrompt',
    input: { schema: GenerateMarketingCopyInputSchema },
    output: { schema: z.object({ marketingCopy: PodcastOutlineStructureSchema }) },
    prompt: `You are an expert podcast producer. Your task is to generate a complete, well-structured podcast outline as a JSON object that conforms to the provided schema.

    Base your outline on the following information:
    - Keywords: {{keywords}}
    - Company Name: {{companyName}}
    - Product Description: {{productDescription}}

    Flesh out all the fields in the JSON schema to create a comprehensive and logical episode plan. This is for an audio-only format, so do not generate an image suggestion.
    - The introduction hook should be engaging.
    - The main content should have 2-3 distinct segments, each with a clear purpose, key points, and talking points.
    - The conclusion should effectively summarize the episode and provide a clear call-to-action.
    `,
});


const genericPrompt = ai.definePrompt({
  name: 'generateMarketingCopyPrompt',
  input: {schema: z.any()},
  output: {schema: z.object({ 
      marketingCopy: z.string(),
      imageSuggestion: z.string().optional(),
  })},
  prompt: `You are a marketing expert specializing in creating engaging content.
  
  {{#if tone}}
  Adapt all generated copy to have a {{tone}} tone.
  {{/if}}

  {{#if isDisplayAdCopy}}
  Generate distinct ad copy variations for the three most common digital display ad sizes. For each ad size, ensure the copy is compelling and tailored to the limited space, incorporating these keywords: {{keywords}}.
  Company Name: {{companyName}}
  Product Description: {{productDescription}}
  The output for 'display ad copy' should clearly label each size and its corresponding copy (headline, body, call to action). Use the following format, with no asterisks or markdown:

  Medium Rectangle (300x250 pixels):
  Headline: [Compelling headline]
  Body: [Short body text, 1-2 sentences]
  CTA: [Call to Action]

  Leaderboard (728x90 pixels):
  Headline: [Concise headline]
  CTA: [Strong Call to Action]

  Wide Skyscraper (160x600 pixels):
  Headline: [Impactful headline]
  Body: [Brief body text]
  CTA: [Call to Action]

  You MUST also generate a creative and descriptive prompt for a relevant image and return it in the 'imageSuggestion' field.
  {{else if isRadioScript}}
  You are an expert at writing audio-only radio scripts.
  {{#if radioScriptLength}}
  Generate a radio script for the specified length: {{radioScriptLength}}.
  The script should be clearly labeled with its duration (e.g., "15s Radio Script:"). Use plain text and newlines for formatting, not markdown.
  {{else}}
  Generate four distinct radio script versions of varying lengths: 10 seconds, 15 seconds, 30 seconds, and 60 seconds.
  Each script version should be clearly labeled with its duration (e.g., "10-Second Radio Script:", "15-Second Radio Script:", etc.).
  IMPORTANT: Ensure there are at least two newlines (a blank line) between each script to separate them visually. Use plain text labels, not markdown.
  {{/if}}
  Ensure the copy is appropriate for its specified length and effectively incorporates these keywords: {{keywords}}.
  Company Name (if provided): {{companyName}}
  Product Description (if provided): {{productDescription}}
  {{else if isLeadGenerationEmail}}
  You are an expert email marketer specializing in crafting high-converting lead generation emails.
  Generate a compelling email designed to capture leads for {{companyName}} based on their {{productDescription}} and these keywords: {{keywords}}.
  The email should follow industry best practices and include the following distinct sections, clearly labeled using plain text, not markdown:

  Subject Line:
  [A concise and attention-grabbing subject line (max 60 characters recommended)]

  Email Body:
  Hi [Name],

  [Personalized and engaging opening paragraph. Clearly articulate the value proposition related to {{productDescription}}. Highlight key benefits and address potential pain points of the target audience. Use the keywords: "{{keywords}}" naturally throughout the body.]

  [Further paragraphs elaborating on benefits, use cases, or social proof, if applicable.]

  Call-to-Action (CTA):
  [A clear, strong, and singular call-to-action phrase that encourages the recipient to take the next step. For example: "Learn More", "Request a Demo", "Download Our Free Guide", "Get Started Today".]
  [Optional: Link for the CTA button/text, e.g., (Link: [Your CTA Link Here]) ]

  Closing:
  [A professional closing, e.g., Best regards, Sincerely,]

  [Your Name/Company Name]
  {{companyName}}
  [Website (Optional)]
  [Contact Information (Optional)]

  Keep the email concise, scannable, and mobile-friendly.
  {{else}}
  Generate marketing copy tailored for the following content type: {{contentType}}.
  Incorporate these keywords: {{keywords}}.
  Company Name (if provided): {{companyName}}
  Product Description (if provided): {{productDescription}}
  {{/if}}

  {{#if isTvScript}}
    {{#if is8sVEO}}
  Generate an extremely concise and highly creative TV script approximately 8 seconds in length, suitable for Video Engagement Optimization (VEO) platforms.
  The script must grab attention immediately and deliver a powerful message or call to action within this very short timeframe. Focus on visual storytelling if possible and minimal, impactful dialogue or voiceover.
  It should be clearly labeled with a plain text header: "8-Second VEO TV Script:".
    {{else if tvScriptLength}}
  The TV script should be approximately {{tvScriptLength}} in length.
    {{else}}
  The TV script should be approximately 30 seconds in length.
    {{/if}}
  You MUST generate a creative and descriptive prompt for a relevant image and return it in the 'imageSuggestion' field.
  {{/if}}

  {{#if isBillboard}}
  The billboard ad should be highly creative and concise, using no more than 8 words.
  You MUST generate a creative and descriptive prompt for a relevant image and return it in the 'imageSuggestion' field.
  {{/if}}

  {{#if isBlogPost}}
  The blog post should be approximately 2450 words in length.
  When crafting the blog post, please incorporate relevant information and insights about the company's core products or services, primarily drawing from the '{{productDescription}}' and using '{{companyName}}' for context.
  This should involve:
  *   Elaborating on the key features and benefits mentioned in the product description.
  *   Discussing common problems the product/service solves for its target audience.
  *   Potentially exploring related industry trends or use cases, if they can be logically inferred from the provided information and keywords ({{keywords}}).
  The aim is to produce an informative and engaging piece that subtly showcases the value and expertise related to the company's offerings, without sounding like a direct advertisement.
  {{/if}}
  
  {{#if isWebsiteWireframe}}
  Generate a textual wireframe for a minimum three-page website (e.g., Homepage, About Us, Services/Product Page).
  When designing this wireframe, consider best practices for website structure and user experience. Also, draw upon general knowledge of common and effective website layouts for businesses in a similar category to the one described by '{{companyName}}' and '{{productDescription}}'.

  For each page, outline the key sections and elements. Use plain text for all headers and labels (e.g., "Homepage", "Navbar:", "Hero Section:"). Do not use markdown like asterisks. Use indentation and newlines to create a clear hierarchy. For example:

  Homepage
    Navbar: Logo ({{companyName}}), Home, About Us, Services, Contact Us
    Hero Section:
      Headline: [Compelling headline based on {{productDescription}} and {{keywords}}]
      Sub-headline: [Brief explanation or benefit]
      CTA Button: "Learn More" or "Get Started"
      Background Image: Placeholder for a relevant, high-quality image
    Services/Products Overview (using {{keywords}}):
      Section Title: Our Core Offerings
      Service 1: [Name based on keyword 1] - [Short, benefit-driven description]
      Service 2: [Name based on keyword 2] - [Short, benefit-driven description]
      Service 3: [Name based on keyword 3] - [Short, benefit-driven description]
    About Us Snippet:
      Text: Brief introduction to {{companyName}}.
      Link: "Read More About Us" (to About Us page)
    Call to Action (Main):
      Headline: Ready to experience [key benefit]?
      Button: "Contact Us Today"
    Footer: Copyright {{companyName}} {{currentYear}}, Social Media Links, Privacy Policy

  About Us Page
    Navbar: (Consistent with Homepage)
    Page Title: About {{companyName}}
    Our Mission/Vision: [Detailed text about company mission and values]
    Our Story/History: [Brief history of {{companyName}}]
    Our Team (Optional): Placeholder for "Meet Our Team"

  Services/Product Page
    Navbar: (Consistent with Homepage)
    Page Title: Our Services
    Service/Product 1 (based on {{keywords}}):
      Headline: [Detailed name of Service/Product 1]
      Image/Icon Placeholder
      Detailed Description: [Comprehensive description of features and benefits]
      Specific CTA: "Request a Demo"
    (Repeat for other key services/products)

  Ensure the wireframe is described clearly and provides a solid foundation for design and development.
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
    if (input.contentType === "social media post") {
        const {output} = await socialMediaPrompt(input);
        if (!output) {
          throw new Error('The AI failed to generate social media posts.');
        }
        return output;
    }

    if (input.contentType === "podcast outline") {
        const { output } = await podcastPrompt(input);
        if (!output) {
             throw new Error("The AI failed to generate the podcast outline.");
        }
        // The output from podcastPrompt is already in the correct format { marketingCopy: PodcastOutlineStructure }
        // and does not include an image suggestion, which is correct for this audio-only format.
        return output;
    }
    
    const promptData = {
      ...input,
      currentYear: new Date().getFullYear().toString(),
      isRadioScript: input.contentType === "radio script",
      isTvScript: input.contentType === "tv script",
      isBillboard: input.contentType === "billboard",
      isWebsiteWireframe: input.contentType === "website wireframe",
      isBlogPost: input.contentType === "blog post",
      isDisplayAdCopy: input.contentType === "display ad copy",
      isLeadGenerationEmail: input.contentType === "lead generation email",
      is8sVEO: input.contentType === "tv script" && input.tvScriptLength === "8s",
    };
    
    const {output} = await genericPrompt(promptData);
    if (!output) {
      throw new Error('The AI failed to generate the requested marketing copy.');
    }
    return output;
  }
);

    