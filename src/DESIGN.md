# DESIGN.md

## Frontend Structure

```mermaid
flowchart TD
  Main[main.tsx] --> AnalyticsInit[initAnalytics()]
  Main --> App[App.tsx]
  App --> PublicRoutes[Public route components]
  App --> AdminRoutes[Lazy admin route branch]
  PublicRoutes --> PublicPages[Home, Service, Article, legal, booking result pages]
  PublicPages --> SharedComponents[Header, Footer, Booking, Contact, JsonLd]
  SharedComponents --> SharedLib[src/lib]
  SharedLib --> ApiClient[apiFetch]
  SharedLib --> LocalContent[data.ts]
  SharedLib --> SeoLayer[useDocumentMeta and JsonLd]
  SharedLib --> ConsentAnalytics[consent.ts and analytics.ts]
```

## Public Booking Flow

```mermaid
sequenceDiagram
  actor Visitor
  participant Booking as Booking.tsx
  participant Hook as usePublicBooking.ts
  participant API as /api

  Visitor->>Booking: browse month and choose date
  Booking->>Hook: fetchSlots(range)
  Hook->>API: GET /slots
  API-->>Hook: generated available slots
  Hook-->>Booking: slot list

  Visitor->>Booking: submit booking form
  Booking->>Hook: bookSlot(...)
  Hook->>API: POST /bookings

  alt redirect payment branch
    API-->>Booking: Stripe or PayPal URL
    Booking->>Visitor: browser redirect
  else wire transfer branch
    API-->>Booking: booking id and bank details
    Booking->>Visitor: inline success state
  end
```

## Stable Design Decisions

- `App.tsx` is the single route root for both public and admin branches; admin code is lazy-loaded so the public site does not eagerly load the full admin UI.
- `useDocumentMeta()` owns runtime title, canonical, Open Graph, and Twitter metadata, while `scripts/prerender.mjs` materializes the stable public routes after build.
- Consent gating happens before analytics initialization. On `localhost` and under `/admin`, analytics stays disabled even if consent exists.
- Shared browser state is intentionally small: consent in `localStorage`, auth token in `sessionStorage`, and no client-side duplication of operational booking truth.
- Public content remains code-authored, which keeps the deployment simple but means content changes ship through the normal code pipeline.
