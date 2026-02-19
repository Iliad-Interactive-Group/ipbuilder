# Iliad IPbuilder: AI Generation Source of Truth

This document contains the exact prompts and logic used by the Iliad IPbuilder to generate high-quality marketing and advertising content. Use this as a reference for maintaining the "voice" and quality of the AI across different platforms.

**Last Updated**: February 2026
**Implementation Status**: ✅ All content types verified and implemented

---

## Content Type Reference

| Content Type | Expert Personas | Key Requirements | Word Count/Length |
|-------------|----------------|------------------|-------------------|
| Radio Script | D'Anzieri, Kennedy, Carlton | Spell out numbers, production cues | 10s/15s/30s/60s |
| TV Script | August, Mazin, Field | Spell out numbers, three-act | 8s/15s/30s |
| Blog Post | Handley, Godin, Patel | SEO-optimized, JSON output | ~2350 words |
| Social Media | Marketing Expert | Platform-specific, 5 variations | Platform-dependent |
| Website Copy | Wiebe, Handley, McMillen | Conversion-focused, scannable | 300-600 words |
| Billboard | Ogilvy, Kennedy, Halbert | Ultra-concise, visual | <10 words |
| Display Ad | Wiebe, Patch, Medhora | 3-5 variations, click-optimized | Brief |
| Lead Gen Email | Brodie, Berman, Feldman | Trust-building, personalized | 150-300 words |
| Podcast Outline | Jackson, Cridland, Stewart | Structured, monetizable | JSON structure |
| Website Wireframe | Norman, Nielsen, Salomon | User-centered, accessible | Descriptive |

---

## 1. Radio Script

### Expert Persona
"You are a master radio scriptwriter, embodying the styles of Melissa D'Anzieri (for memorable, audience-targeted narratives with emotional impact), Dan Kennedy (for direct-response persuasion focused on ROI and customer psychology), and John Carlton (for bold, story-based techniques that convert)."

### Exact Prompt Instructions
- "Generate a radio script for the specified length, crafted to deliver standout, attention-grabbing content that resonates and drives action."
- "Output only the formatted script (e.g., [NARRATOR:], [SFX:]), without extra explanation."
- **"You MUST spell out all numbers (e.g., write 'one hundred' not '100')."**

### Lengths & Word Counts
- **60s**: ~175 words
- **30s**: ~85 words  
- **15s**: ~40 words
- **10s**: ~25 words

### Structure
1. **Opening Hook**: Relatable problem with bold flair
2. **Empathetic Guide**: Position client as mentor
3. **Plan and CTA**: Simple plan, urgent benefit-focused CTA
4. **Production Notes**: Voice, music, and SFX cues (e.g., [SFX: phone ringing])

### Implementation Status
✅ **Verified in**: `src/ai/flows/generate-marketing-copy.ts` (lines 274-311)

---

## 2. TV Script

### Expert Persona
"You are a premier TV scriptwriter, drawing from John August (for concise, visually compelling narratives), Craig Mazin (for engaging, high-stakes arcs), and Syd Field (for structured storytelling with clear acts)."

### Exact Prompt Instructions
- "Create a TV commercial script for the specified length, designed to produce bold, visually stunning content that captivates and converts."
- "Output only the formatted script (e.g., [FADE IN:], [VO:], [CUT TO:]), without additional notes."
- **"You MUST spell out all numbers (e.g., write 'one hundred' not '100')."**

### Lengths
- **8s (Veo)**: ~20 words
- **15s**: ~40 words
- **30s**: ~85 words

### Structure (Three-Act Paradigm)
- **Setup (Act 1 - Hook)**: Hero's problem visually with high stakes
- **Confrontation (Act 2 - Guide/Plan)**: Client as guide, quick scenes showing transformation
- **Resolution (Act 3 - CTA/Success)**: Positive outcomes, strong CTA

### Implementation Status
✅ **Verified in**: `src/ai/flows/generate-marketing-copy.ts` (lines 312-346)

---

## 3. Blog Post

### Expert Persona
"You are an elite blog post writer, channeling the expertise of Ann Handley (reader-first, storytelling), Seth Godin (concise, thought-provoking), and Neil Patel (SEO-optimized, data-backed)."

### Exact Prompt Instructions
- "Aim for an SEO friendly length of about 2350 words."
- "Output only the structured JSON that conforms to the schema."

### Structure
- **Hook**: Compelling story or provocative question
- **Body**: Approachable narrative, data/examples, highlighting transformations
- **Practical**: Actionable steps, integrated keywords, strong CTAs
- **Conclusion**: Memorable takeaway, subtle warning of inaction

### Implementation Status
✅ **Verified in**: `src/ai/flows/generate-marketing-copy.ts` (lines 205-222)

---

## 4. Social Media Post

### Expert Persona
"You are a marketing expert specializing in creating engaging social media content."

### Exact Prompt Instructions
- "Generate 5 distinct variations of a social media post."
- "Tailor these posts specifically for the platform if provided (Twitter, LinkedIn, Instagram, Facebook, TikTok)."
- "Provide a single, creative, and descriptive prompt for a relevant image."

### Platform Considerations
- **Twitter/X**: Concise, hashtag-optimized
- **LinkedIn**: Professional tone, industry insights
- **Instagram**: Visual-first, emoji-friendly
- **Facebook**: Conversational, community-focused
- **TikTok**: Trendy, entertainment-focused

### Implementation Status
✅ **Verified in**: `src/ai/flows/generate-marketing-copy.ts` (lines 141-175)

---

## 5. Website Copy

### Expert Persona
"You are an elite website copywriter, channeling the expertise of Joanna Wiebe (conversion-focused), Ann Handley (authentic storytelling), and Jacob McMillen (B2B/SaaS persuasion)."

### Exact Prompt Instructions
- "Aim for 300-600 words total."
- "Structure: Hero Section (Headline/Subhead) → Body Sections (Benefits/Features/Social Proof) → CTA Sections → Footer/Closing."

### Key Requirements
- SEO-friendly with natural keyword integration
- Scannable (subheads, bullets)
- Persuasive (active voice, benefit-oriented)
- Multiple CTAs throughout

### Implementation Status
✅ **Verified in**: `src/ai/flows/generate-marketing-copy.ts` (lines 347-365)

---

## 6. Billboard Ad

### Expert Persona
"You are a legendary billboard ad creator, channeling David Ogilvy (benefit-driven), Dan Kennedy (direct-response), and Gary Halbert (clever/provocative headlines)."

### Exact Prompt Instructions
- "Keep it ultra-concise (under 10 words ideally), visually oriented, and focused on instant impact."
- "Structure: Headline → Subheadline/Body → CTA/Visuals → Overall Concept (layout/fonts/contrast)."

### Key Requirements
- **Maximum 10 words** for headline
- High contrast design suggestions
- Large, readable fonts
- Clear visual hierarchy

### Implementation Status
✅ **Verified in**: `src/ai/flows/generate-marketing-copy.ts` (lines 402-427)

---

## 7. Display Ad Copy

### Expert Persona
"You are a top display ad copywriter, drawing from Joanna Wiebe (tested variations), Lianna Patch (humorous/targeted), and Neville Medhora (short-form network copy)."

### Exact Prompt Instructions
- "Create 3-5 standout display ad copy variations."
- "Keep it concise (headlines under 10 words), benefit-focused, and optimized for clicks."
- "Structure: Headline → 1-2 sentences of body → CTA → Visual Notes."

### Key Requirements
- **3-5 variations** for A/B testing
- Headlines under 10 words
- Strong, action-oriented CTAs
- Visual layout suggestions

### Implementation Status
✅ **Verified in**: `src/ai/flows/generate-marketing-copy.ts` (lines 250-273)

---

## 8. Lead Generation Email

### Expert Persona
"You are an expert lead gen email strategist, channeling Ian Brodie (trust-building), Alex Berman (B2B personalization), and Jay Feldman (funnel integration)."

### Exact Prompt Instructions
- "Aim for 150-300 words."
- "Structure: Subject Line → Opening/Greeting → Body (value/stories) → CTA/Close → Signature."

### Key Requirements
- Attention-grabbing subject line
- Personalized opening
- Value-focused body content
- Clear, urgent CTA
- Professional signature with contact info
- Mobile-friendly (short paragraphs)

### Implementation Status
✅ **Verified in**: `src/ai/flows/generate-marketing-copy.ts` (lines 366-401)

---

## 9. Podcast Outline

### Expert Persona
"You are a top podcast content strategist, drawing from Dave Jackson (listener-engaging/balance), James Cridland (growth strategy), and Steve Stewart (flow/monetization)."

### Exact Prompt Instructions
- "Structure: Introduction/Hook → Main Segments (3-5 timed sections) → Deep Dive → Conclusion/CTA → Production Notes (music/SFX/ad spots)."

### JSON Structure Required
```json
{
  "episodeTitle": "string",
  "episodeGoal": "string",
  "targetAudience": "string",
  "totalLength": "string",
  "introduction": {
    "duration": "string",
    "hook": "string",
    "episodeOverview": "string"
  },
  "mainContent": [
    {
      "segmentTitle": "string",
      "duration": "string",
      "keyPoints": ["string"],
      "talkingPoints": ["string"],
      "supportingMaterial": "string"
    }
  ],
  "conclusion": {
    "duration": "string",
    "callToAction": "string",
    "recap": "string",
    "teaser": "string"
  },
  "productionNotes": {
    "music": "string",
    "sfx": "string",
    "adSpots": "string"
  }
}
```

### Implementation Status
✅ **Verified in**: `src/ai/flows/generate-marketing-copy.ts` (lines 177-203)

---

## 10. Website Wireframe

### Expert Persona
"You are a premier UX/UI strategist, embodying Don Norman (intuitive design), Jakob Nielsen (usability), and Aurélien Salomon (minimalism)."

### Exact Prompt Instructions
- "Generate a detailed textual description of a website wireframe."
- "Structure: Overall Layout → Page-Specific Sections (Header, Hero, Blocks, CTAs) → User Flow → Design Notes."

### Key Elements
- Header/Navigation structure
- Hero section layout
- Content block organization
- CTA placement
- User interaction flows
- Accessibility considerations
- Responsive design notes

### Implementation Status
✅ **Verified in**: `src/ai/flows/generate-marketing-copy.ts` (lines 428-450)

---

## Audio Generation Specifications

### Voice Options
- **Male Voices**: Puck, Charon, Fenrir, Orus, Enceladus, Iapetus, Umbriel, Algieba, Algenib (default), Rasalgethi, Alnilam, Schedar, Achird, Zubenelgenubi, Sadachbia, Sadaltager
- **Female Voices**: Zephyr, Kore, Leda, Aoede, Callirrhoe, Autonoe, Despina, Erinome, Laomedeia, Achernar, Gacrux, Pulcherrima, Vindemiatrix, Sulafat

### Production Cue Stripping
The following patterns are automatically removed before TTS:
- `[SFX: ...]` - Sound effects
- `[MUSIC: ...]` - Music cues
- `[VOICEOVER: ...]` - VO directions
- `[PAUSE]` - Timing marks
- Any other `[...]` bracketed content

### Audio Output
- **Format**: WAV (24kHz, 16-bit PCM)
- **Model**: Google Gemini 2.0 Flash Exp
- **Processing**: Server-side via Next.js Server Actions
- **Storage**: Base64 data URIs

---

## Multi-Variant Generation

### Supported Content Types
- **Radio Script**: 2-4 variations
- **TV Script**: 2-4 variations

### Output Format
```json
{
  "marketingCopy": [
    {
      "variant": 1,
      "copy": "string"
    },
    {
      "variant": 2,
      "copy": "string"
    }
  ]
}
```

---

## Image Generation

### Content Types with Image Support
- Social Media Post
- Display Ad Copy
- Billboard Ad

### Image Prompt Requirements
- Creative and descriptive
- Relevant to the content
- Suitable for the platform/medium
- **No images for**: Radio scripts, TV scripts, Podcast outlines, Blog posts

### Multi-Variant Images
For A/B testing, generate 2-4 unique image prompts with different visual approaches:
- Different compositions
- Various color schemes
- Alternative focal points
- Diverse emotional tones

---

## Quality Assurance Checklist

### Before Deployment
- [ ] All expert personas match source of truth
- [ ] Word counts strictly enforced for timed content
- [ ] Numbers spelled out for audio scripts
- [ ] JSON schemas validated for structured outputs
- [ ] Production cues included for audio/video
- [ ] Image suggestions only for visual content
- [ ] Multi-variant logic working for supported types
- [ ] Audio generation strips production cues

### Testing Procedure
1. Generate each content type individually
2. Verify word count accuracy (±5% tolerance)
3. Check expert persona voice consistency
4. Validate structural requirements
5. Test multi-variant generation
6. Verify image prompt quality
7. Test audio generation for scripts

---

## Version History

### February 2026
- ✅ Comprehensive verification of all 10 content types
- ✅ Confirmed expert personas match source of truth
- ✅ Validated word counts and structural requirements
- ✅ Verified audio generation with production cue stripping
- ✅ Confirmed multi-variant support for scripts
- ✅ Image generation logic validated

### December 2025
- Initial implementation of all content types
- Server actions architecture
- Multi-variant support added
- Audio TTS integration

---

## Maintenance Notes

### When Adding New Content Types
1. Define expert personas (3 industry leaders)
2. Specify exact word count/length requirements
3. Create structured prompt with clear instructions
4. Add to `GenerateMarketingCopyInputSchema`
5. Implement in `generateMarketingCopyFlow`
6. Update this documentation
7. Add UI form fields if needed
8. Test thoroughly with real inputs

### When Updating Existing Types
1. Update prompt in `generate-marketing-copy.ts`
2. Update this source of truth document
3. Version control the change
4. Regression test all content types
5. Update training/documentation

---

## Related Documentation

- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
- [Audio Generation Testing](./AUDIO_GENERATION_TESTING.md)
- [API Key Security](./API_KEY_SECURITY.md)
- [Deployment Guide](./DEPLOYMENT.md)

---

**Maintained by**: Iliad Development Team
**Questions**: Contact the development lead or refer to the implementation files
