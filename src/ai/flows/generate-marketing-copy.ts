
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
      'The type of content to generate (e.g., website copy, social media post, blog post, radio script, tv script, billboard, website wireframe, podcast outline).'
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
    .describe('The generated marketing copy tailored to the specified content type. If the content type is "social media post", this will contain 5 numbered variations.'),
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

  {{#if isSocialMediaPost}}
  Generate 5 distinct variations of a social media post. Each variation should be clearly numbered (e.g., 1. ..., 2. ..., etc.).
  Incorporate these keywords: {{keywords}}.
  Company Name (if provided): {{companyName}}
  Product Description (if provided): {{productDescription}}
  {{else}}
  Generate marketing copy tailored for the following content type: {{contentType}}.
  Incorporate these keywords: {{keywords}}.
  Company Name (if provided): {{companyName}}
  Product Description (if provided): {{productDescription}}
  {{/if}}

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
  {{#if isPodcastOutline}}
  Use the following template to generate the podcast outline. Fill in the bracketed placeholders with relevant content based on the provided keywords, company name, and product description.

  Podcast Episode Outline Template
  Episode Title: [Insert a catchy, descriptive title reflecting the episode’s topic or theme]

  Episode Goal: [One sentence summarizing the purpose, e.g., “Explore the impact of mindfulness on productivity with practical tips for listeners.”]

  Target Audience: [Briefly describe the intended listeners, e.g., “Busy professionals interested in personal growth.”]

  Total Length: [Target duration, e.g., 20–30 minutes]

  1. Introduction (2–3 minutes)
  Hook: [Start with an engaging question, statistic, quote, or anecdote to grab attention, e.g., “Did you know 80% of people feel overwhelmed daily?”]
  Episode Overview: [Briefly summarize what the episode covers and why it matters, e.g., “Today, we’ll dive into mindfulness techniques to boost your focus.”]
  Host Intro: [Optional: Introduce yourself or co-hosts, e.g., “I’m Jane, your guide to practical wellness.”]
  Guest Intro (if applicable): [Name, credentials, and relevance, e.g., “Joining us is Dr. Lee, a mindfulness expert.”]
  Optional: [Mention sponsors, call-to-action, or podcast context, e.g., “Part of our Wellness Series.”]

  2. Main Content (15–20 minutes)
  Break into 2–4 segments for structure and pacing. Adjust based on format (interview, solo, or narrative).

  Segment 1: [Topic or Theme] (5–7 minutes)
  Key Points: [List 2–3 main ideas, e.g., “What is mindfulness? Why it’s critical for productivity.”]
  Details/Questions: [Specific talking points or questions, e.g., “Define mindfulness in 1 minute; share a study showing its benefits.”]
  Supporting Material: [Reference data, stories, or quotes, e.g., “Harvard study: 47% of people are distracted.”]
  Transition: [How to move to the next segment, e.g., “Now that we know what mindfulness is, let’s talk about how to practice it.”]

  Segment 2: [Topic or Theme] (5–7 minutes)
  Key Points: [E.g., “Practical mindfulness exercises for daily life.”]
  Details/Questions: [E.g., “Describe a 5-minute breathing exercise; ask guest for their favorite technique.”]
  Supporting Material: [E.g., “Listener story: How Jane used mindfulness to reduce stress.”]
  Transition: [E.g., “These exercises sound simple, but what challenges might we face?”]

  Segment 3 (Optional): [Topic or Theme] (3–5 minutes)
  Key Points: [E.g., “Common obstacles and how to overcome them.”]
  Details/Questions: [E.g., “Discuss time constraints; share a tip for consistency.”]
  Supporting Material: [E.g., “Quote from a mindfulness coach.”]

  3. Listener Engagement (1–2 minutes)
  Call-to-Action: [Encourage interaction, e.g., “Try one mindfulness exercise this week and share your experience on X @OurPodcast!”]
  Feedback Prompt: [E.g., “Send us your questions for a future Q&A episode at ourwebsite.com.”]
  Community Plug: [E.g., “Join our newsletter for exclusive wellness tips.”]

  4. Conclusion (2–3 minutes)
  Recap: [Summarize key takeaways, e.g., “We learned how mindfulness boosts focus and three easy ways to start.”]
  Teaser: [Preview next episode, e.g., “Next week, we’ll explore nutrition hacks for energy.”]
  Thank You: [Acknowledge listeners, guests, or sponsors, e.g., “Big thanks to Dr. Lee and you, our listeners!”]
  Sign-Off: [Consistent closing, e.g., “Until next time, stay mindful!”]

  5. Technical Notes
  Recording Details: [E.g., “Record via Zoom; use Blue Yeti mic; check audio levels.”]
  Post-Production: [E.g., “Edit in Audacity; add intro music; publish by Friday.”]
  Show Notes: [E.g., “Include links to mindfulness resources, guest bio, and timestamps.”]

  Tips for Using This Outline
  Customize: Tailor segments to your podcast’s format (e.g., add storytelling for narrative podcasts or Q&A for interviews).
  Time Management: Stick to time estimates to maintain pacing; adjust during recording if needed.
  Flexibility: Use bullet points as a guide, not a script, to keep the conversation natural.
  Preparation: Fill in specific details (e.g., guest questions, stats) before recording to stay focused.
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
    const isPodcastOutline = input.contentType === "podcast outline";
    const isSocialMediaPost = input.contentType === "social media post";

    const promptData = {
      ...input,
      currentYear,
      isRadioScript,
      isTvScript,
      isBillboard,
      isWebsiteWireframe,
      isBlogPost,
      isPodcastOutline,
      isSocialMediaPost,
    };
    
    const {output} = await prompt(promptData);
    return output!;
  }
);

