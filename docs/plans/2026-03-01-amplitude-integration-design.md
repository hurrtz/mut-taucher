# Amplitude Integration Design

**Date**: 2026-03-01
**Status**: Approved

## Goal

Full funnel analytics for the Mut-Taucher therapy website using Amplitude Browser SDK, with GDPR consent gating.

## Approach

Direct integration with `@amplitude/analytics-browser`. No GTM, no page-view plugin. Manual event tracking for full control over properties.

## Architecture

### New Files

| File | Purpose |
|---|---|
| `.env` / `.env.example` | `VITE_AMPLITUDE_API_KEY` |
| `src/lib/consent.ts` | Read/write consent state (localStorage key `'mut-taucher-consent'`) |
| `src/lib/analytics.ts` | Amplitude init (consent-gated) + typed event helpers |
| `src/components/ConsentBanner.tsx` | Minimal German-language GDPR banner (bottom bar) |

### Modified Files

| File | Change |
|---|---|
| `main.tsx` | Call `initAnalytics()` on startup |
| `App.tsx` | Add page view tracking in `ScrollToTop` |
| `Booking.tsx` | Track date selected, slot selected, booking submitted |
| `Contact.tsx` | Track contact form submitted |
| `Article.tsx` | Track article viewed (slug, title) |
| `Service.tsx` | Track service viewed (slug, title) |
| `Hero.tsx` | Track CTA clicks |
| `Services.tsx` | Track CTA clicks |
| `Home.tsx` | Scroll depth tracking (IntersectionObserver on sections) |
| `GroupAd.tsx` | Track group ad CTA clicked |

### Events

| Event Name | Properties | Trigger |
|---|---|---|
| `Page Viewed` | `path`, `title` | Route change |
| `Booking Date Selected` | `date` | Calendar date click |
| `Booking Slot Selected` | `date`, `time` | Time slot click |
| `Booking Submitted` | `date`, `time` | Successful form submit |
| `Contact Form Submitted` | — | Successful form send |
| `Article Viewed` | `slug`, `title` | Article page mount |
| `Service Viewed` | `slug`, `title` | Service page mount |
| `CTA Clicked` | `label`, `location` | CTA button/link clicks |
| `Scroll Depth` | `threshold` (25/50/75/100), `page` | IntersectionObserver |
| `Group Ad Clicked` | `groupName` | Group banner CTA click |

### Consent Flow

1. On page load, check `localStorage.getItem('mut-taucher-consent')`
2. If `'accepted'` → call `amplitude.init()` immediately
3. If `'declined'` → do nothing
4. If missing → show `ConsentBanner` at bottom of page
5. User clicks "Akzeptieren" → set localStorage, init Amplitude
6. User clicks "Ablehnen" → set localStorage, no init
7. All `track*` functions are no-ops if Amplitude was not initialized

### Privacy

- No PII in events (no names, emails, booking details)
- Amplitude EU data residency configurable via `serverZone: 'EU'`
- Consent required before any tracking
- `defaultTracking: false` — no automatic data collection

## Dependencies

- `@amplitude/analytics-browser` (new)

## Non-Goals

- Full cookie banner with granular consent categories
- Server-side analytics
- A/B testing
- User identification (all anonymous)
