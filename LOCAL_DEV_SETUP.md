# Local Development Setup

This guide helps you run the ipbuilder app locally with full AI features (text generation, images, audio, blueprint analysis).

## Quick Start

```bash
npm install
npm run dev
```

Then open **http://localhost:3003** in your browser.

---

## Step 1: Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Go to **Project Settings → Service Accounts**
4. Copy these values into `.env.local`:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`

---

## Step 2: Get Google Genkit API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click "Create new API key"
3. Copy the key to `.env.local` as `GOOGLE_GENAI_API_KEY`

---

## Step 3: Set Up Google Cloud Text-to-Speech

This is required for the audio generation feature.

### Option A: Using Service Account (Recommended for Local Dev)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Enable these APIs:
   - **Cloud Text-to-Speech API**
   - **Cloud Vision API** (for image analysis in blueprints)
4. Go to **IAM & Admin → Service Accounts**
5. Create a new service account:
   - Name: `ipbuilder-local-dev`
   - Grant these roles:
     - `Cloud Text-to-Speech API User`
     - `Cloud Vision API User` (if using document analysis)
6. Create a JSON key:
   - Click on the service account
   - **Keys → Create new key → JSON**
   - Save the file to: `credentials/google-cloud-credentials.json`
7. The `.env.local` already has `GOOGLE_APPLICATION_CREDENTIALS` pointing to this file

### Option B: Using User Account (gcloud CLI)

```bash
# Install gcloud SDK from: https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth application-default login

# The SDK will handle credentials automatically
```

Then you can remove or comment out `GOOGLE_APPLICATION_CREDENTIALS` from `.env.local`.

---

## Step 4: Verify Environment Variables

Copy this template to `.env.local` and fill in your values:

```dotenv
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyD...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123...

# Google Genkit API Key
GOOGLE_GENAI_API_KEY=AIzaSyD...

# Google Cloud Credentials (for local development)
GOOGLE_APPLICATION_CREDENTIALS=C:\Users\darrell_iliadmg\Documents\ipbuilder\credentials\google-cloud-credentials.json

# CORS for local testing
ALLOWED_ORIGINS=http://localhost:3003,http://localhost:3000
```

---

## Step 5: Test Locally

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open http://localhost:3003 in your browser**

3. **Test the features:**
   - Login with Firebase
   - Try "Scrape & Autofill" with a website URL
   - Generate marketing copy
   - Generate images (requires Cloud Vision API)
   - Generate audio for scripts (requires Cloud Text-to-Speech)
   - Test exports (TXT, PDF, HTML)

---

## Debugging Tips

### Audio Generation Not Working?

Check the server console logs for `[Audio Flow]` messages:
- Verify `GOOGLE_APPLICATION_CREDENTIALS` path is correct
- Ensure the service account has **Cloud Text-to-Speech API** enabled
- Check that the credentials JSON file exists and is readable

### Blueprint/Website Analysis Failing?

The app uses Gemini's vision capabilities. Make sure:
- `GOOGLE_GENAI_API_KEY` is set correctly
- The API key has access to Gemini models via @genkit-ai

### Firebase Issues?

- Verify all Firebase credentials in `.env.local`
- Check Firebase Security Rules allow your user
- Check browser DevTools Console for Firebase errors

---

## File Structure for Credentials

```
ipbuilder/
├── credentials/
│   └── google-cloud-credentials.json    (⚠️ Never commit this!)
├── .env.local                           (⚠️ Never commit this!)
├── .env.example
└── ...other files
```

Both `credentials/` and `.env.local` are automatically ignored by Git via `.gitignore`.

---

## Next Steps After Setup

Once everything is working:

1. Test audio generation: Generate a radio script and click "Generate Audio Spec"
2. Test exports: Generate blog posts and try all 3 export formats
3. Test blueprint: Use "Scrape & Autofill" with a real website

Changes made locally will **instantly reload** thanks to Next.js hot module replacement.

---

## Need Help?

- **Google Cloud Setup**: https://cloud.google.com/docs/authentication/provide-credentials-adc
- **Genkit Documentation**: https://firebase.google.com/docs/genkit
- **Firebase Setup**: https://firebase.google.com/docs/web/setup
- **Text-to-Speech API**: https://cloud.google.com/text-to-speech/docs
