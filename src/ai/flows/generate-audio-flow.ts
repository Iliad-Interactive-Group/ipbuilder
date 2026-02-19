
'use server';
/**
 * @fileOverview AI agent that generates audio from text using Google Cloud Text-to-Speech.
 *
 * - generateAudio - A function that generates a WAV audio file using Google Cloud's TTS API.
 * 
 * TIMING OPTIMIZATION:
 * To keep TTS audio within target time limits (e.g., 30s for radio spots):
 * 1. Marketing copy prompts reduce word count targets by 12%
 * 2. Speech rate is set to 1.1x (10% faster) 
 * 3. This combination typically keeps ads within ±0.5s of target duration
 */

import TextToSpeechApi from '@google-cloud/text-to-speech';
import wav from 'wav';

const textToSpeechClient = new TextToSpeechApi.TextToSpeechClient();

// Map user-selected voice names to Google Cloud TTS Neural2 voices
// Neural2 provides 10+ distinct en-US voices for maximum variety
const VOICE_NAME_MAPPING: Record<string, string> = {
  // Male voices - Neural2
  'Puck': 'en-US-Neural2-D',
  'Charon': 'en-US-Neural2-A',
  'Fenrir': 'en-US-Neural2-J',
  'Orus': 'en-US-Neural2-D',
  'Enceladus': 'en-US-Neural2-I',
  'Iapetus': 'en-US-Neural2-A',
  'Umbriel': 'en-US-Neural2-B',
  'Algieba': 'en-US-Neural2-J',
  'Algenib': 'en-US-Neural2-D',
  
  // Female voices - Neural2
  'Zephyr': 'en-US-Neural2-C',
  'Kore': 'en-US-Neural2-E',
  'Leda': 'en-US-Neural2-F',
  'Aoede': 'en-US-Neural2-H',
  'Callirrhoe': 'en-US-Neural2-C',
  'Autonoe': 'en-US-Neural2-G',
  'Despina': 'en-US-Neural2-F',
  'Erinome': 'en-US-Neural2-H',
};

// Default fallback voices by gender (Neural2 tier)
const DEFAULT_FEMALE_VOICE = 'en-US-Neural2-E'; // Professional female
const DEFAULT_MALE_VOICE = 'en-US-Neural2-D';   // Professional male

function mapVoiceNameToGoogleCloud(voiceName: string | undefined): string {
  if (!voiceName) {
    return DEFAULT_FEMALE_VOICE; // Default to professional female
  }
  
  // Check if we have a mapping for this voice
  const mapped = VOICE_NAME_MAPPING[voiceName];
  if (mapped) {
    console.log('[Audio Flow] Mapped voice:', voiceName, '→', mapped);
    return mapped;
  }
  
  // Fallback: try to guess based on voice characteristics
  // This is a best-effort approach
  console.log('[Audio Flow] No mapping found for voice:', voiceName, 'using default');
  return DEFAULT_FEMALE_VOICE;
}

// Helper function to convert raw PCM audio data to a browser-compatible WAV format
async function convertPcmToWav(pcmData: Buffer, sampleRate: number = 16000, channels: number = 1): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const writer = new wav.Writer({
        channels,
        sampleRate,
        bitDepth: 16, // LINEAR16 is 16-bit
      });

      const chunks: Buffer[] = [];
      writer.on('error', reject);
      writer.on('data', (chunk: Buffer) => chunks.push(chunk));
      writer.on('end', () => {
        const wavBuffer = Buffer.concat(chunks);
        const base64 = wavBuffer.toString('base64');
        resolve(base64);
      });

      writer.write(pcmData);
      writer.end();
    } catch (error) {
      reject(error);
    }
  });
}

const GenerateAudioInputSchema = {
  script: 'string',
  voiceName: 'string (optional)',
};

export async function generateAudio(input: { script: string; voiceName?: string }): Promise<string> {
    return generateAudioFlow(input);
}

const generateAudioFlow = async (input: { script: string; voiceName?: string }): Promise<string> => {
    const googleCloudVoiceName = mapVoiceNameToGoogleCloud(input.voiceName);
    
    console.log('[Audio Flow] Starting audio generation with:', {
      scriptLength: input.script.length,
      userVoice: input.voiceName,
      googleCloudVoice: googleCloudVoiceName,
      scriptPreview: input.script.substring(0, 100) + '...'
    });
    
    // Validate script length - TTS has limits
    if (input.script.length > 5000) {
      console.warn('[Audio Flow] Script too long, truncating to 5000 characters');
    }
    const scriptText = input.script.substring(0, 5000);
    
    try {
      // Use Google Cloud Text-to-Speech API directly
      const request = {
        input: { text: scriptText },
        voice: { 
          languageCode: 'en-US',
          name: googleCloudVoiceName,
        },
        audioConfig: { 
          audioEncoding: 'LINEAR16' as const, // 16-bit PCM audio
          pitch: 0,
          speakingRate: 1.1, // 10% faster for timing control
          sampleRateHertz: 24000, // Higher quality for Journey voices
        },
      };

      console.log('[Audio Flow] Calling Google Cloud TTS API with voice:', googleCloudVoiceName);
      const [response] = await textToSpeechClient.synthesizeSpeech(request);
      
      console.log('[Audio Flow] TTS response received');
      console.log('[Audio Flow] Audio content type:', typeof response.audioContent);
      console.log('[Audio Flow] Audio content size:', (response.audioContent as Buffer)?.length || 'unknown');

      if (!response.audioContent) {
        throw new Error('No audio content returned from Text-to-Speech API');
      }

      const audioBuffer = response.audioContent as Buffer;
      
      if (audioBuffer.length === 0) {
        throw new Error('Generated audio buffer is empty');
      }
      
      // Convert PCM to WAV format for browser compatibility
      console.log('[Audio Flow] Converting PCM to WAV format...');
      const wavBase64 = await convertPcmToWav(audioBuffer, 24000, 1);
      
      console.log('[Audio Flow] WAV conversion complete. Output size:', wavBase64.length);
      
      return `data:audio/wav;base64,${wavBase64}`;
      
    } catch (error: unknown) {
      console.error('[Audio Flow] Error during audio generation:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Check for common error patterns and provide helpful messages
      if (errorMessage.includes('API_KEY') || 
          errorMessage.includes('authentication') || 
          errorMessage.includes('permission')) {
        throw new Error(
          'Audio generation authentication failed. Please check your Google Cloud credentials.'
        );
      }
      
      if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
        throw new Error(
          'Audio generation quota exceeded. Please try again later.'
        );
      }
      
      if (errorMessage.includes('INVALID_ARGUMENT')) {
        throw new Error(
          `Invalid audio generation parameters: ${errorMessage}`
        );
      }
      
      // Re-throw with the original message for debugging
      throw new Error(`Audio generation failed: ${errorMessage}`);
    }
};
