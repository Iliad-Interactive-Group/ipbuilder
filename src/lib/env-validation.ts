/**
 * @fileOverview Server-side environment validation
 * This file validates environment variables at build/runtime
 * Import this file in server-side code to ensure proper configuration
 */

import { validateEnvironmentVariables } from '@/lib/security-utils';

// Run validation immediately when this module is imported
// This ensures that the server fails fast if required environment variables are missing
if (typeof window === 'undefined') {
  // Only run on server-side
  try {
    validateEnvironmentVariables();
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      // In production, log the error and let it propagate
      console.error('Environment variable validation failed:', error);
      throw error;
    } else {
      // In development, just warn
      console.warn('Environment variable validation warning:', error);
    }
  }
}

export {}; // Make this a module
