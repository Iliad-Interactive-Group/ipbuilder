# Iliad IPbuilder: A World-Class Creative Tool

An AI-powered SaaS application for generating marketing content across multiple formats, built with Next.js, Firebase, and Google Genkit.

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
- **Audio Generation**: Text-to-speech for scripts with production cue stripping
- **Export Options**: PDF, HTML (Google Docs compatible), and plain text
- **Firebase Authentication**: Secure user authentication
- **Real-time Progress**: Track generation progress for multiple content types with smooth UI transitions
- **Client-Side Validation**: Zod validation prevents invalid API calls
- **Parallel Processing**: Promise.all for concurrent content generation

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

- Never commit `.env` files
- Use environment-specific CORS origins in production
- Regularly update dependencies
- Review Firebase security rules

## Architecture

- **Frontend**: Next.js 15 with React 18, TypeScript, and Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **AI/LLM**: Google Genkit with Gemini 2.0 Flash
- **Authentication**: Firebase Auth
- **Forms**: React Hook Form + Zod validation
- **Export**: jsPDF for PDF generation

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

### `POST /api/ingest-strategy`

Accepts form data from external integrations and redirects with a marketing brief.

**Request Body** (application/x-www-form-urlencoded):
- `companyName` - Company name (required)
- `productServiceDescription` - Product description (required)
- `keywords` - Comma-separated keywords (required)

**Response**: Redirects to main page with base64-encoded brief in URL

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

### Comprehensive Architecture Refactor

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
│   └── api/
│       └── ingest-strategy/    # External integration endpoint
├── ai/
│   ├── flows/                  # Genkit AI flows
│   │   ├── generate-marketing-copy.ts
│   │   ├── generate-image-flow.ts
│   │   └── generate-audio-flow.ts
│   └── schemas/                # Centralized Zod schemas
│       └── marketing-brief-schemas.ts
└── components/
    └── page/
        ├── marketing-brief-form.tsx        # Form with variant selector
        └── generated-copy-display.tsx      # Display with tabs for variants
```

## License

[License information here]
