
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
    .describe("The specific voice name for audio generation. Available voices include male (Puck, Charon, Fenrir, Orus, Enceladus, Iapetus, Umbriel, Algieba, Algenib, Rasalgethi, Alnilam, Schedar, Achird, Zubenelgenubi, Sadachbia, Sadaltager) and female (Zephyr, Kore, Leda, Aoede, Callirrhoe, Autonoe, Despina, Erinome, Laomedeia, Achernar, Gacrux, Pulcherrima, Vindemiatrix, Sulafat) options. See UI form for full list with descriptions."),
  blogFormat: z
    .string()
    .optional()
    .describe("The format of the blog post to generate ('single' or 'series'). Defaults to 'series' if not specified."),
  websiteUrl: z
    .string()
    .optional()
    .describe("The client's actual website URL. Must be used EXACTLY as provided — never fabricated or modified."),
  businessPhone: z
    .string()
    .optional()
    .describe("The client's actual business phone number. Must be used EXACTLY as provided — never fabricated or modified."),
  websiteCopyType: z
    .enum(['landing_page', 'standard_5_page'])
    .optional()
    .describe("The type of website copy to generate: 'landing_page' for a high-conversion single-page, or 'standard_5_page' for a full multi-page website."),
  websiteFlexPage: z
    .enum(['blog', 'portfolio', 'testimonials', 'faq', 'pricing'])
    .optional()
    .describe("The 5th flexible page for a standard 5-page website (Home, About, Services, Contact + this page)."),
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

// --- Billboard Ad structured schema ---
const BillboardAdStructureSchema = z.object({
  headline: z.string().describe("A punchy headline of 4-7 words MAX. Count every word. 8+ words = FAIL."),
  subheadline: z.string().describe("One short supporting phrase of 4-8 words MAX. Not a sentence — a phrase."),
  cta: z.string().describe("A direct call-to-action of 2-5 words MAX (e.g., 'Visit acme.com', 'Call 555-1234')."),
  visualNotes: z.string().describe("1-2 sentences MAX on imagery/color direction. Keep it brief."),
  overallConcept: z.string().describe("1 sentence MAX on layout strategy (e.g., 'Large sans-serif on dark background')."),
});
export type BillboardAdStructure = z.infer<typeof BillboardAdStructureSchema>;

// --- Landing Page structured schema ---
const LandingPageSchema = z.object({
  headline: z.string().describe("A powerful, benefit-driven headline that immediately communicates the core value proposition."),
  subheadline: z.string().describe("A supporting statement that adds clarity and reinforces the headline."),
  heroCtaText: z.string().describe("The primary CTA button text in the hero section (e.g., 'Get Started Free', 'Book a Demo')."),
  heroCtaDestination: z.string().optional().describe("Where the hero CTA should link to."),
  problemStatement: z.string().describe("A compelling paragraph articulating the target audience's pain point."),
  solutionOverview: z.string().describe("A paragraph explaining how the product/service solves the problem."),
  features: z.array(z.object({
    title: z.string().describe("Feature or benefit title."),
    description: z.string().describe("1-2 sentence description of this feature/benefit."),
  })).describe("3-5 key features or benefits."),
  socialProof: z.string().describe("A testimonial, stat, or trust signal (e.g., '10,000+ businesses trust us')."),
  urgencyElement: z.string().describe("A line creating urgency or scarcity (e.g., 'Limited spots available')."),
  finalCtaText: z.string().describe("The final CTA button text at the bottom of the page."),
  finalCtaDestination: z.string().optional().describe("Where the final CTA should link to."),
  designNotes: z.string().describe("Visual/layout recommendations for the landing page."),
  metaTitle: z.string().describe("SEO meta title for the page (under 60 chars)."),
  metaDescription: z.string().describe("SEO meta description (under 160 chars)."),
});
export type LandingPageStructure = z.infer<typeof LandingPageSchema>;

// --- Standard Website Page structured schema ---
const WebsitePageSectionSchema = z.object({
  sectionType: z.string().describe("The type of section (e.g., 'hero', 'features', 'testimonials', 'cta', 'content', 'faq', 'pricing-table', 'team', 'portfolio-grid')."),
  heading: z.string().describe("The section heading."),
  subheading: z.string().optional().describe("Optional subheading for the section."),
  bodyContent: z.string().describe("The main content/copy for this section. For lists, separate items with newlines."),
  ctaText: z.string().optional().describe("CTA button text if this section has one."),
  ctaDestination: z.string().optional().describe("Where the CTA links to (e.g., '/contact', '#pricing')."),
  designNotes: z.string().optional().describe("Layout or visual recommendations for this section."),
});

const WebsitePageSchema = z.object({
  pageName: z.string().describe("The page name (e.g., 'Home', 'About', 'Services', 'Contact', 'Blog')."),
  pageSlug: z.string().describe("URL slug for this page (e.g., '/', '/about', '/services')."),
  metaTitle: z.string().describe("SEO meta title for the page (under 60 chars)."),
  metaDescription: z.string().describe("SEO meta description (under 160 chars)."),
  sections: z.array(WebsitePageSectionSchema).describe("The content sections for this page, in order."),
});
export type WebsitePageStructure = z.infer<typeof WebsitePageSchema>;

// --- Website Wireframe Page structured schema ---
const WireframePageSectionSchema = z.object({
  sectionName: z.string().describe("The name of this wireframe section (e.g., 'Hero Banner', 'Feature Grid', 'CTA Block')."),
  layoutType: z.string().describe("Layout description (e.g., 'full-width banner', '3-column grid', 'centered text block')."),
  contentPlaceholder: z.string().describe("What content goes here (e.g., 'Headline + subheadline + CTA button', '3 feature cards with icons')."),
  functionalNotes: z.string().optional().describe("Interactive or functional notes (e.g., 'Form with name/email fields', 'Accordion FAQ')."),
  designSpecs: z.string().optional().describe("Spacing, hierarchy, and visual notes (e.g., '80px top padding, dark background, white text')."),
});

const WireframePageSchema = z.object({
  pageName: z.string().describe("The page name (e.g., 'Home', 'About', 'Services')."),
  pageSlug: z.string().describe("URL slug (e.g., '/', '/about')."),
  sections: z.array(WireframePageSectionSchema).describe("The wireframe sections for this page, in order."),
});

const WireframeSiteSchema = z.object({
  siteNavigation: z.object({
    logoPosition: z.string().describe("Where the logo goes (e.g., 'top-left')."),
    menuItems: z.array(z.string()).describe("Navigation menu items."),
    ctaButton: z.string().optional().describe("Navigation CTA button text if any."),
  }),
  pages: z.array(WireframePageSchema).describe("The wireframe for each page."),
  footer: z.object({
    columns: z.array(z.object({
      heading: z.string().describe("Footer column heading."),
      items: z.array(z.string()).describe("Items/links in this column."),
    })).describe("Footer columns."),
    copyright: z.string().describe("Copyright text."),
  }),
  designSystem: z.object({
    colorScheme: z.string().describe("Recommended color scheme."),
    typography: z.string().describe("Font recommendations."),
    spacing: z.string().describe("Spacing/grid notes."),
  }),
  userFlowNotes: z.string().describe("Key user flow and conversion path notes."),
});
export type WireframeSiteStructure = z.infer<typeof WireframeSiteSchema>;

// --- Display Ad Copy structured schema (3-5 variations) ---
const DisplayAdVariationSchema = z.object({
  headline: z.string().describe("Short, attention-grabbing headline (under 10 words)."),
  body: z.string().describe("1-2 sentences of persuasive detail."),
  cta: z.string().describe("Urgent, action-oriented button text."),
  visualNotes: z.string().describe("Suggest imagery or layout for the ad."),
});
export type DisplayAdVariation = z.infer<typeof DisplayAdVariationSchema>;


const GenerateMarketingCopyOutputSchema = z.object({
  marketingCopy: z.union([
    z.string().describe('A single string of marketing copy'),
    z.array(z.string()).describe('An array of marketing copy strings'),
    PodcastOutlineStructureSchema,
    BlogPostStructureSchema,
    z.array(BlogPostStructureSchema).describe('An array of blog posts for a content series'),
    BillboardAdStructureSchema,
    z.array(DisplayAdVariationSchema).describe('An array of 3-5 display ad variations'),
    LandingPageSchema,
    z.array(WebsitePageSchema).describe('An array of website pages for a standard 5-page site'),
    WireframeSiteSchema,
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

    {{#if websiteUrl}}
    FACTUAL BUSINESS DATA — Use these EXACTLY as provided. NEVER fabricate, guess, or modify URLs, phone numbers, or addresses:
    - Website URL: {{websiteUrl}} (use this EXACT URL if a URL is needed — do NOT invent a different one)
    {{#if businessPhone}}
    - Business Phone: {{businessPhone}} (use this EXACT phone number if a phone number is needed)
    {{/if}}
    If no URL or phone is provided above, do NOT make one up. Simply omit it.
    {{/if}}

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

    {{#if websiteUrl}}
    FACTUAL BUSINESS DATA — Use these EXACTLY as provided. NEVER fabricate, guess, or modify URLs, phone numbers, or addresses:
    - Website URL: {{websiteUrl}} (use this EXACT URL if a URL is needed — do NOT invent a different one)
    {{#if businessPhone}}
    - Business Phone: {{businessPhone}} (use this EXACT phone number if a phone number is needed)
    {{/if}}
    If no URL or phone is provided above, do NOT make one up. Simply omit it.
    {{/if}}
    
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

const blogPostSeriesPrompt = ai.definePrompt({
    name: 'generateBlogPostSeriesPrompt',
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

    {{#if websiteUrl}}
    FACTUAL BUSINESS DATA — Use these EXACTLY as provided. NEVER fabricate, guess, or modify URLs, phone numbers, or addresses:
    - Website URL: {{websiteUrl}} (use this EXACT URL if a URL is needed — do NOT invent a different one)
    {{#if businessPhone}}
    - Business Phone: {{businessPhone}} (use this EXACT phone number if a phone number is needed)
    {{/if}}
    If no URL or phone is provided above, do NOT make one up. Simply omit it.
    {{/if}}

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

const blogPostSinglePrompt = ai.definePrompt({
    name: 'generateBlogPostSinglePrompt',
    input: { schema: GenerateMarketingCopyInputSchema },
    output: { schema: z.object({ marketingCopy: BlogPostStructureSchema }) },
    prompt: `You are an elite Content Strategist, channeling the expertise of Ann Handley (for reader-first, storytelling-driven content), Seth Godin (for concise, thought-provoking ideas), and Neil Patel (for SEO-optimized, data-backed posts).
    Your goal is to create a single, high-impact Blog Post for the client's business.

    Business Context:
    - Product Description: {{productDescription}}
    - Company Name: {{companyName}}
    - Tone: {{tone}}
    - Keywords: {{keywords}}
    - Additional instructions: {{additionalInstructions}}

    {{#if websiteUrl}}
    FACTUAL BUSINESS DATA — Use these EXACTLY as provided. NEVER fabricate, guess, or modify URLs, phone numbers, or addresses:
    - Website URL: {{websiteUrl}} (use this EXACT URL if a URL is needed — do NOT invent a different one)
    {{#if businessPhone}}
    - Business Phone: {{businessPhone}} (use this EXACT phone number if a phone number is needed)
    {{/if}}
    If no URL or phone is provided above, do NOT make one up. Simply omit it.
    {{/if}}

    REQUIREMENTS:
    1.  **Dual Optimization**: Write for humans (engaging hook, clear value) AND for AI Search/SGE (Clear definitions, structured data).
    2.  **Key Takeaways**: Include 3 specific bullet points at the very top summarizing the value (Crucial for AI Snapshots).
    3.  **FAQ Snippet**: End with one "People Also Ask" style question and a direct answer (Great for Voice Search & Snippets).
    4.  **Length**: The post should be comprehensive (approx 1500-2000 words logic, though output may be condensed for token limits).
    5.  **Structure**:
        - Create a compelling **Title**.
        - Define a clear **Topic Theme**.
        - Include **SEO Keywords** and a **Meta Description**.
        - Break the content into clear **Sections** with **Headings** and **Content Items** (paragraphs or lists).

    Structure the JSON output as a single blog post object following the schema provided.
    Output only the structured JSON.
    `,
});


// --- Billboard Ad dedicated prompt (structured output) ---
const billboardPrompt = ai.definePrompt({
    name: 'generateBillboardAdPrompt',
    input: { schema: GenerateMarketingCopyInputSchema },
    output: { schema: z.object({
        marketingCopy: BillboardAdStructureSchema,
        imageSuggestion: z.string().optional(),
        imageSuggestions: z.array(z.string()).optional(),
    })},
    prompt: `You are a legendary billboard ad creator, channeling David Ogilvy (for concise, benefit-driven copy that captures attention instantly), Dan Kennedy (for direct-response messaging that provokes action), and Gary Halbert (for clever, provocative headlines that stand out). Generate a standout billboard ad concept for the client, crafted to deliver high-impact, memorable content that stops traffic and drives results.

    CRITICAL CONTEXT: This billboard will be read by drivers at 40-65 mph. They have roughly 5-7 seconds of viewing time. Every extra word KILLS readability. Brevity is not optional — it is the #1 success factor.

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

    {{#if websiteUrl}}
    FACTUAL BUSINESS DATA — Use these EXACTLY as provided. NEVER fabricate, guess, or modify URLs, phone numbers, or addresses:
    - Website URL: {{websiteUrl}} (use this EXACT URL if a URL is needed — do NOT invent a different one)
    {{#if businessPhone}}
    - Business Phone: {{businessPhone}} (use this EXACT phone number if a phone number is needed)
    {{/if}}
    {{/if}}

    STRICT WORD COUNT RULES — HARD LIMITS (violating these means FAILURE):
    - headline: 4-7 words MAXIMUM. Aim for 4-6. A punchy phrase, NOT a sentence. Count every word before outputting.
    - subheadline: 4-8 words MAXIMUM. A short phrase, NOT a full sentence. If you write 9+ words, REWRITE.
    - cta: 2-5 words MAXIMUM. Direct action (e.g., "Visit acme.com", "Call 555-1234").
    - visualNotes: 1-2 sentences MAXIMUM. Brief direction on colors/imagery.
    - overallConcept: 1 sentence MAXIMUM. Layout strategy in under 15 words.

    SELF-CHECK: Before outputting, count the words in headline, subheadline, and cta. If ANY exceeds its limit, rewrite it shorter. Shorter is ALWAYS better for billboards.

    {{#if numberOfImageVariations}}
    IMAGE DIRECTION: Generate {{numberOfImageVariations}} image prompts for the 'imageSuggestions' array. Each must describe a CLEAN, MINIMAL billboard BACKGROUND image — NOT a busy illustration. The image will have TEXT OVERLAID on top of it. Requirements:
    - MUST be a wide LANDSCAPE orientation with approximately 3:1 width-to-height ratio (billboard proportions)
    - Simple, abstract, or subtly textured backgrounds (gradients, bokeh, solid colors with subtle patterns)
    - Large areas of negative space where headline text can sit
    - NO text, words, letters, numbers, or logos baked into the image
    - NO busy illustrations, charts, graphs, or detailed scenes
    - High contrast zones suitable for white or dark text overlay
    - Think: professional stock photo backgrounds, atmospheric textures, or wide panoramic color fields
    - Start each prompt with "A wide panoramic landscape-format image" to enforce orientation
    {{else}}
    IMAGE DIRECTION: Generate 1 image prompt for the 'imageSuggestion' field. It must describe a CLEAN, MINIMAL billboard BACKGROUND image — NOT a busy illustration. The image will have TEXT OVERLAID on top of it. Requirements:
    - MUST be a wide LANDSCAPE orientation with approximately 3:1 width-to-height ratio (billboard proportions)
    - Simple, abstract, or subtly textured background (gradient, bokeh, solid color with subtle pattern)
    - Large areas of negative space where headline text can sit
    - NO text, words, letters, numbers, or logos baked into the image
    - NO busy illustrations, charts, graphs, or detailed scenes
    - High contrast zones suitable for white or dark text overlay
    - Think: professional stock photo background, atmospheric texture, or wide panoramic color field
    - Start the prompt with "A wide panoramic landscape-format image" to enforce orientation
    {{/if}}
    Output only the structured JSON.
    `,
});

// --- Display Ad Copy dedicated prompt (structured output: array of 3-5 variations) ---
const displayAdPrompt = ai.definePrompt({
    name: 'generateDisplayAdCopyPrompt',
    input: { schema: GenerateMarketingCopyInputSchema },
    output: { schema: z.object({
        marketingCopy: z.array(DisplayAdVariationSchema).describe('An array of 3-5 display ad copy variations.'),
        imageSuggestion: z.string().optional(),
        imageSuggestions: z.array(z.string()).optional(),
    })},
    prompt: `You are a top display ad copywriter, drawing from Joanna Wiebe (for persuasive, tested variations that maximize clicks), Lianna Patch (for humorous, targeted ads that boost engagement), and Neville Medhora (for short-form copy that excels in ad networks with A/B insights). Create 3-5 standout display ad copy variations for the client, crafted to grab attention, resonate, and convert in digital spaces.

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

    {{#if websiteUrl}}
    FACTUAL BUSINESS DATA — Use these EXACTLY as provided. NEVER fabricate, guess, or modify URLs, phone numbers, or addresses:
    - Website URL: {{websiteUrl}} (use this EXACT URL if a URL is needed — do NOT invent a different one)
    {{#if businessPhone}}
    - Business Phone: {{businessPhone}} (use this EXACT phone number if a phone number is needed)
    {{/if}}
    If no URL or phone is provided above, do NOT make one up. Simply omit it.
    {{/if}}

    Return a JSON object with 'marketingCopy' as an array of 3-5 variation objects. Each object must have:
    - headline: Short, attention-grabbing phrase (under 10 words).
    - body: 1-2 sentences of persuasive detail.
    - cta: Urgent, action-oriented button text.
    - visualNotes: Suggest imagery or layout for the ad.

    Keep it concise, benefit-focused, and optimized for clicks.
    {{#if numberOfImageVariations}}
    You MUST also generate {{numberOfImageVariations}} creative and descriptive prompts for different image variations for A/B testing and return them in the 'imageSuggestions' array. Each image prompt should offer a unique visual approach.
    {{else}}
    You MUST also generate a creative and descriptive prompt for a relevant image and return it in the 'imageSuggestion' field.
    {{/if}}
    Output only the structured JSON.
    `,
});


// --- Website Landing Page dedicated prompt (structured output) ---
const websiteLandingPagePrompt = ai.definePrompt({
    name: 'generateWebsiteLandingPagePrompt',
    input: { schema: GenerateMarketingCopyInputSchema },
    output: { schema: z.object({ marketingCopy: LandingPageSchema }) },
    prompt: `You are an elite landing page copywriter, channeling the expertise of Joanna Wiebe (for data-driven, conversion-focused copy), Peep Laja (for CRO-optimized page structures), and Donald Miller (for StoryBrand clarity frameworks). Your goal is to create a high-conversion landing page that drives a SINGLE clear action.

    CRITICAL: This is a focused landing page, NOT a full website. Every word must push toward ONE conversion goal.

    Business Context:
    - Company: {{companyName}}
    - Product/Service: {{productDescription}}
    {{#if tone}}
    - Tone: {{tone}}
    {{/if}}
    - Keywords: {{keywords}}
    {{#if additionalInstructions}}
    - Additional instructions: {{additionalInstructions}}
    {{/if}}

    {{#if websiteUrl}}
    FACTUAL BUSINESS DATA — Use these EXACTLY as provided. NEVER fabricate, guess, or modify URLs, phone numbers, or addresses:
    - Website URL: {{websiteUrl}} (use this EXACT URL if a URL is needed — do NOT invent a different one)
    {{#if businessPhone}}
    - Business Phone: {{businessPhone}} (use this EXACT phone number if a phone number is needed)
    {{/if}}
    If no URL or phone is provided above, do NOT make one up. Simply omit it.
    {{/if}}

    LANDING PAGE STRUCTURE:
    1. **Hero Section**: High-impact headline (benefit-driven, under 10 words), supporting subheadline, primary CTA button
    2. **Problem Statement**: Articulate the audience's pain point with empathy
    3. **Solution Overview**: Position the product/service as the answer
    4. **Features/Benefits**: 3-5 key features with benefit-focused descriptions
    5. **Social Proof**: Testimonial, stat, or trust signal
    6. **Urgency Element**: Create urgency or scarcity
    7. **Final CTA**: Reinforce the single conversion action

    REQUIREMENTS:
    - Single CTA repeated throughout (hero + final)
    - Copy should be scannable (short paragraphs, benefit-focused)
    - Include SEO meta title (under 60 chars) and meta description (under 160 chars) 
    - Include design/layout recommendations

    Output only the structured JSON.
    `,
});

// --- Website Standard 5-Page prompt (structured output) ---
const websiteStandard5PagePrompt = ai.definePrompt({
    name: 'generateWebsiteStandard5PagePrompt',
    input: { schema: GenerateMarketingCopyInputSchema },
    output: { schema: z.object({ marketingCopy: z.array(WebsitePageSchema) }) },
    prompt: `You are an elite website copywriter, channeling Joanna Wiebe (for conversion-focused writing), Ann Handley (for audience-centric storytelling), and Jacob McMillen (for persuasive B2B/SaaS copy). Create comprehensive website copy for a standard 5-page website.

    Business Context:
    - Company: {{companyName}}
    - Product/Service: {{productDescription}}
    {{#if tone}}
    - Tone: {{tone}}
    {{/if}}
    - Keywords: {{keywords}}
    {{#if additionalInstructions}}
    - Additional instructions: {{additionalInstructions}}
    {{/if}}

    {{#if websiteUrl}}
    FACTUAL BUSINESS DATA — Use these EXACTLY as provided:
    - Website URL: {{websiteUrl}}
    {{#if businessPhone}}
    - Business Phone: {{businessPhone}}
    {{/if}}
    If no URL or phone is provided above, do NOT make one up. Simply omit it.
    {{/if}}

    PAGES TO CREATE (5 pages total):
    1. **Home** (/) — Hero section, value proposition, key features/benefits, social proof, CTA
    2. **About** (/about) — Company story, mission/vision, team overview, trust elements
    3. **Services** (/services) — Service/product offerings with descriptions, benefits, pricing hints
    4. **Contact** (/contact) — Contact form intro, location/hours, phone/email, map placeholder
    {{#if websiteFlexPage}}
    5. **{{websiteFlexPage}}** (/{{websiteFlexPage}}) — Content tailored to a {{websiteFlexPage}} page
    {{else}}
    5. **Blog** (/blog) — Blog landing page with featured post teasers, categories, subscription CTA
    {{/if}}

    FOR EACH PAGE:
    - Include 3-6 content sections in logical order
    - Each section needs: sectionType, heading, bodyContent, and optional CTA
    - Include SEO meta title (under 60 chars) and meta description (under 160 chars)
    - Copy should be scannable, benefit-focused, and conversion-oriented
    - Ensure consistent brand voice across all pages

    Output EXACTLY 5 page objects in the JSON array.
    `,
});

// --- Website Landing Page Wireframe prompt (structured output) ---
const websiteLandingPageWireframePrompt = ai.definePrompt({
    name: 'generateWebsiteLandingPageWireframePrompt',
    input: { schema: GenerateMarketingCopyInputSchema },
    output: { schema: z.object({ marketingCopy: WireframeSiteSchema }) },
    prompt: `You are a premier UX/UI strategist, embodying Don Norman (for user-centered design), Jakob Nielsen (for usability), and Aurélien Salomon (for high-fidelity wireframes). Generate a detailed wireframe for a high-conversion landing page.

    Business Context:
    - Company: {{companyName}}
    - Product/Service: {{productDescription}}
    {{#if tone}}
    - Tone: {{tone}}
    {{/if}}
    - Keywords: {{keywords}}
    {{#if additionalInstructions}}
    - Additional instructions: {{additionalInstructions}}
    {{/if}}

    WIREFRAME STRUCTURE:
    Create a single-page wireframe with these sections:
    1. **Navigation**: Minimal — logo + single CTA button
    2. **Hero Banner**: Full-width, headline placeholder, subheadline, CTA button
    3. **Problem/Solution Block**: Two-column or stacked layout
    4. **Features Grid**: 3-5 feature cards with icon placeholders
    5. **Social Proof**: Testimonial slider or stats bar
    6. **Final CTA Block**: Full-width with urgency copy + button
    7. **Footer**: Minimal — copyright + privacy link

    Include:
    - Site navigation (minimal for landing page)
    - Footer structure
    - Design system recommendations (colors, typography, spacing)
    - User flow notes (conversion path from hero CTA to thank-you page)

    Each section should include layout type, content placeholder, functional notes, and design specs.
    Output only the structured JSON.
    `,
});

// --- Website Standard 5-Page Wireframe prompt (structured output) ---
const websiteStandard5PageWireframePrompt = ai.definePrompt({
    name: 'generateWebsiteStandard5PageWireframePrompt',
    input: { schema: GenerateMarketingCopyInputSchema },
    output: { schema: z.object({ marketingCopy: WireframeSiteSchema }) },
    prompt: `You are a premier UX/UI strategist, embodying Don Norman (for user-centered design), Jakob Nielsen (for usability), and Aurélien Salomon (for high-fidelity wireframes). Generate a detailed wireframe for a standard 5-page website.

    Business Context:
    - Company: {{companyName}}
    - Product/Service: {{productDescription}}
    {{#if tone}}
    - Tone: {{tone}}
    {{/if}}
    - Keywords: {{keywords}}
    {{#if additionalInstructions}}
    - Additional instructions: {{additionalInstructions}}
    {{/if}}

    PAGES TO WIREFRAME (5 pages total):
    1. **Home** (/) — Hero banner, features grid, testimonials, CTA block
    2. **About** (/about) — Story section, team grid, mission/values, trust badges
    3. **Services** (/services) — Service cards, comparison table placeholder, CTA
    4. **Contact** (/contact) — Contact form, map placeholder, business hours, social links
    {{#if websiteFlexPage}}
    5. **{{websiteFlexPage}}** (/{{websiteFlexPage}}) — Layout tailored to a {{websiteFlexPage}} page
    {{else}}
    5. **Blog** (/blog) — Featured post, post grid, categories sidebar, newsletter signup
    {{/if}}

    Include:
    - Site navigation with menu items for all 5 pages
    - Footer with columns (Company, Resources, Contact, Social)
    - Design system (color scheme, typography, spacing)
    - User flow notes (primary conversion paths, accessibility considerations)

    Each page should have 3-6 wireframe sections with layout type, content placeholder, functional notes, and design specs.
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

  {{#if websiteUrl}}
  FACTUAL BUSINESS DATA — Use these EXACTLY as provided. NEVER fabricate, guess, or modify URLs, phone numbers, or addresses:
  - Website URL: {{websiteUrl}} (use this EXACT URL if a URL is needed — do NOT invent a different one)
  {{#if businessPhone}}
  - Business Phone: {{businessPhone}} (use this EXACT phone number if a phone number is needed)
  {{/if}}
  If no URL or phone is provided above, do NOT make one up. Simply omit it.
  {{/if}}

  {{#if isRadioScript}}
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
            isLeadGenerationEmail: input.contentType === "lead generation email",
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
          if (input.blogFormat === 'single') {
              const { output } = await blogPostSinglePrompt(input);
              if (!output) {
                  throw new Error("The AI failed to generate the blog post.");
              }
              console.log('[MktgCopy Flow] Generated single blog post');
              // Ensure no image suggestion for blog posts
              return { marketingCopy: output.marketingCopy, imageSuggestion: undefined };
          } else {
              // Default to series prompt if format is 'series' or unspecified (though form should specify)
              const { output } = await blogPostSeriesPrompt(input);
              if (!output) {
                  throw new Error("The AI failed to generate the blog post series.");
              }
              console.log('[MktgCopy Flow] Generated blog post series');
              // Ensure no image suggestion for blog posts
              return { marketingCopy: output.marketingCopy, imageSuggestion: undefined };
          }
      }

      // Isolate billboard ad generation for its structured JSON output
      if (input.contentType === "billboard") {
          const { output } = await billboardPrompt(input);
          if (!output) {
              throw new Error("The AI failed to generate the billboard ad.");
          }
          console.log('[MktgCopy Flow] Generated structured billboard ad');
          return output;
      }

      // Isolate display ad copy generation for its structured JSON output (array of variations)
      if (input.contentType === "display ad copy") {
          const { output } = await displayAdPrompt(input);
          if (!output) {
              throw new Error("The AI failed to generate display ad copy.");
          }
          console.log('[MktgCopy Flow] Generated structured display ad copy with', Array.isArray(output.marketingCopy) ? output.marketingCopy.length : 0, 'variations');
          return output;
      }

      // Website Copy — route to landing page or standard 5-page prompt
      if (input.contentType === "website copy") {
          if (input.websiteCopyType === 'landing_page') {
              const { output } = await websiteLandingPagePrompt(input);
              if (!output) {
                  throw new Error("The AI failed to generate the landing page copy.");
              }
              console.log('[MktgCopy Flow] Generated structured landing page copy');
              return { marketingCopy: output.marketingCopy, imageSuggestion: undefined };
          } else {
              // Default to standard 5-page
              const { output } = await websiteStandard5PagePrompt(input);
              if (!output) {
                  throw new Error("The AI failed to generate the website copy.");
              }
              console.log('[MktgCopy Flow] Generated structured 5-page website copy with', Array.isArray(output.marketingCopy) ? output.marketingCopy.length : 0, 'pages');
              return { marketingCopy: output.marketingCopy, imageSuggestion: undefined };
          }
      }

      // Website Wireframe — route to landing page or standard 5-page wireframe prompt
      if (input.contentType === "website wireframe") {
          if (input.websiteCopyType === 'landing_page') {
              const { output } = await websiteLandingPageWireframePrompt(input);
              if (!output) {
                  throw new Error("The AI failed to generate the landing page wireframe.");
              }
              console.log('[MktgCopy Flow] Generated structured landing page wireframe');
              return { marketingCopy: output.marketingCopy, imageSuggestion: undefined };
          } else {
              // Default to standard 5-page wireframe
              const { output } = await websiteStandard5PageWireframePrompt(input);
              if (!output) {
                  throw new Error("The AI failed to generate the website wireframe.");
              }
              console.log('[MktgCopy Flow] Generated structured 5-page website wireframe');
              return { marketingCopy: output.marketingCopy, imageSuggestion: undefined };
          }
      }
      
      // For all other content types, use the generic prompt
      const promptData = {
        ...input,
        currentYear: new Date().getFullYear().toString(),
        isRadioScript: input.contentType === "radio script",
        isTvScript: input.contentType === "tv script",
        isLeadGenerationEmail: input.contentType === "lead generation email",
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
