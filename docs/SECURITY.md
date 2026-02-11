# Security Considerations

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
Consider adding environment variable validation at application startup to ensure all required variables are present.
