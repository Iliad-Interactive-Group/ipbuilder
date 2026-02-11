
'use server';
/**
 * @fileOverview AI agent that generates audio from text using a TTS model.
 *
 * - generateAudio - A function that generates a WAV audio file.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const GenerateAudioInputSchema = z.string().describe('The text script to convert to speech.');
const GenerateAudioOutputSchema = z.string().describe('The generated audio as a WAV data URI.');

export async function generateAudio(script: string): Promise<string> {
    return generateAudioFlow(script);
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
  async (script: string) => {
    
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            // Using a prebuilt professional voice. This can be changed to other available voices.
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: script,
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
