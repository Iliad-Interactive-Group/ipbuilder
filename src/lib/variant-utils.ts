/**
 * Type definitions and utilities for generated content
 */

export interface VariantCopy {
  variant: number;
  copy: string;
}

/**
 * Type guard to check if marketingCopy is an array of variants
 */
export function isVariantsArray(marketingCopy: unknown): marketingCopy is VariantCopy[] {
  return Array.isArray(marketingCopy) && 
         marketingCopy.length > 0 && 
         typeof marketingCopy[0] === 'object' && 
         marketingCopy[0] !== null &&
         'variant' in marketingCopy[0] && 
         'copy' in marketingCopy[0] &&
         typeof marketingCopy[0].variant === 'number' &&
         typeof marketingCopy[0].copy === 'string';
}
