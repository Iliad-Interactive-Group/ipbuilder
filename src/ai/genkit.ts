import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { assertServerSide } from '@/lib/security-utils';

// SECURITY: Ensure this code only runs server-side
// The GOOGLE_GENAI_API_KEY must never be exposed to the client
assertServerSide('GOOGLE_GENAI_API_KEY');

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-3-pro',
});
