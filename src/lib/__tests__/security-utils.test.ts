/**
 * @fileOverview Security utilities tests
 * Tests for API key redaction and security functions
 */

import { describe, it, expect } from '@jest/globals';
import { redactSensitiveData, safeLog, isClientSide, assertServerSide } from '../security-utils';

describe('redactSensitiveData', () => {
  it('should redact API keys', () => {
    const input = {
      apiKey: 'secret-key-123',
      data: 'public-data',
    };
    
    const result = redactSensitiveData(input);
    
    expect(result.apiKey).toBe('[REDACTED]');
    expect(result.data).toBe('public-data');
  });

  it('should redact various sensitive key names', () => {
    const input = {
      api_key: 'secret',
      apikey: 'secret',
      password: 'secret',
      secret: 'secret',
      token: 'secret',
      authorization: 'secret',
      genai: 'secret',
      public: 'not-secret',
    };
    
    const result = redactSensitiveData(input);
    
    expect(result.api_key).toBe('[REDACTED]');
    expect(result.apikey).toBe('[REDACTED]');
    expect(result.password).toBe('[REDACTED]');
    expect(result.secret).toBe('[REDACTED]');
    expect(result.token).toBe('[REDACTED]');
    expect(result.authorization).toBe('[REDACTED]');
    expect(result.genai).toBe('[REDACTED]');
    expect(result.public).toBe('not-secret');
  });

  it('should handle nested objects', () => {
    const input = {
      user: {
        name: 'John',
        password: 'secret123',
      },
      config: {
        apiKey: 'abc123',
        timeout: 5000,
      },
    };
    
    const result = redactSensitiveData(input);
    
    expect(result.user).toBeDefined();
    expect((result.user as Record<string, unknown>).name).toBe('John');
    expect((result.user as Record<string, unknown>).password).toBe('[REDACTED]');
    expect((result.config as Record<string, unknown>).apiKey).toBe('[REDACTED]');
    expect((result.config as Record<string, unknown>).timeout).toBe(5000);
  });

  it('should be case insensitive', () => {
    const input = {
      ApiKey: 'secret',
      API_KEY: 'secret',
      apiKEY: 'secret',
    };
    
    const result = redactSensitiveData(input);
    
    expect(result.ApiKey).toBe('[REDACTED]');
    expect(result.API_KEY).toBe('[REDACTED]');
    expect(result.apiKEY).toBe('[REDACTED]');
  });
});

describe('safeLog', () => {
  it('should provide log, error, and warn methods', () => {
    expect(typeof safeLog.log).toBe('function');
    expect(typeof safeLog.error).toBe('function');
    expect(typeof safeLog.warn).toBe('function');
  });
});

describe('isClientSide', () => {
  it('should return false in Node.js environment', () => {
    expect(isClientSide()).toBe(false);
  });
});

describe('assertServerSide', () => {
  it('should not throw in Node.js environment', () => {
    expect(() => assertServerSide('TEST_VAR')).not.toThrow();
  });
});
