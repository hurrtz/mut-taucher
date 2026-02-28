const CONSENT_KEY = 'mut-taucher-consent';

export type ConsentStatus = 'accepted' | 'declined' | 'undecided';

export function getConsent(): ConsentStatus {
  const value = localStorage.getItem(CONSENT_KEY);
  if (value === 'accepted' || value === 'declined') return value;
  return 'undecided';
}

export function setConsent(status: 'accepted' | 'declined'): void {
  localStorage.setItem(CONSENT_KEY, status);
}
