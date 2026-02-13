'use server';

/**
 * @fileOverview Server actions for AI generation
 * This file contains server-side wrappers for all Genkit flows to prevent
 * exposing AI logic and credentials to the client.
 */

import { generateMarketingCopy } from '@/ai/flows/generate-marketing-copy';
import type { GenerateMarketingCopyInput, GenerateMarketingCopyOutput } from '@/ai/flows/generate-marketing-copy';
import { generateImage } from '@/ai/flows/generate-image-flow';
import { generateAudio } from '@/ai/flows/generate-audio-flow';

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
