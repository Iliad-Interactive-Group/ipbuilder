# IPBuilder - AI-Powered Marketing Content Generator

An AI-powered SaaS application for generating marketing content across multiple formats, built with Next.js, Firebase, and Google Genkit.

## Features

- **Multi-Format Content Generation**: Generate 11+ types of marketing content including:
  - Website copy and wireframes
  - Social media posts
  - TV and radio scripts
  - Blog posts and podcast outlines
  - Display ads and billboards
  - Lead generation emails
  
- **AI-Powered**: Uses Google Gemini 2.0 Flash for intelligent content generation
- **Image Generation**: Automatically generates visual suggestions and images
- **Audio Generation**: Text-to-speech for scripts with production cue stripping
- **Export Options**: PDF, HTML (Google Docs compatible), and plain text
- **Firebase Authentication**: Secure user authentication
- **Real-time Progress**: Track generation progress for multiple content types

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

## License

[License information here]
