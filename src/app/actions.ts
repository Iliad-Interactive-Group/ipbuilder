'use server';

/**
 * @fileOverview Server actions for AI generation
 * This file contains server-side wrappers for all Genkit flows to prevent
 * exposing AI logic and credentials to the client.
 */

// Validate environment variables on server startup
import '@/lib/env-validation';

import { generateMarketingCopy } from '@/ai/flows/generate-marketing-copy';
import type { GenerateMarketingCopyInput, GenerateMarketingCopyOutput } from '@/ai/flows/generate-marketing-copy';
import { generateImage } from '@/ai/flows/generate-image-flow';
import { generateAudio } from '@/ai/flows/generate-audio-flow';
import { createMarketingBriefBlueprint } from '@/ai/flows/create-marketing-brief-blueprint-flow';
import type { CreateMarketingBriefBlueprintInput, MarketingBriefBlueprint } from '@/ai/schemas/marketing-brief-schemas';

/**
 * Server action for generating marketing copy
 */
export async function generateMarketingCopyAction(
  input: GenerateMarketingCopyInput
): Promise<GenerateMarketingCopyOutput> {
  return await generateMarketingCopy(input);
}

/**
 * Server action for generating images
 */
export async function generateImageAction(prompt: string): Promise<string> {
  return await generateImage(prompt);
}

/**
 * Server action for generating audio
 */
export async function generateAudioAction(input: { script: string; voiceName?: string }): Promise<string> {
  return await generateAudio(input);
}

/**
 * Server action for creating a marketing brief blueprint
 */
export async function createMarketingBriefBlueprintAction(
  input: CreateMarketingBriefBlueprintInput
): Promise<MarketingBriefBlueprint> {
  try {
    console.log('[Blueprint Action] Starting with input:', {
      hasWebsiteUrl: !!input.websiteUrl,
      hasDocument: !!input.documentDataUri,
      hasText: !!input.rawText,
    });
    
    const result = await createMarketingBriefBlueprint(input);
    console.log('[Blueprint Action] Success:', result);
    return result;
  } catch (error) {
    console.error('[Blueprint Action] Error:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error) {
      console.error('[Blueprint Action] Stack:', error.stack);
    }
    throw error;
  }
}
