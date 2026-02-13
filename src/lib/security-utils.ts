/**
 * @fileOverview Security utilities for handling sensitive data
 * Provides functions to prevent accidental exposure of API keys and sensitive information
 */

/**
 * Redacts sensitive values from objects before logging
 * @param obj - Object that may contain sensitive data
 * @returns Object with sensitive fields redacted
 */
export function redactSensitiveData<T extends Record<string, unknown>>(obj: T): T {
  const sensitiveKeys = [
    'apikey',
    'api_key',
    'apiKey',
    'password',
    'secret',
    'token',
    'authorization',
    'auth',
    'credential',
    'private',
    'genai',
  ];

  const redacted = { ...obj } as Record<string, unknown>;

  Object.keys(redacted).forEach((key) => {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      redacted[key] = redactSensitiveData(redacted[key] as Record<string, unknown>);
    }
  });

  return redacted as T;
}

/**
 * Safe logger that redacts sensitive information
 * Use this instead of console.log when logging objects that might contain API keys
 */
export const safeLog = {
  log: (...args: unknown[]) => {
    const redactedArgs = args.map((arg) =>
      typeof arg === 'object' && arg !== null ? redactSensitiveData(arg as Record<string, unknown>) : arg
    );
    console.log(...redactedArgs);
  },
  error: (...args: unknown[]) => {
    const redactedArgs = args.map((arg) =>
      typeof arg === 'object' && arg !== null ? redactSensitiveData(arg as Record<string, unknown>) : arg
    );
    console.error(...redactedArgs);
  },
  warn: (...args: unknown[]) => {
    const redactedArgs = args.map((arg) =>
      typeof arg === 'object' && arg !== null ? redactSensitiveData(arg as Record<string, unknown>) : arg
    );
    console.warn(...redactedArgs);
  },
};

/**
 * Validates that critical environment variables are set
 * Throws error in production if required keys are missing
 */
export function validateEnvironmentVariables(): void {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Server-side only variables (must NOT have NEXT_PUBLIC_ prefix)
  const serverOnlyVars = ['GOOGLE_GENAI_API_KEY'];
  
  // Client-accessible Firebase variables (must have NEXT_PUBLIC_ prefix)
  const clientVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  ];

  if (isProduction) {
    // Check server-only variables
    serverOnlyVars.forEach((varName) => {
      if (!process.env[varName]) {
        throw new Error(`Missing required server-side environment variable: ${varName}`);
      }
    });

    // Check client variables
    clientVars.forEach((varName) => {
      if (!process.env[varName]) {
        throw new Error(`Missing required client-side environment variable: ${varName}`);
      }
    });
  }
}

/**
 * Checks if we're running on the client side
 */
export function isClientSide(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Ensures a variable is only accessed server-side
 * Throws error if called on client
 */
export function assertServerSide(variableName: string): void {
  if (isClientSide()) {
    throw new Error(
      `Security Error: Attempted to access server-side only variable "${variableName}" on the client. ` +
      `This could expose sensitive credentials. Use server actions instead.`
    );
  }
}
