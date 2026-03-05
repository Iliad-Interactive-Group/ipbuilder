/**
 * @fileOverview Factual data validation utilities for generated marketing copy.
 * Scans AI-generated text for URLs, phone numbers, and addresses,
 * then flags mismatches or fabricated data against known business facts.
 */

export interface BusinessFacts {
  websiteUrl?: string;
  businessPhone?: string;
  companyName?: string;
}

export interface ValidationWarning {
  field: string;
  type: 'fabricated_url' | 'fabricated_phone' | 'wrong_url' | 'wrong_phone';
  found: string;
  expected?: string;
}

/**
 * Normalize a URL for comparison by stripping protocol, trailing slashes, and www prefix.
 */
function normalizeUrl(url: string): string {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/+$/, '')
    .toLowerCase();
}

/**
 * Normalize a phone number for comparison by stripping all non-digit characters.
 */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  // If it starts with 1 and has 11 digits (US country code), strip the leading 1
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.slice(1);
  }
  return digits;
}

/**
 * Validates generated text against known business facts.
 * Returns an array of warnings for any fabricated or mismatched data found.
 *
 * @param text - The generated marketing copy text to validate.
 * @param facts - Known business facts (URL, phone, company name) to validate against.
 * @returns Array of validation warnings.
 */
export function validateGeneratedText(text: string, facts: BusinessFacts): ValidationWarning[] {
  if (!text || text.trim().length === 0) return [];

  const warnings: ValidationWarning[] = [];

  // --- URL validation ---
  const urlRegex = /(?:https?:\/\/|www\.)[^\s<>"{}|\\^`[\],)]+/gi;
  const foundUrls = text.match(urlRegex) || [];

  for (const url of foundUrls) {
    if (facts.websiteUrl) {
      const normalizedFound = normalizeUrl(url);
      const normalizedExpected = normalizeUrl(facts.websiteUrl);
      // Check if the found URL contains the expected domain or vice versa
      if (!normalizedFound.includes(normalizedExpected) && !normalizedExpected.includes(normalizedFound)) {
        warnings.push({
          field: 'url',
          type: 'wrong_url',
          found: url,
          expected: facts.websiteUrl,
        });
      }
    } else {
      // No URL was provided but AI generated one — likely fabricated
      warnings.push({
        field: 'url',
        type: 'fabricated_url',
        found: url,
      });
    }
  }

  // --- Phone number validation ---
  // Matches US phone formats: (555) 123-4567, 555-123-4567, 555.123.4567, +1 555 123 4567, etc.
  const phoneRegex = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const foundPhones = text.match(phoneRegex) || [];

  for (const phone of foundPhones) {
    if (facts.businessPhone) {
      const normalizedFound = normalizePhone(phone);
      const normalizedExpected = normalizePhone(facts.businessPhone);
      if (normalizedFound !== normalizedExpected) {
        warnings.push({
          field: 'phone',
          type: 'wrong_phone',
          found: phone,
          expected: facts.businessPhone,
        });
      }
    } else {
      // No phone was provided but AI generated one — likely fabricated
      warnings.push({
        field: 'phone',
        type: 'fabricated_phone',
        found: phone,
      });
    }
  }

  return warnings;
}
