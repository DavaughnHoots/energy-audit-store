/**
 * Token Validation Utilities
 * 
 * Enhanced token validation to prevent issues with invalid tokens being used
 * in authentication headers.
 */

/**
 * Validates if a token is a properly formatted JWT token
 * Returns true only if the token:
 * - Is not null or undefined
 * - Is not an empty string or whitespace
 * - Is not the literal string "undefined" or "null"
 * - Has minimum length (20 chars)
 * - Contains at least one period (basic JWT structure)
 */
export const isValidToken = (t?: string | null): t is string => {
  if (!t) return false;
  const token = t.trim();
  return (
    token !== '' &&
    token !== 'undefined' &&
    token !== 'null' &&
    token.length > 20 &&
    token.includes('.')
  );
};
