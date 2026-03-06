/**
 * @fileOverview Firebase configuration module.
 *
 * This file exports the configuration object required to initialize the Firebase app.
 * Values are retrieved from environment variables prefixed with NEXT_PUBLIC_ 
 * to ensure they are available in the browser.
 */

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Log a warning if the API key is missing (only in development)
if (process.env.NODE_ENV === 'development' && !firebaseConfig.apiKey) {
  console.warn(
    'Firebase API Key is missing. Please ensure NEXT_PUBLIC_FIREBASE_API_KEY is set in your .env file.'
  );
}
