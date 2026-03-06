import {genkit, GenkitError} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { config } from 'dotenv';

// Explicitly load environment variables from .env.local or .env
config({ path: '.env.local' });
config();


export const ai = genkit({
  plugins: [
    googleAI({
      // Ensure the API key is passed explicitly from the environment
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});
