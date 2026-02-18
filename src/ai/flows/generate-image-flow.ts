
'use server';
/**
 * @fileOverview AI agent that generates an image from a text prompt.
 *
 * - generateImage - A function that generates an image.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GenerateImageInputSchema = z.string().describe('The text prompt for image generation.');
const GenerateImageOutputSchema = z.string().describe('The generated image as a data URI.');

export async function generateImage(prompt: string): Promise<string> {
    return generateImageFlow(prompt);
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (prompt: string) => {
    
    const {media} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: prompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
    });

    if (!media || !media.url) {
        throw new Error("The AI failed to generate an image.");
    }

    const imageUrl = media.url;
    
    return imageUrl;
  }
);
