
'use server';
/**
 * @fileOverview AI agent that generates audio from text using a TTS model.
 *
 * - generateAudio - A function that generates a WAV audio file.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import wav from 'wav';

const GenerateAudioInputSchema = z.object({
  script: z.string().describe('The text script to convert to speech.'),
  voiceName: z.string().optional().describe('The specific voice name to use (e.g., "Algenib", "Kore", "Puck"). Defaults to "Algenib" if not specified.'),
});
const GenerateAudioOutputSchema = z.string().describe('The generated audio as a WAV data URI.');

export async function generateAudio(input: { script: string; voiceName?: string }): Promise<string> {
    return generateAudioFlow(input);
}

// Helper function to convert raw PCM audio data from the model to a browser-compatible WAV format.
async function toWav(pcmData: Buffer, channels = 1, rate = 24000, sampleWidth = 2): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', (d: Buffer) => bufs.push(d));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));

    writer.write(pcmData);
    writer.end();
  });
}

const generateAudioFlow = ai.defineFlow(
  {
    name: 'generateAudioFlow',
    inputSchema: GenerateAudioInputSchema,
    outputSchema: GenerateAudioOutputSchema,
  },
  async (input: { script: string; voiceName?: string }) => {
    // Default to 'Algenib' (male gravelly voice) if no voice specified
    const voiceName = input.voiceName || 'Algenib';
    
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            // Using a prebuilt professional voice. This can be changed to other available voices.
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
      prompt: input.script,
    });

    if (!media) {
      throw new Error("The AI failed to generate audio.");
    }

    // The model returns raw PCM data in a data URI. We need to extract it and convert it to WAV.
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    
    const wavBase64 = await toWav(audioBuffer);
    
    return `data:audio/wav;base64,${wavBase64}`;
  }
);
