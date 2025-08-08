
import { config } from 'dotenv';
config();

// Keep these two main flows
import '@/ai/flows/create-marketing-brief-blueprint-flow.ts';
import '@/ai/flows/generate-marketing-copy.ts';

// Also keep the keyword suggestion flow
import '@/ai/flows/suggest-keywords-flow.ts';

// Add the image generation flow
import '@/ai/flows/generate-image-flow.ts';

// Add the new audio generation flow
import '@/ai/flows/generate-audio-flow.ts';
    
