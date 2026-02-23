
'use server';
/**
 * @fileOverview AI agent that generates audio from text using Google's Text-to-Speech.
 *
 * - generateAudio - A function that generates a WAV audio file.
 *
 * Uses Gemini 2.5 Pro TTS for natural-sounding voice synthesis.
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


// Prompt to extract spoken dialogue from a mixed script
const extractDialoguePrompt = ai.definePrompt({
  name: 'extractDialoguePrompt',
  input: { schema: z.object({ script: z.string() }) },
  output: { schema: z.object({ cleanedScript: z.string() }) },
  prompt: `You are an expert script editor preparing text for a Text-to-Speech engine.
  The input text may contain scene descriptions, camera directions, sluglines, and production notes mixed with dialogue.
  
  Your task is to extract ONLY the spoken words (dialogue/voiceover) that should be read aloud.
  
  Rules:
  1. Remove all sluglines (e.g., EXT. HOUSE, INT. ROOM).
  2. Remove all camera directions (e.g., CUT TO, FADE IN, CLOSE UP).
  3. Remove all action descriptions (e.g., "A sweeping drone shot...", "The couple toasts...").
  4. Remove character names if they are just labels (e.g., "NARRATOR:").
  5. Keep ONLY the actual spoken words.
  6. If the text is already clean dialogue, return it as is.
  7. Do not add any introductory text or explanations.
  
  Input Script:
  {{script}}
  `,
});

// Helper function to purely clean script text for TTS using regex (Fast Path)
function cleanScriptRegex(scriptText: string): string {
  // If the script follows the structured TV format (e.g. [VO]: Dialogue), we extract only spoken parts.
  const hasStructuredDialogue = /\[(VO|NARRATOR|CHARACTER|MAN|WOMAN)[^\]]*\]:/i.test(scriptText);
  
  if (hasStructuredDialogue) {
      const lines = scriptText.split('\n');
      const spokenLines: string[] = [];
      
      for (let line of lines) {
          line = line.trim();
          // Check for lines starting with a speaker tag like [VO]: or [NARRATOR]:
          // Regex: Optional square bracket, speaker name, optional bracket, colon, greedy capture of text
          const match = line.match(/^\[?(VO|NARRATOR|CHARACTER|MAN|WOMAN|ANNOUNCER)[^\]]*\]?:\s*(.+)/i);
          
          if (match && match[2]) {
              spokenLines.push(match[2].trim());
          }
      }
      
      if (spokenLines.length > 0) {
          console.log('[Audio Flow] Detected structured TV script (regex), extracted dialogue lines.');
          return spokenLines.join(' ');
      }
  }

  // Fallback cleaning strategy for standard screenplay format
  let cleaned = scriptText;
  
  // 1. Remove Scene Headings (INT., EXT.)
  cleaned = cleaned.replace(/^(INT\.|EXT\.|INT\.\/EXT\.|I\/E).*$/gim, '');
  
  // 2. Remove Transitions (CUT TO:, FADE IN:, etc.)
  cleaned = cleaned.replace(/^\[?(CUT TO|FADE IN|FADE OUT|DISSOLVE TO|SMASH CUT|SCENE START|SCENE END)[\s:\]].*$/gim, '');
  
  // 3. Remove parentheticals (e.g. (laughing))
  cleaned = cleaned.replace(/\([^\)]+\)/g, '');
  
  // 4. Remove bracketed instructions like [SFX: ...] or [VISUAL: ...]
  cleaned = cleaned.replace(/\[(SFX|MUSIC|SOUND|FX|VISUAL|VIDEO|SCENE|SHOT)[^\]]*\]/gi, '');
  
  // 5. Remove any remaining lines solely in brackets []
  cleaned = cleaned.replace(/^\[[^\]]+\]$/gm, '');
  
  // 6. Remove "Variat n" headers if present
  cleaned = cleaned.replace(/^={3,}\s*Variant\s*\d+\s*={3,}$/gm, '');

  // 7. Collapse whitespace
  return cleaned.replace(/\s+/g, ' ').trim();
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

    let scriptText = input.script;

    // Detect if the script is unstructured or has mixed content (TV/Radio) that needs AI cleaning
    // If it clearly has script formatting like EXT. or FADE IN, or if user asked for TV script
    const hasScriptFormatting = /(^|\n)(EXT\.|INT\.|FADE |CUT |\[?VO:?\]?)/i.test(input.script);
    
    // Check if it's already structured in a way regex can handle easily (Variant 2 style)
    const isStandardScript = /(^|\n)\[?(VO|NARRATOR|CHARACTER)[^\]]*\]:/i.test(input.script);
    
    let cleanScript = '';

    if (isStandardScript) {
        // Fast path: Use regex cleaning for well-formatted scripts
        cleanScript = cleanScriptRegex(input.script);
        console.log('[Audio Flow] Using standard regex cleaning strategy.');
    } else if (hasScriptFormatting || input.script.length > 300) {
        // AI Path: If script looks complex or long and unstructured (Variant 1 style), ask AI to extract dialogue
        console.log('[Audio Flow] Complex or unstructured script detected. Asking AI to extract dialogue...');
        try {
            const extraction = await extractDialoguePrompt({ script: input.script });
            if (extraction.output && extraction.output.cleanedScript) {
                cleanScript = extraction.output.cleanedScript;
                console.log('[Audio Flow] AI extracted dialogue successfully.');
            } else {
                console.warn('[Audio Flow] AI extraction returned empty, falling back to regex.');
                cleanScript = cleanScriptRegex(input.script);
            }
        } catch (e) {
             console.error('[Audio Flow] AI extraction failed, falling back to regex.', e);
             cleanScript = cleanScriptRegex(input.script);
        }
    } else {
        // Simple text, just do basic regex cleaning
        cleanScript = cleanScriptRegex(input.script);
    }
    
    // Final safety check: if cleaning removed everything (empty script), try to use original script.
    if (!cleanScript || cleanScript.trim().length === 0) {
        console.warn('[Audio Flow] Cleaning resulted in empty script. Using original script as fallback.');
        cleanScript = input.script;
    }

    console.log('[Audio Flow] Final cleaned script for TTS:', {
      originalLength: input.script.length,
      cleanedLength: cleanScript.length,
      cleanPreview: cleanScript.substring(0, 100) + '...'
    });

    // Validate script length - TTS has limits
    if (cleanScript.length > 5000) {
      console.warn('[Audio Flow] Script too long, truncating to 5000 characters');
    }
    const finalScriptText = cleanScript.substring(0, 5000);

    try {
      // Use Gemini's native TTS capability for natural-sounding voices
      const result = await ai.generate({
        model: 'googleai/gemini-2.5-pro-preview-tts',
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
        prompt: finalScriptText,
      });

      console.log('[Audio Flow] Generation response received');

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
