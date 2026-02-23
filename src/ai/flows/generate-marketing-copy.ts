
'use server';

/**
 * @fileOverview AI agent that generates marketing copy variations based on keywords and content type.
 *
 * - generateMarketingCopy - A function that generates marketing copy.
 * - GenerateMarketingCopyInput - The input type for the generateMarketingCopy function.
 * - GenerateMarketingCopyOutput - The return type for the generateMarketingCopy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

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
    .describe("The desired length for the Radio script (e.g., '10s', '15s', '30s', '60s'). Defaults to 30s if not specified."),
  emailType: z
    .string()
    .optional()
    .describe("The type of email to generate (e.g., cold outreach, nurture, promotional)."),
  numberOfVariations: z
    .number()
    .optional()
    .describe("The number of variations to generate (2-4). Only applicable for certain content types like 'radio script' and 'tv script'."),
  numberOfImageVariations: z
    .number()
    .optional()
    .describe("The number of image variations to generate (2-4). Only applicable for visual content types like 'social media post', 'display ad copy', and 'billboard'."),
  voiceGender: z
    .string()
    .optional()
    .describe("The gender of the voice for audio generation ('male' or 'female')."),
  voiceName: z
    .string()
    .optional()
    .describe("The specific voice name for audio generation. Available voices include male (Puck, Charon, Fenrir, Orus, Enceladus, Iapetus, Umbriel, Algieba, Algenib, Rasalgethi, Alnilam, Schedar, Achird, Zubenelgenubi, Sadachbia, Sadaltager) and female (Zephyr, Kore, Leda, Aoede, Callirrhoe, Autonoe, Despina, Erinome, Laomedeia, Achernar, Gacrux, Pulcherrima, Vindemiatrix, Sulafat) options. See UI form for full list with descriptions.")
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
  productionNotes: z.object({
      music: z.string().optional().describe("Suggestions for intro/outro and background music."),
      sfx: z.string().optional().describe("Ideas for sound effects to enhance storytelling."),
      adSpots: z.string().optional().describe("Placement suggestions for sponsor messages or internal promos."),
  }).optional().describe("Notes on production elements.")
});
export type PodcastOutlineStructure = z.infer<typeof PodcastOutlineStructureSchema>;

const BlogPostStructureSchema = z.object({
  title: z.string().describe("The main, compelling title of the blog post."),
  topic_theme: z.string().optional().describe("The thematic focus of this post (e.g. 'Problem/Solution', 'Industry Trend')."),
  seoKeywords: z.array(z.string()).optional().describe("List of target SEO keywords for this specific post."),
  metaDescription: z.string().optional().describe("SEO-optimized meta description under 160 characters."),
  keyTakeaways: z.array(z.string()).optional().describe("3 bullet points summarizing the key value props (for AI snapshots)."),
  faqSnippet: z.object({
    question: z.string().describe("A relevant 'People Also Ask' question."),
    answer: z.string().describe("A direct, clear answer to the question."),
  }).optional().describe("FAQ snippet for Schema markup."),
  sections: z.array(z.object({
    heading: z.string().describe("The heading for this section of the blog post."),
    contentItems: z.array(z.object({
        paragraph: z.string().optional().describe("A paragraph of text. Use this for standard text blocks."),
        listItems: z.array(z.string()).optional().describe("A list of bullet points. Use this for itemized points. One of these, paragraph or listItems, must be provided."),
    })).describe("An array of content items. Each item is either a paragraph or a list of bullet points. Aim for a total word count of approximately 2350 words for the entire post.")
  })).describe("An array of sections, each with a heading and content.")
});
export type BlogPostStructure = z.infer<typeof BlogPostStructureSchema>;


const GenerateMarketingCopyOutputSchema = z.object({
  marketingCopy: z.union([
    z.string().describe('A single string of marketing copy'),
    z.array(z.string()).describe('An array of marketing copy strings'),
    PodcastOutlineStructureSchema,
    BlogPostStructureSchema,
    z.array(BlogPostStructureSchema).describe('An array of blog posts for a content series'),
    z.array(z.object({
      variant: z.number().describe('The variant number'),
      copy: z.string().describe('The marketing copy for this variant')
    })).describe('Array of variant objects for multi-variant generation')
  ]).describe('The generated marketing copy in various formats'),
  imageSuggestion: z.string().optional().describe("A brief, descriptive prompt for a relevant image, especially for visual content types like social media, display ads, or billboards. This should NOT be generated for audio-only or script-based content like radio or TV scripts."),
  imageSuggestions: z.array(z.string()).optional().describe("Array of image prompts for multi-variant image generation.")
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
        imageSuggestions: z.array(z.string()).optional().describe("Array of creative, descriptive prompts for multiple image variations for A/B testing."),
    })},
    prompt: `You are a marketing expert specializing in creating engaging social media content.
    Generate 5 distinct variations of a social media post.
    {{#if numberOfImageVariations}}
    Also, generate {{numberOfImageVariations}} creative, descriptive prompts for different image variations that could accompany these social media posts. Each image prompt should be unique and offer a different visual approach for A/B testing. Return these in the 'imageSuggestions' array.
    {{else}}
    Also, provide a single, creative, and descriptive prompt for a relevant image that could work for these posts in the 'imageSuggestion' field.
    {{/if}}

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
    prompt: `You are a top podcast content strategist, drawing from Dave Jackson (for structured, listener-engaging outlines that balance education and entertainment), James Cridland (for content strategies that drive growth in news-style formats), and Steve Stewart (for detailed outlines ensuring flow, monetization, and alignment with goals). Create a comprehensive podcast episode outline for the client, designed to produce captivating, high-value content that hooks listeners and achieves objectives.
    
    Base your outline on the following information:
    - Keywords: {{keywords}}
    - Company Name: {{companyName}}
    - Product Description: {{productDescription}}
    - Tone: {{tone}}
    - Additional Instructions: {{additionalInstructions}}
    
    Structure the podcast outline according to the provided JSON output schema. Ensure the outline is listener-focused (flowing narrative, varied pacing), monetizable (sponsor integrations), and actionable.
    Flesh out all the fields in the JSON schema to create a comprehensive and logical episode plan. This is for an audio-only format, so do not generate an image suggestion.
    
    Introduction/Hook: Tease the topic with a story or question to engage immediately.
    Main Segments: Break into 3-5 timed sections with key points, transitions, and interactive elements (e.g., Q&A).
    Deep Dive/Insights: Provide value with examples, data, or stories, positioning the client as an expert.
    Conclusion/CTA: Summarize takeaways, warn of common pitfalls, and include strong calls to action (e.g., subscribe, visit site).
    Production Notes: Suggest music, sound effects, ad spots, and timing.

    Ensure the outline is listener-focused (flowing narrative, varied pacing), monetizable (sponsor integrations), and actionable. Output only the formatted outline (e.g., Episode Title:, Segment 1 (0:00-5:00):, Production Notes:), without any meta-commentary.
    `,
});

const blogPostPrompt = ai.definePrompt({
    name: 'generateBlogPostPrompt',
    input: { schema: GenerateMarketingCopyInputSchema },
    output: { schema: z.object({ marketingCopy: z.array(BlogPostStructureSchema) }) },
    prompt: `You are an elite Content Strategist, channeling the expertise of Ann Handley (for reader-first, storytelling-driven content), Seth Godin (for concise, thought-provoking ideas), and Neil Patel (for SEO-optimized, data-backed posts).
    Your goal is to create a 4-Part Blog Post Integration Series (1 Month of Content) for the client's business.
    The goal is to build long-term authority by covering 4 distinct strategic angles:

    1.  **The "Problem/Solution" Post**: Identifies a core customer pain point and solves it with empathy and authority.
    2.  **The "Educational/How-To" Post**: Teaches a specific high-value skill or concept relevant to the product.
    3.  **The "Industry Trend" Post (Thought Leadership)**: Discusses where the market is going, positioning the brand as a visionary.
    4.  **The "Product Spotlight" Post (Bottom of Funnel)**: A deep dive into a specific offering/benefit, focusing on transformation.

    Business Context:
    - Product Description: {{productDescription}}
    - Company Name: {{companyName}}
    - Tone: {{tone}}
    - Keywords: {{keywords}}
    - Additional instructions: {{additionalInstructions}}

    REQUIREMENTS FOR EACH POST:
    1.  **Dual Optimization**: Write for humans (engaging hook, clear value) AND for AI Search/SGE (Clear definitions, structured data).
    2.  **Key Takeaways**: Include 3 specific bullet points at the very top summarizing the value (Crucial for AI Snapshots).
    3.  **FAQ Snippet**: End with one "People Also Ask" style question and a direct answer (Great for Voice Search & Snippets).
    4.  **Length**: Each post should be comprehensive (approx 1500-2000 words logic, though output may be condensed for token limits).

    Structure the JSON output as an array of 4 blog post objects, each following the schema provided.
    Ensure the "topic_theme" field explicitly labels the post type (e.g., "Problem/Solution", "Educational").
    Output only the structured JSON.
    `,
});


const genericPrompt = ai.definePrompt({
  name: 'generateMarketingCopyPrompt',
  input: {schema: z.any()},
  output: {schema: z.object({ 
      marketingCopy: z.string(),
      imageSuggestion: z.string().optional(),
      imageSuggestions: z.array(z.string()).optional(),
  })},
  prompt: `You are a marketing expert specializing in creating engaging content.
  
  {{#if tone}}
  Adapt all generated copy to have a {{tone}} tone.
  {{/if}}

  {{#if isDisplayAdCopy}}
  You are a top display ad copywriter, drawing from Joanna Wiebe (for persuasive, tested variations that maximize clicks), Lianna Patch (for humorous, targeted ads that boost engagement), and Neville Medhora (for short-form copy that excels in ad networks with A/B insights). Create 3-5 standout display ad copy variations for the client, crafted to grab attention, resonate, and convert in digital spaces.
  Keep it concise (headlines under 10 words), benefit-focused, and optimized for clicks. Output only the formatted ads, without extra explanation.

  Inputs to incorporate:
  - Client's business summary: {{productDescription}}
  - Company: {{companyName}}
  {{#if tone}}
  - Tone: {{tone}}
  {{/if}}
  - Keywords: {{keywords}}
  {{#if additionalInstructions}}
  - Additional instructions: {{additionalInstructions}}
  {{/if}}
  
  Structure the display ad copy like this, providing 3-5 distinct variations:
  
  Headline: Short, attention-grabbing phrases.
  Body: 1-2 sentences of persuasive detail.
  CTA: Urgent, action-oriented button text.
  Visual Notes: Suggest imagery or layout for the ad.

  {{#if numberOfImageVariations}}
  You MUST generate {{numberOfImageVariations}} creative and descriptive prompts for different image variations for A/B testing and return them in the 'imageSuggestions' array. Each image prompt should offer a unique visual approach.
  {{else}}
  You MUST also generate a creative and descriptive prompt for a relevant image and return it in the 'imageSuggestion' field.
  {{/if}}
  {{else if isRadioScript}}
  You are a master radio scriptwriter, embodying the styles of Melissa D'Anzieri (for memorable, audience-targeted narratives with emotional impact), Dan Kennedy (for direct-response persuasion focused on ROI and customer psychology), and John Carlton (for bold, story-based techniques that convert). 
  Generate a radio script for the specified length, crafted to deliver standout, attention-grabbing content that resonates and drives action.
  Output only the formatted script (e.g., [NARRATOR:], [SFX:]), without extra explanation.
  You MUST spell out all numbers (e.g., write "one hundred" not "100").
  Do NOT generate an image suggestion. The 'imageSuggestion' field in the output must be empty.

  Inputs to incorporate:
  - Client's business summary: {{productDescription}}
  - Keywords to include: {{keywords}}
  - Company: {{companyName}}
  {{#if tone}}
  - Tone: {{tone}}
  {{/if}}
  {{#if additionalInstructions}}
  - Additional instructions: {{additionalInstructions}}
  {{/if}}

  Script length and word count must be strictly followed:
  {{#if radioScriptLength}}
    - For '60s', the script must be approximately 120 words (reduced for TTS timing).
    - For '30s', the script must be approximately 60 words (reduced for TTS timing).
    - For '15s', the script must be approximately 28 words (reduced for TTS timing).
    - For '10s', the script must be approximately 18 words (reduced for TTS timing).
    Current length: {{radioScriptLength}}.
  {{else}}
    The script must be for 30 seconds, so approximately 60 words (reduced for TTS timing).
  {{/if}}

  Structure the script like this:
  1. Opening Hook: Grab attention with a relatable problem, using bold flair.
  2. Empathetic Guide: Position the client as a mentor, showcasing authority and empathy.
  3. Plan and CTA: Provide a simple plan if fitting, end with an urgent, benefit-focused CTA to drive action.
  4. Production Notes: Include cues for voice, music, SFX to enhance the broadcast feel (e.g., [SFX: phone ringing], [MUSIC: upbeat and modern]).
  {{else if isTvScript}}
  You are a premier TV scriptwriter, drawing from John August (for concise, visually compelling narratives), Craig Mazin (for engaging, high-stakes arcs), and Syd Field (for structured storytelling with clear acts). Create a TV commercial script for the specified length, designed to produce bold, visually stunning content that captivates and converts.
  Output only the formatted script (e.g., [FADE IN:], [VO:], [CUT TO:]), without additional notes.
  You MUST spell out all numbers (e.g., write "one hundred" not "100").
  Do NOT generate an image suggestion. The 'imageSuggestion' field in the output must be empty.

  IMPORTANT FORMATTING RULES FOR AUDIO GENERATION:
  - All spoken dialogue MUST be prefixed with a character tag in brackets, specifically [VO]: or [NARRATOR]: or [CHARACTER]:.
  - All visual descriptions, scene headings, camera directions, and transitions MUST be enclosed in brackets like [FADE IN], [CUT TO], [SCENE START], or standard sluglines like INT./EXT. (which we will strip out).
  - Do NOT write spoken text without a tag.

  Inputs to incorporate:
  - Client's business summary: {{productDescription}}
  - Company Name: {{companyName}}
  {{#if tone}}
  - Tone: {{tone}}
  {{/if}}
  {{#if additionalInstructions}}
  - Additional instructions: {{additionalInstructions}}
  {{/if}}

  Script length and word count must be strictly followed:
    {{#if is8sVEO}}
      - For '8s', the script must be very concise, approximately 15 words (reduced for TTS timing).
    {{else if tvScriptLength}}
      - For '30s', the script must be approximately 60 words (reduced for TTS timing).
      - For '15s', the script must be approximately 28 words (reduced for TTS timing).
      Current length: {{tvScriptLength}}.
    {{else}}
      The script must be for 30 seconds, so approximately 60 words (reduced for TTS timing).
    {{/if}}
  
  Structure the script using a three-act paradigm:

  Setup (Act 1 - Hook): Introduce the hero's problem visually, with high stakes for emotional pull.
  Confrontation (Act 2 - Guide and Plan): Show the client as a guide, demonstrating transformation through quick scenes.
  Resolution (Act 3 - CTA and Success): Depict positive outcomes, warn of failure subtly, end with strong CTA for action.
  Visual/Production Notes: Detail shots, voiceover, music, text overlays for full production.
  {{else if isWebsiteCopy}}
  You are an elite website copywriter, channeling the expertise of Joanna Wiebe (for data-driven, conversion-focused writing that boosts engagement), Ann Handley (for audience-centric storytelling that's authentic and compelling), and Jacob McMillen (for persuasive B2B/SaaS copy that drives sales with clear narratives). Your goal is to generate high-quality, standout website copy tailored to the client's business, designed to captivate visitors, build trust, and convert with irresistible, memorable content.
  
  Inputs to incorporate:
  - Client's business summary: {{productDescription}}
  - Company Name: {{companyName}}
  {{#if tone}}
  - Tone: {{tone}}
  {{/if}}
  - Keywords to include: {{keywords}}
  - Additional instructions: {{additionalInstructions}}

  Length: Aim for 300-600 words total unless specified otherwise.
  
  Structure the website copy like this:

  Hero Section: Start with a compelling headline and subheadline that hooks with a problem-solution angle, empathizing with audience pain points.
  Body Sections: Use narrative flow to detail benefits, features, and social proof, backed by data where possible, positioning the client as the solution provider.
  CTA Sections: Include multiple clear, urgent calls to action throughout, focused on conversions.
  Footer/Closing: End with reinforcing trust elements like guarantees or contact info.

  Ensure the copy is SEO-friendly (natural keywords, scannable with subheads and bullets), persuasive (active voice, benefit-oriented), and aligned with the client's voice. 
  Output only the formatted website copy (e.g., Hero Headline:, Subheadline:, Body Paragraph:), without any meta-commentary.
  
  {{else if isLeadGenerationEmail}}
  You are an expert lead gen email strategist, channeling Ian Brodie (for trust-building sequences that nurture prospects), Alex Berman (for personalized, high-response cold emails in B2B), and Jay Feldman (for scalable strategies that integrate with funnels). Generate a high-impact lead generation email (or sequence) for the client, designed to engage, provide value, and convert leads with compelling, results-driven content.
  
  Inputs to incorporate:
  - Client's business summary: {{productDescription}}
  - Company: {{companyName}}
  {{#if tone}}
  - Tone: {{tone}}
  {{/if}}
  - Keywords to include: {{keywords}}
  - Email Type: {{emailType}}
  - Additional instructions: {{additionalInstructions}}

  Length: Aim for 150-300 words unless specified.

  Structure the email like this:

  Subject Line: Attention-grabbing and relevant.
  Opening/Greeting: Personalize and hook with a problem or insight.
  Body: Build value with stories, tips, or offers, positioning the client as an expert.
  CTA/Close: Clear call to action, with subtle urgency.
  Signature: Professional sign-off with contact info.

  Ensure it's personalized, mobile-friendly (short paragraphs), and compliance-ready (e.g., unsubscribe note). Output only the formatted email (e.g., Subject:, Greeting:, Body Paragraphs:, CTA:, Signature:), without any meta-commentary.
  {{else if isBillboard}}
  You are a legendary billboard ad creator, channeling David Ogilvy (for concise, benefit-driven copy that captures attention instantly), Dan Kennedy (for direct-response messaging that provokes action), and Gary Halbert (for clever, provocative headlines that stand out). Generate a standout billboard ad concept for the client, crafted to deliver high-impact, memorable content that stops traffic and drives results.
  
  Inputs to incorporate:
  - Client's business summary: {{productDescription}}
  - Company: {{companyName}}
  {{#if tone}}
  - Tone: {{tone}}
  {{/if}}
  {{#if additionalInstructions}}
  - Additional instructions: {{additionalInstructions}}
  {{/if}}

  Structure the billboard ad like this:
  Headline: A short, punchy phrase that hooks with a problem or benefit.
  Subheadline/Body: 1-2 lines of supporting copy for clarity and persuasion.
  CTA/Visuals: A clear call to action and suggestions for imagery or design elements.
  Overall Concept: Describe layout for maximum visibility (e.g., large fonts, high contrast).

  Keep it ultra-concise (under 10 words ideally), visually oriented, and focused on instant impact.
  Output only the formatted ad (e.g., Headline:, Subheadline:, CTA:, Visual Notes:), without extra explanation.
  {{#if numberOfImageVariations}}
  You MUST generate {{numberOfImageVariations}} creative and descriptive prompts for different image variations for A/B testing and return them in the 'imageSuggestions' array. Each image prompt should offer a unique visual approach.
  {{else}}
  You MUST generate a creative and descriptive prompt for a relevant image and return it in the 'imageSuggestion' field.
  {{/if}}

  {{else if isWebsiteWireframe}}
  You are a premier UX/UI strategist, embodying Don Norman (for intuitive, user-centered design principles), Jakob Nielsen (for usability-optimized navigation and conversion flows), and Aurélien Salomon (for minimalist, high-fidelity wireframes that enhance experiences). Generate a detailed textual description of a website wireframe for the client, designed to outline standout, user-friendly structures that engage and convert.

  Inputs to incorporate:
  - Company: {{companyName}}
  - Product/Business Summary: {{productDescription}}
  - Tone: {{tone}}
  - Keywords: {{keywords}}
  - Additional Instructions: {{additionalInstructions}}

  Structure the wireframe description like this:
  Overall Layout: Describe header, footer, navigation (e.g., menu items, search bar).
  Page-Specific Sections: Break down each page (e.g., Homepage, About, Product) into zones (hero, content blocks, CTAs) with placement and functionality notes.
  User Flow: Outline interactions, accessibility features, and conversion paths.
  Design Notes: Suggest hierarchy, spacing, and usability best practices.

  Ensure it's functional (clear paths to goals), accessible, and described vividly for easy visualization. Output only the formatted wireframe (e.g., Homepage:, Header:, Hero Section:, User Flow Notes:), without any meta-commentary.
  {{else}}
  Generate marketing copy tailored for the following content type: {{contentType}}.
  Incorporate these keywords: {{keywords}}.
  Company Name (if provided): {{companyName}}
  Product Description (if provided): {{productDescription}}
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
    try {
      console.log('[MktgCopy Flow] Starting generation for:', {
        contentType: input.contentType,
        keywordsLength: input.keywords.length,
        numberOfVariations: input.numberOfVariations || 1,
      });

      // Check if multiple variations are requested
      const numberOfVariations = input.numberOfVariations || 1;
      const supportsVariations = ['radio script', 'tv script'].includes(input.contentType);
      
      // If variations are requested for supported content types, generate them
      if (numberOfVariations > 1 && supportsVariations) {
        const variants = [];
        
        for (let i = 1; i <= numberOfVariations; i++) {
          // For all other content types, use the generic prompt
          const promptData = {
            ...input,
            currentYear: new Date().getFullYear().toString(),
            isRadioScript: input.contentType === "radio script",
            isTvScript: input.contentType === "tv script",
            isBillboard: input.contentType === "billboard",
            isWebsiteWireframe: input.contentType === "website wireframe",
            isDisplayAdCopy: input.contentType === "display ad copy",
            isLeadGenerationEmail: input.contentType === "lead generation email",
            isWebsiteCopy: input.contentType === "website copy",
            is8sVEO: input.contentType === "tv script" && input.tvScriptLength === "8s",
          };
          
          const {output} = await genericPrompt(promptData);
          if (!output) {
            throw new Error(`The AI failed to generate variant ${i}.`);
          }
          
          // Strip production cues for scripts
          const strippedCopy = (output.marketingCopy || '').replace(/\[[^\]]*\]/g, '').trim();
          
          variants.push({
            variant: i,
            copy: strippedCopy
          });
        }
        
        console.log('[MktgCopy Flow] Generated', variants.length, 'variations');
        return { 
          marketingCopy: variants,
          imageSuggestion: undefined // No image for scripts
        };
      }
      
      // Isolate social media post generation as it has a unique output structure (array)
      if (input.contentType === "social media post") {
          const {output} = await socialMediaPrompt(input);
          if (!output) {
            throw new Error('The AI failed to generate social media posts.');
          }
          console.log('[MktgCopy Flow] Generated social media posts');
          return output;
      }

      // Isolate podcast outline generation for its unique JSON structure
      if (input.contentType === "podcast outline") {
          const { output } = await podcastPrompt(input);
          if (!output) {
               throw new Error("The AI failed to generate the podcast outline.");
          }
          console.log('[MktgCopy Flow] Generated podcast outline');
          // Ensure no image suggestion for podcast outlines
          return { marketingCopy: output.marketingCopy, imageSuggestion: undefined };
      }
      
      // Isolate blog post generation for its unique JSON structure
      if (input.contentType === "blog post") {
          const { output } = await blogPostPrompt(input);
          if (!output) {
               throw new Error("The AI failed to generate the blog post.");
          }
          console.log('[MktgCopy Flow] Generated blog post');
          // Ensure no image suggestion for blog posts
          return { marketingCopy: output.marketingCopy, imageSuggestion: undefined };
      }
      
      // For all other content types, use the generic prompt
      const promptData = {
        ...input,
        currentYear: new Date().getFullYear().toString(),
        isRadioScript: input.contentType === "radio script",
        isTvScript: input.contentType === "tv script",
        isBillboard: input.contentType === "billboard",
        isWebsiteWireframe: input.contentType === "website wireframe",
        isDisplayAdCopy: input.contentType === "display ad copy",
        isLeadGenerationEmail: input.contentType === "lead generation email",
        isWebsiteCopy: input.contentType === "website copy",
        is8sVEO: input.contentType === "tv script" && input.tvScriptLength === "8s",
      };
      
      const {output} = await genericPrompt(promptData);
      if (!output) {
        throw new Error('The AI failed to generate the requested marketing copy.');
      }
      
      // For audio-based content, ensure no image suggestion is returned.
      if (promptData.isRadioScript || promptData.isTvScript) {
        const strippedCopy = (output.marketingCopy || '').replace(/\[[^\]]*\]/g, '').trim();
        console.log('[MktgCopy Flow] Generated audio script, stripped and returning');
        return { marketingCopy: strippedCopy, imageSuggestion: undefined };
      }

      console.log('[MktgCopy Flow] Generated generic content');
      // For all other generic types, return the full output from the prompt
      return output;
    } catch (error) {
      console.error('[MktgCopy Flow] Error:', error instanceof Error ? error.message : String(error));
      if (error instanceof Error && error.stack) {
        console.error('[MktgCopy Flow] Stack:', error.stack);
      }
      throw error;
    }
  }
);
