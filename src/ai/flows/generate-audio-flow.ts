
'use server';
/**
 * @fileOverview AI agent that generates audio from text using Google's Text-to-Speech.
 *
 * - generateAudio - A function that generates a WAV audio file.
 * 
 * TIMING OPTIMIZATION:
 * To keep TTS audio within target time limits (e.g., 30s for radio spots):
 * 1. Marketing copy prompts reduce word count targets by 12%
 * 2. Speech rate is set to 1.1x (10% faster) 
 * 3. This combination typically keeps ads within ±0.5s of target duration
 * 
 * IMPORTANT: Gemini's native TTS via Genkit may not be fully supported yet.
 * If audio generation fails in production, consider:
 * 1. Using Google Cloud Text-to-Speech API directly (@google-cloud/text-to-speech)
 * 2. Using ElevenLabs or other TTS services
 * 3. Waiting for official Gemini TTS support in Genkit
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import wav from 'wav';

const GenerateAudioInputSchema = z.object({
  script: z.string().describe('The text script to convert to speech.'),
  voiceName: z.string().optional().describe('The specific voice name to use (e.g., "Algenib", "Kore", "Puck"). Defaults to "Kore" if not specified.'),
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
    // Default to 'Kore' (female professional voice) if no voice specified
    const voiceName = input.voiceName || 'Kore';
    
    console.log('[Audio Flow] Starting audio generation with:', {
      scriptLength: input.script.length,
      voiceName,
      scriptPreview: input.script.substring(0, 100) + '...'
    });
    
    // Validate script length - TTS has limits
    if (input.script.length > 5000) {
      console.warn('[Audio Flow] Script too long, truncating to 5000 characters');
    }
    const scriptText = input.script.substring(0, 5000);
    
    try {
      // Attempt to use Gemini's TTS capability
      // Note: This may not work in all environments/versions of Genkit
      const result = await ai.generate({
        model: 'googleai/gemini-2.5-pro-preview-tts',
        config: {
          // Request audio output from the model
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
            // Slightly faster speech rate (1.1x) helps stay within time limits
            // This combined with word count reduction provides tight timing control
            speechRate: 1.1,
          },
        },
        prompt: scriptText,
      });

      console.log('[Audio Flow] Generation response received');
      console.log('[Audio Flow] Result object keys:', Object.keys(result));
      console.log('[Audio Flow] Result.media:', result.media);
      console.log('[Audio Flow] Full result:', JSON.stringify(result, (key, value) => {
        // Truncate large base64 strings in logging
        if (typeof value === 'string' && value.length > 200) return value.substring(0, 200) + '...';
        return value;
      }, 2));

      // Check if the model returned media content
      if (!result.media || !result.media.url) {
        console.error('[Audio Flow] No media in response. TTS may not be available.');
        throw new Error(
          "Audio generation is not currently available. " +
          "The AI model did not return audio content. " +
          "This feature requires Gemini TTS support which may not be enabled for your API key."
        );
      }

      console.log('[Audio Flow] Media content type:', result.media.contentType);

      // The model returns raw audio data in a data URI. We need to extract and convert it.
      const commaIndex = result.media.url.indexOf(',');
      if (commaIndex === -1) {
        throw new Error("Invalid audio data format received from AI model.");
      }
      
      const base64Data = result.media.url.substring(commaIndex + 1);
      const audioBuffer = Buffer.from(base64Data, 'base64');
      
      console.log('[Audio Flow] Audio buffer size:', audioBuffer.length);
      
      if (audioBuffer.length === 0) {
        throw new Error(
          "Generated audio buffer is empty. " +
          "The model configuration may not support TTS output."
        );
      }
      
      // Convert PCM to WAV format for browser compatibility
      const wavBase64 = await toWav(audioBuffer);
      
      console.log('[Audio Flow] WAV conversion complete. Output size:', wavBase64.length);
      
      return `data:audio/wav;base64,${wavBase64}`;
      
    } catch (error: unknown) {
      console.error('[Audio Flow] Error during audio generation:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Check for common error patterns and provide helpful messages
      if (errorMessage.includes('not supported') || 
          errorMessage.includes('AUDIO') || 
          errorMessage.includes('modalities')) {
        throw new Error(
          'Audio generation (TTS) is not currently supported by the AI model. ' +
          'This feature requires specific API capabilities. Please contact support.'
        );
      }
      
      if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
        throw new Error(
          'Audio generation quota exceeded. Please try again later.'
        );
      }
      
      if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
        throw new Error(
          'Audio generation authentication failed. Please check your API configuration.'
        );
      }
      
      // Re-throw with the original message for debugging
      throw new Error(`Audio generation failed: ${errorMessage}`);
    }
  }
);

export { generateAudioFlow };
