/**
 * Voice speed database for TTS length prediction
 * Used to adjust word count targets based on voice selection
 * Words per second for each available voice
 */

export const VOICE_SPEEDS: Record<string, number> = {
  // Male voices
  'Puck': 2.95,
  'Charon': 2.85,
  'Fenrir': 3.0,
  'Orus': 2.9,
  'Enceladus': 2.85,
  'Iapetus': 2.95,
  'Umbriel': 3.05,
  'Algieba': 2.88,
  'Algenib': 2.92,
  'Rasalgethi': 2.98,
  'Alnilam': 3.02,
  'Schedar': 2.93,
  'Achird': 2.87,
  'Zubenelgenubi': 2.90,
  'Sadachbia': 2.96,
  'Sadaltager': 2.94,
  
  // Female voices
  'Zephyr': 3.08,
  'Kore': 3.18,
  'Leda': 3.10,
  'Aoede': 3.05,
  'Callirrhoe': 3.12,
  'Autonoe': 3.15,
  'Despina': 3.08,
  'Erinome': 3.20,
  'Laomedeia': 3.06,
  'Achernar': 3.22,
  'Gacrux': 3.09,
  'Pulcherrima': 3.16,
  'Vindemiatrix': 3.11,
  'Sulafat': 3.07,
};

export const DEFAULT_VOICE_SPEED = 3.0; // Fallback average

/**
 * Calculate target word count for a given duration and voice
 * Reduces by 12% to account for TTS delivery variations
 * 
 * @param durationSeconds - Target duration in seconds
 * @param voiceName - Name of the voice (optional)
 * @returns Adjusted word count target
 */
export function getTargetWordCount(durationSeconds: number, voiceName?: string): number {
  const wordsPerSecond = voiceName ? (VOICE_SPEEDS[voiceName] || DEFAULT_VOICE_SPEED) : DEFAULT_VOICE_SPEED;
  const baseWordCount = durationSeconds * wordsPerSecond;
  // Reduce by 12% to ensure we stay under the target time
  return Math.floor(baseWordCount * 0.88);
}
