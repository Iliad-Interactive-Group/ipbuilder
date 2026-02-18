# Security Considerations

## API Key Security

### Firebase API Keys

Firebase API keys using the `NEXT_PUBLIC_` prefix are **intentionally client-accessible**. This is by design and documented by Firebase:

- **Why Firebase API Keys Are Public**: Firebase API keys are not secret credentials. They identify your Firebase project to Google services. Security is enforced through Firebase Security Rules, not by hiding the API key.
- **Reference**: [Firebase API Key Security](https://firebase.google.com/docs/projects/api-keys)
- **Important**: Always configure proper Firebase Security Rules to protect your data. The API key alone does not grant access to your Firebase resources.

Example Firebase Security Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      // Only authenticated users from @iliadmg.com domain can access
      allow read, write: if request.auth != null && 
                           request.auth.token.email.matches('.*@iliadmg.com$');
    }
  }
}
```

### Google AI API Key (Genkit)

The `GOOGLE_GENAI_API_KEY` **must remain server-side only**:

- **Never** use the `NEXT_PUBLIC_` prefix for this key
- **Never** expose this key to client-side code
- **Always** use server actions to make AI API calls
- This key grants access to your Google AI quota and must be protected

Our implementation uses Next.js Server Actions in `/src/app/actions.ts` to ensure the Genkit API key never reaches the client.

### Environment Variable Security

1. **Server-Only Variables** (no `NEXT_PUBLIC_` prefix):
   - `GOOGLE_GENAI_API_KEY` - Google AI/Genkit API key
   - `ALLOWED_ORIGINS` - CORS configuration
   - Any other sensitive credentials

2. **Client-Accessible Variables** (`NEXT_PUBLIC_` prefix):
   - `NEXT_PUBLIC_FIREBASE_*` - Firebase configuration (secured via Firebase Security Rules)
   - Only use this prefix when the variable MUST be accessible in the browser

3. **Never Commit**:
   - `.env` files with real credentials
   - `.env.local` files
   - `.env.production` files
   
4. **Always Use**:
   - `.env.example` for documentation (no real values)
   - Platform secret management in production (e.g., Google Cloud Secret Manager)

### Security Utilities

We provide security utilities in `/src/lib/security-utils.ts`:

```typescript
import { safeLog, redactSensitiveData, assertServerSide } from '@/lib/security-utils';

// Use safeLog instead of console.log to automatically redact sensitive data
safeLog.log({ apiKey: 'secret', data: 'public' }); // Logs: { apiKey: '[REDACTED]', data: 'public' }

// Assert that code is running server-side only
assertServerSide('GOOGLE_GENAI_API_KEY');

// Manually redact sensitive data before logging
const safeData = redactSensitiveData(potentiallyUnsafeObject);
```

## URL-Based State Storage

The application currently uses base64-encoded URL parameters to pass marketing brief data between the `/api/ingest-strategy` endpoint and the main application. While this approach works for the current use case, there are important security and privacy considerations:

### Current Implementation
- Marketing brief data is encoded in base64 and passed via URL query parameters
- This allows external forms to integrate seamlessly with the application
- The URL is temporary and cleared after loading

### Considerations
1. **URL Length Limits**: Large marketing briefs may exceed browser URL length limits (typically 2000-8000 characters)
2. **Privacy**: URL parameters may appear in:
   - Browser history
   - Server logs
   - Referrer headers
   - Browser extensions
3. **Data Exposure**: Anyone with access to the URL can see the encoded marketing brief

### Recommended Alternatives for Production

For sensitive or production environments, consider:

1. **Session Storage**:
   - Store brief data server-side with a temporary session ID
   - Pass only the session ID in the URL
   - Expire sessions after a short period (e.g., 5 minutes)

2. **Database Storage**:
   - Store briefs in a database with unique IDs
   - Pass only the ID in the URL
   - Implement access controls and expiration

3. **Encrypted Tokens**:
   - Encrypt brief data before encoding in URL
   - Decrypt on the client side
   - More secure than base64 encoding alone

## CORS Configuration

The `/api/ingest-strategy` endpoint supports CORS for external integrations.

### Security Best Practices

1. **Production Configuration**:
   ```env
   ALLOWED_ORIGINS=https://trusted-domain.com,https://another-trusted-domain.com
   ```

2. **Never Use Wildcard in Production**:
   - The default `*` is only for development
   - Always specify explicit origins in production

3. **Regular Review**:
   - Audit allowed origins periodically
   - Remove origins that are no longer needed

## Security Headers

Security headers are configured in `next.config.ts` to protect against common web vulnerabilities:

- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-Frame-Options: DENY` - Prevents clickjacking attacks
- `X-XSS-Protection: 1; mode=block` - Enables browser XSS protection
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information
- `Permissions-Policy` - Restricts access to browser features

## Input Validation

All API endpoints validate and sanitize input:

1. **Type Checking**: Ensures inputs are strings
2. **Length Limits**: Prevents excessively large inputs (10,000 character max)
3. **Required Field Validation**: Checks that all required fields are present
4. **Trimming**: Removes leading/trailing whitespace

## Error Handling

Errors are handled with proper TypeScript typing:

```typescript
// ✅ Good - uses unknown type
catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
}

// ❌ Bad - uses any type
catch (error: any) {
  console.error(error.message); // No type safety
}
```

## Dependencies

### Security Updates

Run regular security audits:

```bash
npm audit
npm audit fix
```

### Known Vulnerabilities

Currently there are 29 vulnerabilities reported by npm audit. Review with:

```bash
npm audit
```

Address critical and high-severity vulnerabilities first.

## Firebase Security

### Authentication
- Firebase Auth is used for user authentication
- Ensure Firebase security rules are properly configured
- Never expose Firebase admin credentials in client code

### Security Rules
Review and update Firebase security rules regularly to ensure:
- Users can only access their own data
- Write operations are properly validated
- Read operations are restricted appropriately

## TypeScript Strict Mode

The project uses TypeScript in strict mode to catch potential issues at compile time:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

This helps prevent common security and reliability issues.

## Environment Variables

### Required Variables
- Store all secrets in environment variables
- Never commit `.env` files to version control
- Use `.env.local` for local development
- Use platform-specific secret management in production

### Validation
The application validates environment variables at startup using utilities in `/src/lib/security-utils.ts` to ensure all required variables are present in production.
