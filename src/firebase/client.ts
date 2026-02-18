
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

// Firebase Configuration
// SECURITY NOTE: Firebase API keys are intentionally client-accessible.
// These keys identify your Firebase project but do not grant access to resources.
// Security is enforced through Firebase Security Rules, not by hiding the API key.
// See: https://firebase.google.com/docs/projects/api-keys
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// Only initialize Firebase if we have a valid API key (not during build time with placeholders)
// IMPORTANT: The value "build-time-placeholder" must match the placeholder in Dockerfile:38
// to prevent Firebase initialization during Docker build
let app;
if (!getApps().length && firebaseConfig.apiKey && firebaseConfig.apiKey !== 'build-time-placeholder') {
  app = initializeApp(firebaseConfig);
} else if (getApps().length) {
  app = getApp();
}

const auth = app ? getAuth(app) : null;

export { app, auth };
