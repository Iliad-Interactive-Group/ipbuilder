
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
    
    console.log('[Audio Flow] Starting audio generation with:', {
      scriptLength: input.script.length,
      voiceName,
      scriptPreview: input.script.substring(0, 100) + '...'
    });
    
    try {
      const result = await ai.generate({
        model: 'googleai/gemini-2.0-flash-exp',
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
        prompt: input.script,
      });

      console.log('[Audio Flow] Generation response:', {
        hasMedia: !!result.media,
        mediaUrl: result.media?.url?.substring(0, 50) + '...',
        mediaContentType: result.media?.contentType
      });

      if (!result.media) {
        console.error('[Audio Flow] No media in response:', result);
        throw new Error("The AI failed to generate audio. No media returned.");
      }

      // The model returns raw PCM data in a data URI. We need to extract it and convert it to WAV.
      const audioBuffer = Buffer.from(
        result.media.url.substring(result.media.url.indexOf(',') + 1),
        'base64'
      );
      
      console.log('[Audio Flow] Audio buffer size:', audioBuffer.length);
      
      if (audioBuffer.length === 0) {
        throw new Error("Generated audio buffer is empty");
      }
      
      const wavBase64 = await toWav(audioBuffer);
      
      console.log('[Audio Flow] WAV conversion complete. Base64 length:', wavBase64.length);
      
      return `data:audio/wav;base64,${wavBase64}`;
    } catch (error) {
      console.error('[Audio Flow] Error during generation:', error);
      throw error;
    }
  }
);
