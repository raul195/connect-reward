/**
 * Server-side input validation and sanitization utilities.
 */

/** Strip HTML tags to prevent XSS */
export function sanitizeText(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .trim();
}

/** Validate email format */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Validate US phone (10 digits) */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10;
}

/** Validate 5-digit US zip code */
export function isValidZipCode(zip: string): boolean {
  return /^\d{5}$/.test(zip);
}

/** Truncate string to max length */
export function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen) : str;
}
