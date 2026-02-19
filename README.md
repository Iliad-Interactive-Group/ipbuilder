# Iliad IPbuilder: A World-Class Creative Tool

An AI-powered SaaS application for generating marketing content across multiple formats, built with Next.js, Firebase, and Google Genkit.

**Production URL**: [https://ipbuilder.homerdev.com](https://ipbuilder.homerdev.com)

🔐 **Secured with Google Secret Manager** for persistent environment variable management across deployments.

## Table of Contents

- [Project Vision](#project-vision)
- [Features](#features)
- [Quick Start](#quick-start)
- [Audio Generation](#audio-generation)
- [Development Workflow](#development-workflow)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [API Endpoints](#api-endpoints)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Project Vision

The mission is to transform this application from a powerful starter kit into a world-class, standalone creative tool. This platform empowers marketers, creators, and strategists by integrating cutting-edge AI to generate high-quality, strategic content across a wide range of advertising verticals.

The goal is to build an intuitive, professional-grade application that serves as an indispensable partner in the creative process—from initial brief to final execution.

## Features

- **Multi-Format Content Generation**: Generate 11+ types of marketing content including:
  - Website copy and wireframes
  - Social media posts (with platform-specific optimization)
  - TV and radio scripts (with multi-variant support)
  - Blog posts and podcast outlines
  - Display ads and billboards
  - Lead generation emails
  
- **Multi-Variant Generation**: Create 2-4 unique variations for radio and TV scripts, displayed in an intuitive tabbed interface
- **AI-Powered**: Uses Google Gemini 2.0 Flash for intelligent content generation
- **Server-Side Architecture**: Secure server actions protect AI logic and credentials from client exposure
- **Image Generation**: Automatically generates visual suggestions and images for appropriate content types
- **Audio Generation**: Text-to-speech for radio and TV scripts with:
  - Multiple professional voice options (Algenib, Kore, Puck)
  - Automatic production cue stripping ([SFX:], [MUSIC:], etc.)
  - Built-in audio player with modal playback
  - Direct download as WAV files
  - Google AI Studio TTS integration
- **Export Options**: PDF, HTML (Google Docs compatible), and plain text
- **Firebase Authentication**: Secure user authentication with domain restriction (@iliadmg.com)
- **Real-time Progress**: Track generation progress for multiple content types with smooth UI transitions
- **Client-Side Validation**: Zod validation prevents invalid API calls
- **Parallel Processing**: Promise.all for concurrent content generation

## Quick Start

### Prerequisites

- Node.js 20 or higher
- npm or yarn
- Firebase project (with Authentication enabled)
- Google AI API key (for Genkit)
- VSCode (recommended for optimal development experience)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Iliad-Interactive-Group/ipbuilder.git
cd ipbuilder
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in your Firebase configuration
   - Add your Google AI API key

**Required Environment Variables:**
```env
# Firebase Configuration (client-side - intentionally public)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-domain.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Google AI (server-side - MUST remain secret)
GOOGLE_GENAI_API_KEY=your-google-ai-key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run genkit:dev` - Start Genkit AI development server
- `npm run genkit:watch` - Start Genkit with watch mode

## Audio Generation

### Overview

IPbuilder includes a sophisticated text-to-speech system for generating high-quality audio from radio and TV scripts.

### Features

- **Multiple Voices**: Choose from professional voices including:
  - **Algenib** - Male, gravelly (default)
  - **Kore** - Female, authoritative
  - **Puck** - Male, energetic
  - Additional voices available through Google AI Studio

- **Automatic Cue Stripping**: Production cues like `[SFX: ...]`, `[MUSIC: ...]`, and `[VOICEOVER: ...]` are automatically removed before audio generation

- **Dual UI Controls**:
  - Generate button in the accordion for each script
  - Download button appears immediately after generation
  - Audio player modal with embedded controls and download option

### Usage

1. Create a Radio Script or TV Script in the main form
2. Click "Generate" to create the script copy
3. Click "Generate Audio Spec" button
4. Wait for processing (typically 5-10 seconds)
5. Use the "Download Audio" button or click the toast notification to play/download

### Technical Details

- **Format**: WAV (24kHz, 16-bit PCM)
- **Model**: Google Gemini 2.5 Flash Preview TTS
- **Processing**: Server-side via Next.js Server Actions
- **Storage**: Base64 data URIs (no external storage required)

### Troubleshooting Audio Generation

If audio generation fails:

1. **Check API Key**: Ensure `GOOGLE_GENAI_API_KEY` is set correctly
2. **Script Length**: Very long scripts (>5000 characters) may timeout
3. **Network**: Verify stable internet connection
4. **Browser Support**: Modern browsers required (Chrome, Firefox, Edge, Safari 14+)

## Development Workflow

### Recommended VSCode Setup

1. **Extensions**:
   - ESLint
   - Prettier
   - Tailwind CSS IntelliSense
   - GitHub Copilot (for AI commit messages)
   - Error Lens (inline error display)

2. **Settings** (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "git.enableSmartCommit": true,
  "git.postCommitCommand": "sync",
  "git.confirmSync": false
}
```

3. **Keyboard Shortcuts**: Add to keybindings for faster workflow
   - `Ctrl+Shift+C` - Commit staged changes
   - `Ctrl+Shift+S` - Git sync (commit + push)

### Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Prettier with 2-space indentation
- **Naming**: 
  - Components: PascalCase
  - Files: kebab-case for components, camelCase for utilities
  - Server actions: Suffix with `Action`

### Testing Changes

1. **Local Development**: Always test with `npm run dev` first
2. **Type Check**: Run `npm run typecheck` before committing
3. **Build Test**: Run `npm run build` to catch build-time errors
4. **Manual Testing**: Test in Chrome and Firefox at minimum

### Git Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes with frequent commits
3. Use descriptive commit messages (or AI-generated via Copilot)
4. Push to remote: `git push origin feature/your-feature`
5. Create pull request for review

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn
- Firebase project
- Google AI API key (for Genkit)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Iliad-Interactive-Group/ipbuilder.git
cd ipbuilder
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in your Firebase configuration
   - Add your Google AI API key

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run genkit:dev` - Start Genkit AI development server
- `npm run genkit:watch` - Start Genkit with watch mode

## Configuration

### CORS Configuration

The `/api/ingest-strategy` endpoint supports CORS for external integrations. Configure allowed origins:

```env
# In production, specify allowed origins:
ALLOWED_ORIGINS=https://app.example.com,https://dashboard.example.com

# In development, wildcard is used by default
```

### Security Best Practices

- **API Key Security**: See [API Key Security Guide](docs/API_KEY_SECURITY.md) for detailed information
- Never commit `.env` files
- Use environment-specific CORS origins in production
- Regularly update dependencies
- Review Firebase security rules
- Use server actions for all AI operations to protect credentials

### Important Security Notes

1. **Firebase API Keys** (`NEXT_PUBLIC_FIREBASE_*`): These are intentionally client-accessible. Security is enforced through Firebase Security Rules, not by hiding the key.

2. **Google AI API Key** (`GOOGLE_GENAI_API_KEY`): Must remain server-side only. Never add `NEXT_PUBLIC_` prefix to this variable.

3. **Security Headers**: Automatically configured in `next.config.ts` to protect against common web vulnerabilities.

For complete security documentation, see:
- [API Key Security Guide](docs/API_KEY_SECURITY.md)
- [General Security Considerations](docs/SECURITY.md)

## Architecture

- **Frontend**: Next.js 15 with React 18, TypeScript, and Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **AI/LLM**: Google Genkit with Gemini 2.0 Flash
- **Authentication**: Firebase Auth
- **Forms**: React Hook Form + Zod validation
- **Export**: jsPDF for PDF generation
- **Hosting**: Google Cloud Run with auto-deploy from GitHub
- **Domain**: ipbuilder.homerdev.com

## Deployment

IPBuilder is deployed on Google Cloud Run with automatic deployments on every push to the `main` branch.

### Quick Deploy

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for comprehensive deployment instructions including:
- Cloud Run setup and configuration
- Domain mapping to ipbuilder.homerdev.com
- Auto-deploy via GitHub Actions or Cloud Build
- Environment variables and secrets management
- Backend compatibility analysis
- Troubleshooting guide

### Quick Reference

```bash
# Build Docker image locally
docker build -t ipbuilder .

# Deploy to Cloud Run
gcloud run deploy ipbuilder --source . --region=us-central1

# View logs
gcloud run services logs tail ipbuilder --region=us-central1
```

See [CLOUD_RUN_QUICK_REFERENCE.md](docs/CLOUD_RUN_QUICK_REFERENCE.md) for more commands.

### Key Architectural Changes

#### 1. Server Actions Architecture
All AI generation calls have been moved to Next.js Server Actions for enhanced security and performance:

- **`src/app/actions.ts`**: Contains server-side wrappers (`generateMarketingCopyAction`, `generateImageAction`, `generateAudioAction`) that prevent client-side exposure of AI logic and credentials
- **Client Components**: Use server actions via imports, maintaining a clean separation between client and server code

#### 2. Performance Optimizations

- **Parallel Execution**: Content generation uses `Promise.all` to generate multiple content types concurrently
- **useTransition Hook**: Wraps generation logic to prevent UI freezing during AI calls
- **Client-Side Validation**: Zod schemas validate form data before server action calls, preventing unnecessary API requests

#### 3. Multi-Variant Support

Radio and TV scripts can generate 2-4 unique variations:
- **Schema Updates**: `numberOfVariations` field added to input schema
- **Flow Logic**: AI flow loops to generate multiple variants when requested
- **UI Display**: Variants shown in tabbed interface for easy comparison
- **Output Structure**: Variants stored as `Array<{variant: number, copy: string}>`

#### 4. Dependency Management

All Genkit packages pinned to version `^1.27.0` for consistency:
- `genkit`
- `@genkit-ai/googleai` (formerly `@genkit-ai/next`)
- `@genkit-ai/next`
- `genkit-cli`

#### 5. Module Separation

To prevent server-side modules from leaking into client bundles:
- All AI flows import `z` from `'zod'` instead of `'genkit'`
- Centralized schemas in `src/ai/schemas/marketing-brief-schemas.ts`
- Server actions marked with `'use server'` directive
- Removed `--turbopack` flag from dev script to ensure proper Webpack configuration

## API Endpoints

### `GET /api/health`

Health check endpoint for monitoring and Cloud Run health checks.

**Response**: 
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "ipbuilder"
}
```

**Usage**:
```bash
curl https://ipbuilder.homerdev.com/api/health
```

### `POST /api/ingest-strategy`

Accepts form data from external integrations (e.g., Squarespace forms) and redirects with a pre-filled marketing brief.

**Request Body** (application/x-www-form-urlencoded):
- `companyName` - Company name (required)
- `productServiceDescription` - Product description (required)
- `keywords` - Comma-separated keywords (required)
- Additional fields as defined in marketing brief schema

**Response**: `302 Redirect` to main page with base64-encoded brief in URL

**Example**:
```bash
curl -X POST https://ipbuilder.homerdev.com/api/ingest-strategy \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "companyName=Acme Corp&productServiceDescription=Cloud Software&keywords=SaaS,enterprise,cloud"
```

**CORS**: Configured to accept requests from allowed origins (see `.env` configuration)

## Troubleshooting

### Common Issues

#### Build Errors

**Issue**: `Module not found` or `Cannot find module`
```bash
# Solution: Clean install
rm -rf node_modules package-lock.json .next
npm install
```

**Issue**: `Type errors` during build
```bash
# Solution: Check TypeScript version and regenerate types
npm run typecheck
```

#### Audio Generation Fails

**Issue**: "Server action not found" error

**Solutions**:
1. Verify `generateAudioAction` is imported in `src/app/page.tsx`
2. Restart development server: `Ctrl+C` then `npm run dev`
3. Clear `.next` cache: `rm -rf .next`
4. Check that `GOOGLE_GENAI_API_KEY` is set in `.env.local`

**Issue**: Audio player doesn't appear

**Solutions**:
1. Check browser console for errors
2. Verify audio data URI is being returned from server action
3. Check that `activeAudioItem` state is updating correctly
4. Test in different browser (Chrome recommended)

#### Firebase Authentication Issues

**Issue**: "Firebase not initialized"

**Solutions**:
1. Verify all `NEXT_PUBLIC_FIREBASE_*` env variables are set
2. Check Firebase console for project configuration
3. Ensure Firebase Auth is enabled in Firebase console
4. Check browser developer tools Network tab for API errors

**Issue**: "Access denied" even with correct @iliadmg.com email

**Solutions**:
1. Clear browser cache and cookies
2. Sign out and sign in again
3. Check Firebase Authentication users list
4. Verify domain validation logic in `src/app/login/page.tsx`

#### Deployment Issues

**Issue**: Cloud Run deployment fails

**Solutions**:
1. Check build logs: `gcloud run services logs read ipbuilder`
2. Verify environment variables in Secret Manager
3. Test Docker build locally: `docker build -t ipbuilder .`
4. Check Dockerfile for correct Node version and build commands

**Issue**: Application works locally but fails in production

**Solutions**:
1. Check production environment variables
2. Review Cloud Run logs for specific errors
3. Verify API quotas haven't been exceeded
4. Check Firebase security rules

### Getting Help

- **Documentation**: Check `/docs` folder for detailed guides
- **Issues**: Create GitHub issue with error logs and reproduction steps
- **Logs**: Use `npm run dev` for detailed console output
- **Community**: Contact Iliad team for support

## Development

### Type Safety

This project uses TypeScript in strict mode. Run type checking with:

```bash
npm run typecheck
```

### Error Handling

The application includes:
- React Error Boundary for graceful error handling
- Proper error typing with `unknown` type in catch blocks
- Input validation on API routes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and type checking
5. Submit a pull request

## Recent Updates

### February 2026 - Audio Player & Download Enhancement

**Features Added**:
- ✨ **Inline Audio Download Button**: Download button now appears immediately after audio generation in the accordion view
- ✨ **Modal Download Option**: Added download button to the audio player modal for convenient access
- 🎵 **Improved Audio Player**: Enhanced modal UI with better spacing and responsive design
- 📦 **Better .gitignore**: Comprehensive updates to prevent build artifacts, audio files, and IDE files from being committed

**Technical Improvements**:
- Added `Download` icon import to main page component
- Enhanced `generated-copy-display.tsx` with conditional download button rendering
- Updated alert dialog footer with responsive flex layout
- Improved `.gitignore` to cover:
  - Build artifacts (`.next/`, `dist/`, `.cache/`)
  - Generated audio files (`.wav`, `.mp3`, `.mp4`)
  - IDE configurations (`.vscode/`, `.idea/`)
  - Environment file variations
  - OS-specific files

**Files Modified**:
- `src/app/page.tsx` - Added Download icon and modal download button
- `src/components/page/generated-copy-display.tsx` - Added inline download button
- `.gitignore` - Comprehensive update for build artifacts

### December 2025 - Comprehensive Architecture Refactor

This version includes significant improvements based on the project vision:

1. **Core Architecture Refactor**: Moved all client-side AI generation calls to Next.js Server Actions for improved security and performance
2. **Performance & UX Enhancements**: 
   - Parallel Promise execution for concurrent content generation
   - React's `useTransition` hook for smoother loading states
   - Client-side Zod validation before server action calls
3. **Multi-Variant Generation**: Support for generating 2-4 unique variations of radio and TV scripts with tabbed UI display
4. **Critical Bug Fixes**:
   - Genkit dependency conflicts resolved by pinning to v1.27.0
   - Fixed server-side module leaks (`async_hooks`, `fs`) by removing Turbopack and fixing import paths
   - Removed `'use server'` exports of Zod schemas
   - Simplified complex schemas to prevent nesting depth errors

### File Structure

```
src/
├── app/
│   ├── actions.ts              # Server actions for AI generation
│   ├── page.tsx                # Main application page (uses server actions)
│   ├── login/
│   │   └── page.tsx            # Authentication with Google OAuth & domain restriction
│   └── api/
│       ├── health/             # Health check endpoint
│       ├── ingest-strategy/    # External integration endpoint
│       └── sample-snapshot/    # Sample data endpoint
├── ai/
│   ├── flows/                  # Genkit AI flows
│   │   ├── generate-marketing-copy.ts
│   │   ├── generate-image-flow.ts
│   │   └── generate-audio-flow.ts      # TTS with multiple voice support
│   ├── schemas/                # Centralized Zod schemas
│   │   └── marketing-brief-schemas.ts
│   ├── genkit.ts              # Genkit configuration
│   └── dev.ts                 # Genkit dev server
├── components/
│   ├── page/
│   │   ├── marketing-brief-form.tsx        # Form with variant selector
│   │   ├── generated-copy-display.tsx      # Display with tabs & audio controls
│   │   ├── data-input-card.tsx
│   │   ├── podcast-outline-display.tsx
│   │   └── blog-post-display.tsx
│   ├── ui/                    # shadcn/ui components
│   ├── app-logo.tsx
│   ├── protected-route.tsx
│   ├── user-menu.tsx
│   └── error-boundary.tsx
├── contexts/
│   └── AuthContext.tsx        # Firebase auth context
├── hooks/
│   ├── use-toast.ts
│   └── use-mobile.tsx
├── lib/
│   ├── content-types.ts       # Content type definitions
│   ├── env-validation.ts      # Environment variable validation
│   ├── export-helpers.ts      # PDF/HTML export utilities
│   ├── security-utils.ts      # Security helpers
│   ├── utils.ts               # General utilities
│   └── variant-utils.ts       # Variant type guards
└── firebase/
    └── client.ts              # Firebase initialization
```

## Roadmap

### Planned Features

- [ ] **Content Templates**: Pre-built templates for common marketing campaigns
- [ ] **A/B Testing Analytics**: Track performance of content variations
- [ ] **Team Collaboration**: Multi-user workspaces and sharing
- [ ] **Content Calendar**: Schedule and manage content campaigns
- [ ] **Advanced Export**: PowerPoint, Word, and other formats
- [ ] **Brand Guidelines**: Upload brand assets and enforce consistency
- [ ] **API Access**: RESTful API for external integrations
- [ ] **Mobile App**: Native iOS and Android applications
- [ ] **Voice Cloning**: Custom voice models for audio generation
- [ ] **Multi-Language Support**: Generate content in multiple languages

### Technical Debt

- [ ] Add comprehensive unit tests (Jest + React Testing Library)
- [ ] Add E2E tests (Playwright)
- [ ] Implement proper error tracking (Sentry)
- [ ] Add performance monitoring (Web Vitals)
- [ ] Optimize bundle size (code splitting improvements)
- [ ] Add rate limiting for API endpoints
- [ ] Implement caching strategy for generated content

## Contributing

We welcome contributions! Please follow these guidelines:

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes following our code style
4. Run tests and type checking: `npm run typecheck && npm run lint`
5. Commit with descriptive messages
6. Push to your fork: `git push origin feature/your-feature-name`
7. Create a pull request with detailed description

### Code Review Process

1. All PRs require at least one approval
2. Automated checks must pass (lint, typecheck, build)
3. Manual testing required for UI changes
4. Security review for authentication/API changes

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] Type checking passed
- [ ] Build successful
- [ ] Tested in Chrome/Firefox

## Screenshots (if applicable)
Add screenshots for UI changes
```

## License

Copyright © 2026 The Calton Group / Iliad Interactive Marketing Group. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

---

**Built with ❤️ by the Iliad team**

For questions or support, contact: [support@iliadmg.com](mailto:support@iliadmg.com)
