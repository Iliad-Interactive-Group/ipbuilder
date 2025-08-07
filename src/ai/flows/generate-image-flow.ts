
'use server';
/**
 * @fileOverview AI agent that generates an image from a text prompt.
 *
 * - generateImage - A function that generates an image.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
  async (prompt) => {
    
    const {media} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: prompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
    });

    const imageUrl = media.url;

    if (!imageUrl) {
        throw new Error("The AI failed to generate an image.");
    }
    
    return imageUrl;
  }
);
