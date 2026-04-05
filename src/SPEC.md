# SPEC.md

## Purpose and Scope

`src/` owns the browser application. It covers the public site, shared frontend utilities, runtime SEO metadata, consent-aware analytics, and the lazy entry points for the admin sub-application documented in [src/admin/SPEC.md](admin/SPEC.md).

## Main Capabilities

- Public route tree in `App.tsx` for home, about, service detail, article detail, legal pages, booking result pages, and admin entry points
- Code-authored public content and shared frontend types in `src/lib/data.ts`
- Public booking UX with month calendar, slot selection, slot-first booking modal, form validation, legal consent gates, and payment-aware booking submission
- Contact form and public group-promotion surface with reservation-aware seat counts
- Runtime metadata and structured data for SEO
- Consent-gated public analytics and session replay initialization
- Shared API client and browser token/consent storage utilities

## Important Integration Points

- `/api/slots`, `/api/bookings`, `/api/contact`, `/api/groups/active`, and `/api/branding/colors`
- `localStorage` for consent state and `sessionStorage` for admin auth tokens
- Amplitude Browser SDK for public analytics
- `scripts/prerender.mjs` and `useDocumentMeta()` for SEO output

## Important Constraints

- Public operational state, especially slot availability and booking results, must come from the API.
- After a successful booking, the public booking UI must stop presenting that slot as bookable immediately and should rely on fresh, uncached `/api/slots` responses for subsequent availability.
- The public booking flow must clearly disclose the intro-call price, the `48`-hour free-cancellation window, and the Ausfallhonorar rule before submission, and it must require explicit acknowledgement of terms, privacy information, and early-start withdrawal handling.
- Public group-promotion seat counts must reflect occupied group seats from both official participants and therapist-created reservations.
- Public services and article content are maintained in source code, not a remote CMS.
- The admin surface is a child boundary of `src/` and should stay documented in `src/admin/*`.
- The public frontend should remain usable without analytics consent; tracking helpers must degrade to no-ops.
- The current booking UI exposes wire transfer only, even though the backend still contains Stripe and PayPal branches.
