# API Key Security Guide

This document explains the security measures implemented in IPBuilder to protect API keys and sensitive credentials.

## Overview

IPBuilder uses two types of API keys:

1. **Firebase API Keys** (`NEXT_PUBLIC_FIREBASE_*`) - Client-accessible by design
2. **Google AI API Key** (`GOOGLE_GENAI_API_KEY`) - Server-side only

## Firebase API Keys

### Why Firebase Keys Are Public

Firebase API keys are **intentionally exposed** to the client-side code. This is not a security vulnerability - it's how Firebase is designed to work.

- **Not Secret Credentials**: Firebase API keys identify your project to Google services, but don't grant access by themselves
- **Security Via Rules**: Access control is enforced through Firebase Security Rules, not by hiding the API key
- **Official Documentation**: See [Firebase: Using API keys](https://firebase.google.com/docs/projects/api-keys)

### Example Firebase Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      // Only authenticated users from @iliadmg.com can access
      allow read, write: if request.auth != null && 
                           request.auth.token.email.matches('.*@iliadmg.com$');
    }
  }
}
```

## Google AI API Key (Genkit)

### Critical Security Requirements

The `GOOGLE_GENAI_API_KEY` **must be kept server-side only**:

- ✅ **DO**: Use server actions in `/src/app/actions.ts`
- ✅ **DO**: Keep it in environment variables without `NEXT_PUBLIC_` prefix
- ❌ **DON'T**: Add `NEXT_PUBLIC_` prefix to this variable
- ❌ **DON'T**: Import or use directly in client components

### How It's Protected

1. **Server Actions**: All AI operations go through Next.js Server Actions
2. **Runtime Checks**: `assertServerSide()` throws errors if accessed on client
3. **Environment Validation**: Checks ensure the variable is set in production

## Security Utilities

### Redacting Sensitive Data

Use `redactSensitiveData()` to sanitize objects before logging:

```typescript
import { redactSensitiveData } from '@/lib/security-utils';

const data = {
  apiKey: 'secret-123',
  username: 'john',
};

const safe = redactSensitiveData(data);
console.log(safe);
// Output: { apiKey: '[REDACTED]', username: 'john' }
```

### Safe Logging

Use `safeLog` instead of `console.log`:

```typescript
import { safeLog } from '@/lib/security-utils';

safeLog.log({ apiKey: 'secret', data: 'public' });
// Logs: { apiKey: '[REDACTED]', data: 'public' }
```

### Server-Side Assertion

Ensure code runs only on the server:

```typescript
import { assertServerSide } from '@/lib/security-utils';

// In server-side code
assertServerSide('GOOGLE_GENAI_API_KEY');
// Throws error if accidentally called on client
```

## Security Headers

The application sets these HTTP headers to prevent common attacks:

- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-XSS-Protection: 1; mode=block` - Enables XSS protection
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer info
- `Permissions-Policy` - Restricts browser features

## Environment Variables

### Server-Only Variables

These **must NOT** have the `NEXT_PUBLIC_` prefix:

```env
GOOGLE_GENAI_API_KEY=your-genai-key
ALLOWED_ORIGINS=https://trusted-domain.com
```

### Client-Accessible Variables

These **must** have the `NEXT_PUBLIC_` prefix:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
```

## Best Practices

1. **Never Commit Real Keys**: Use `.env.example` for templates only
2. **Use Secret Managers**: In production, use Google Cloud Secret Manager
3. **Regular Audits**: Review who has access to production secrets
4. **Rotate Keys**: Periodically rotate API keys
5. **Monitor Usage**: Track API usage for anomalies
6. **Review Rules**: Regularly audit Firebase Security Rules

## Production Deployment

### Environment Variables in Cloud Run

```bash
gcloud run deploy ipbuilder \
  --set-secrets="GOOGLE_GENAI_API_KEY=GOOGLE_GENAI_API_KEY:latest" \
  --set-env-vars="NEXT_PUBLIC_FIREBASE_API_KEY=your-key"
```

### Security Checklist

- [ ] All required environment variables are set
- [ ] Firebase Security Rules are configured
- [ ] CORS origins are explicitly listed (no wildcards)
- [ ] API keys are monitored for unusual usage
- [ ] Security headers are enabled
- [ ] Dependencies are up to date

## Testing Security

### Manual Tests

1. **Check Headers**:
   ```bash
   curl -I https://your-domain.com | grep "X-"
   ```

2. **Verify No Exposed Keys**:
   - Open browser DevTools
   - Check Network tab for API calls
   - Ensure GOOGLE_GENAI_API_KEY never appears

3. **Test Redaction**:
   ```typescript
   import { redactSensitiveData } from '@/lib/security-utils';
   console.log(redactSensitiveData({ apiKey: 'test' }));
   ```

## Incident Response

If an API key is accidentally exposed:

1. **Rotate Immediately**: Generate new keys in Google Cloud Console
2. **Update Secrets**: Update all environment variables with new keys
3. **Review Logs**: Check for unauthorized usage
4. **Notify Team**: Inform relevant stakeholders
5. **Post-Mortem**: Document what happened and how to prevent it

## Questions?

See [/docs/SECURITY.md](/docs/SECURITY.md) for more security information.
