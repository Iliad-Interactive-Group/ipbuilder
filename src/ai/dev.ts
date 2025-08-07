
import { config } from 'dotenv';
config();

// Keep these two main flows
import '@/ai/flows/generate-marketing-copy.ts';
import '@/ai/flows/create-marketing-brief-blueprint-flow.ts';

// Also keep the keyword suggestion flow
import '@/ai/flows/suggest-keywords-flow.ts';

// Add the new image generation flow
import '@/ai/flows/generate-image-flow.ts';
    