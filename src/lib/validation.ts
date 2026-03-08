const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s/()-]{6,}$/;

export function validateEmail(value: string): string | null {
  if (!value) return null;
  return EMAIL_RE.test(value.trim()) ? null : 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
}

export function validatePhone(value: string): string | null {
  if (!value) return null;
  return PHONE_RE.test(value.trim()) ? null : 'Bitte geben Sie eine gültige Telefonnummer ein.';
}
