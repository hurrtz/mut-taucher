import * as amplitude from '@amplitude/analytics-browser';
import { sessionReplayPlugin } from '@amplitude/plugin-session-replay-browser';
import { getConsent } from './consent';

let initialized = false;

export function initAnalytics(): void {
  if (initialized) return;
  if (getConsent() !== 'accepted') return;

  const apiKey = import.meta.env.VITE_AMPLITUDE_API_KEY;
  if (!apiKey) return;

  const sessionReplay = sessionReplayPlugin({
    sampleRate: 1,
    privacyConfig: {
      maskSelector: ['.amp-mask', '[type="email"]', '[type="tel"]'],
      blockSelector: ['.amp-block'],
    },
  });

  amplitude.add(sessionReplay);
  amplitude.init(apiKey, {
    serverZone: 'EU',
    defaultTracking: false,
  });
  initialized = true;
}

function track(event: string, properties?: Record<string, string | number>): void {
  if (!initialized) return;
  amplitude.track(event, properties);
}

export function trackPageView(path: string, title: string): void {
  track('Page Viewed', { path, title });
}

export function trackBookingDateSelected(date: string): void {
  track('Booking Date Selected', { date });
}

export function trackBookingSlotSelected(date: string, time: string): void {
  track('Booking Slot Selected', { date, time });
}

export function trackBookingSubmitted(date: string, time: string): void {
  track('Booking Submitted', { date, time });
}

export function trackContactSubmitted(): void {
  track('Contact Form Submitted');
}

export function trackArticleViewed(slug: string, title: string): void {
  track('Article Viewed', { slug, title });
}

export function trackServiceViewed(slug: string, title: string): void {
  track('Service Viewed', { slug, title });
}

export function trackCtaClicked(label: string, location: string): void {
  track('CTA Clicked', { label, location });
}

export function trackScrollDepth(threshold: number, page: string): void {
  track('Scroll Depth', { threshold, page });
}

export function trackGroupAdClicked(groupName: string): void {
  track('Group Ad Clicked', { group_name: groupName });
}
