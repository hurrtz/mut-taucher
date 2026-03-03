# Amplitude Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add full-funnel Amplitude analytics with GDPR consent gating to the Mut-Taucher therapy website.

**Architecture:** Install `@amplitude/analytics-browser`, create a consent module (localStorage-backed), a typed analytics wrapper, and a consent banner component. Integrate tracking calls into existing components at key interaction points. All tracking is no-op until user consents.

**Tech Stack:** React 19, TypeScript 5.9, @amplitude/analytics-browser, Vite env vars

---

### Task 1: Install dependency and configure env vars

**Files:**
- Modify: `package.json`
- Create: `.env.example`
- Create: `.env`

**Step 1: Install Amplitude SDK**

Run: `npm install @amplitude/analytics-browser`

**Step 2: Create `.env.example`**

```
VITE_AMPLITUDE_API_KEY=your-amplitude-api-key-here
```

**Step 3: Create `.env`**

```
VITE_AMPLITUDE_API_KEY=<paste your real key here>
```

**Step 4: Verify `.gitignore` includes `.env`**

Run: `grep -q '\.env' .gitignore && echo "OK" || echo ".env >> .gitignore"`

If not present, add `.env` to `.gitignore`.

**Step 5: Commit**

```bash
git add package.json package-lock.json .env.example .gitignore
git commit -m "feat: add @amplitude/analytics-browser dependency and env config"
```

---

### Task 2: Create consent module

**Files:**
- Create: `src/lib/consent.ts`

**Step 1: Write `src/lib/consent.ts`**

```typescript
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
```

**Step 2: Commit**

```bash
git add src/lib/consent.ts
git commit -m "feat: add cookie consent module (localStorage-backed)"
```

---

### Task 3: Create analytics module

**Files:**
- Create: `src/lib/analytics.ts`

**Step 1: Write `src/lib/analytics.ts`**

This module wraps Amplitude. All `track*` functions are safe to call regardless of init state — they silently no-op if Amplitude wasn't initialized.

```typescript
import * as amplitude from '@amplitude/analytics-browser';
import { getConsent } from './consent';

let initialized = false;

export function initAnalytics(): void {
  if (initialized) return;
  if (getConsent() !== 'accepted') return;

  const apiKey = import.meta.env.VITE_AMPLITUDE_API_KEY;
  if (!apiKey) return;

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

// — Page views —

export function trackPageView(path: string, title: string): void {
  track('Page Viewed', { path, title });
}

// — Booking funnel —

export function trackBookingDateSelected(date: string): void {
  track('Booking Date Selected', { date });
}

export function trackBookingSlotSelected(date: string, time: string): void {
  track('Booking Slot Selected', { date, time });
}

export function trackBookingSubmitted(date: string, time: string): void {
  track('Booking Submitted', { date, time });
}

// — Contact —

export function trackContactSubmitted(): void {
  track('Contact Form Submitted');
}

// — Content views —

export function trackArticleViewed(slug: string, title: string): void {
  track('Article Viewed', { slug, title });
}

export function trackServiceViewed(slug: string, title: string): void {
  track('Service Viewed', { slug, title });
}

// — CTAs —

export function trackCtaClicked(label: string, location: string): void {
  track('CTA Clicked', { label, location });
}

// — Scroll depth —

export function trackScrollDepth(threshold: number, page: string): void {
  track('Scroll Depth', { threshold, page });
}

// — Group ad —

export function trackGroupAdClicked(groupName: string): void {
  track('Group Ad Clicked', { group_name: groupName });
}
```

**Step 2: Commit**

```bash
git add src/lib/analytics.ts
git commit -m "feat: add typed Amplitude analytics wrapper with consent gating"
```

---

### Task 4: Create ConsentBanner component

**Files:**
- Create: `src/components/ConsentBanner.tsx`

**Step 1: Write `src/components/ConsentBanner.tsx`**

```tsx
import { useState } from 'react';
import { getConsent, setConsent } from '../lib/consent';
import { initAnalytics } from '../lib/analytics';

export default function ConsentBanner() {
  const [visible, setVisible] = useState(getConsent() === 'undecided');

  if (!visible) return null;

  function accept() {
    setConsent('accepted');
    initAnalytics();
    setVisible(false);
  }

  function decline() {
    setConsent('declined');
    setVisible(false);
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 shadow-lg px-4 py-4 sm:px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-4">
        <p className="text-sm text-gray-600 flex-1">
          Wir verwenden Cookies zur Analyse der Websitenutzung. Weitere Informationen finden Sie in unserer{' '}
          <a href="/datenschutz" className="text-primary hover:underline">Datenschutzerklärung</a>.
        </p>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-300 rounded-full transition-colors"
          >
            Ablehnen
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-teal-500 rounded-full transition-colors"
          >
            Akzeptieren
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/ConsentBanner.tsx
git commit -m "feat: add GDPR consent banner (German-language)"
```

---

### Task 5: Wire up init + consent banner in app entry points

**Files:**
- Modify: `src/main.tsx:1-10`
- Modify: `src/App.tsx:1-46`

**Step 1: Update `src/main.tsx`**

Add `initAnalytics()` call before render. This handles returning visitors who already consented.

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initAnalytics } from './lib/analytics'

initAnalytics();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

**Step 2: Update `src/App.tsx`**

Add `ConsentBanner` as the last child inside `<Router>`. Add page view tracking in `ScrollToTop`.

```typescript
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Article from './pages/Article';
import Service from './pages/Service';
import Datenschutz from './pages/Datenschutz';
import Impressum from './pages/Impressum';
import AGB from './pages/AGB';
import UeberMich from './pages/UeberMich';
import Admin from './pages/Admin';
import ConsentBanner from './components/ConsentBanner';
import { trackPageView } from './lib/analytics';

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    trackPageView(pathname, document.title);

    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ueber-mich" element={<UeberMich />} />
        <Route path="/leistungen/:slug" element={<Service />} />
        <Route path="/wissen/:slug" element={<Article />} />
        <Route path="/datenschutz" element={<Datenschutz />} />
        <Route path="/impressum" element={<Impressum />} />
        <Route path="/agb" element={<AGB />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
      <ConsentBanner />
    </Router>
  );
}

export default App;
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Clean build, no type errors.

**Step 4: Commit**

```bash
git add src/main.tsx src/App.tsx
git commit -m "feat: wire up Amplitude init, page view tracking, and consent banner"
```

---

### Task 6: Add booking funnel tracking

**Files:**
- Modify: `src/components/Booking.tsx`

**Step 1: Add tracking imports and calls**

Add at top of file:
```typescript
import { trackBookingDateSelected, trackBookingSlotSelected, trackBookingSubmitted } from '../lib/analytics';
```

Add tracking calls at these exact locations:

1. **Date selected** — in the calendar day button `onClick` handler (line 121), after `setSelectedDate(day)`:
```typescript
onClick={() => {
  if (hasSlots && inCurrentMonth) {
    setSelectedDate(day);
    trackBookingDateSelected(format(day, 'yyyy-MM-dd'));
  }
}}
```

2. **Slot selected** — in the time slot button `onClick` handler (line 190), after `setSelectedSlot(slot)`:
```typescript
onClick={() => {
  setSelectedSlot(slot);
  trackBookingSlotSelected(slot.date, slot.time);
}}
```

3. **Booking submitted** — in `handleBook` (line 41), after `if (result)`:
```typescript
if (result) {
  trackBookingSubmitted(selectedSlot.date, selectedSlot.time);
  setIsSuccess(true);
  // ... rest unchanged
}
```

**Step 2: Verify build**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/components/Booking.tsx
git commit -m "feat: add Amplitude tracking to booking funnel (date/slot/submit)"
```

---

### Task 7: Add contact form tracking

**Files:**
- Modify: `src/components/Contact.tsx`

**Step 1: Add tracking**

Add import at top:
```typescript
import { trackContactSubmitted } from '../lib/analytics';
```

In `handleSubmit`, after `setFormState('success')` (line 28):
```typescript
setFormState('success');
trackContactSubmitted();
form.reset();
```

**Step 2: Commit**

```bash
git add src/components/Contact.tsx
git commit -m "feat: add Amplitude tracking to contact form submission"
```

---

### Task 8: Add article and service view tracking

**Files:**
- Modify: `src/pages/Article.tsx`
- Modify: `src/pages/Service.tsx`

**Step 1: Add tracking to Article.tsx**

Add import:
```typescript
import { trackArticleViewed } from '../lib/analytics';
```

Add a `useEffect` after the `useDocumentMeta` call (after line 20), before the `if (!article)` guard:
```typescript
useEffect(() => {
  if (article) {
    trackArticleViewed(article.slug, article.title);
  }
}, [article]);
```

Also add `useEffect` to the existing import from React (line 1):
```typescript
import { useMemo, useEffect } from 'react';
```

**Step 2: Add tracking to Service.tsx**

Same pattern. Add import:
```typescript
import { trackServiceViewed } from '../lib/analytics';
```

Add `useEffect` to the React import:
```typescript
import { useMemo, useEffect } from 'react';
```

Add after `useDocumentMeta` call:
```typescript
useEffect(() => {
  if (service) {
    trackServiceViewed(service.slug, service.title);
  }
}, [service]);
```

**Step 3: Commit**

```bash
git add src/pages/Article.tsx src/pages/Service.tsx
git commit -m "feat: add Amplitude tracking for article and service page views"
```

---

### Task 9: Add CTA click tracking to Hero and Services

**Files:**
- Modify: `src/components/Hero.tsx`
- Modify: `src/components/Services.tsx`

**Step 1: Add tracking to Hero.tsx**

Add import:
```typescript
import { trackCtaClicked } from '../lib/analytics';
```

There are 4 CTA `<a>` tags (2 mobile, 2 desktop). Add `onClick` handlers to all four:

Mobile "Erstgespräch vereinbaren" (line 41):
```tsx
<a
  href="#booking"
  onClick={() => trackCtaClicked('Erstgespräch vereinbaren', 'hero-mobile')}
  className="..."
>
```

Mobile "Mehr erfahren" (line 47):
```tsx
<a
  href="#about"
  onClick={() => trackCtaClicked('Mehr erfahren', 'hero-mobile')}
  className="..."
>
```

Desktop "Erstgespräch vereinbaren" (line 93):
```tsx
<a
  href="#booking"
  onClick={() => trackCtaClicked('Erstgespräch vereinbaren', 'hero-desktop')}
  className="..."
>
```

Desktop "Mehr erfahren" (line 100):
```tsx
<a
  href="#about"
  onClick={() => trackCtaClicked('Mehr erfahren', 'hero-desktop')}
  className="..."
>
```

**Step 2: Add tracking to Services.tsx — ServiceCard links**

The `ServiceCard` component already uses `<Link>`. Add tracking on click.

Add import:
```typescript
import { trackCtaClicked } from '../lib/analytics';
```

In `ServiceCard` (line 16), add `onClick` to the `<Link>`:
```tsx
<Link
  to={`/leistungen/${service.slug}`}
  onClick={() => trackCtaClicked(service.title, 'services-grid')}
  className="pt-6 group"
>
```

**Step 3: Commit**

```bash
git add src/components/Hero.tsx src/components/Services.tsx
git commit -m "feat: add Amplitude CTA click tracking to hero and services"
```

---

### Task 10: Add scroll depth tracking to Home

**Files:**
- Modify: `src/pages/Home.tsx`

**Step 1: Add scroll depth tracking**

The Home page has sections in this order: Hero, About, Services, Booking, Articles, Contact, Footer. We can approximate scroll depth by observing when key section IDs become visible.

Map sections to thresholds:
- `#about` → 25% (first content section below hero)
- `#services` → 50%
- `#booking` → 75%
- `#contact` → 100%

Add import:
```typescript
import { useEffect, useRef, useMemo } from 'react';
import { trackScrollDepth } from '../lib/analytics';
```

Add scroll tracking logic inside `Home()`, after the `useMemo` call:

```typescript
const firedRef = useRef<Set<number>>(new Set());

useEffect(() => {
  const thresholds: [string, number][] = [
    ['about', 25],
    ['services', 50],
    ['booking', 75],
    ['contact', 100],
  ];

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const match = thresholds.find(([id]) => entry.target.id === id);
        if (match && !firedRef.current.has(match[1])) {
          firedRef.current.add(match[1]);
          trackScrollDepth(match[1], '/');
        }
      }
    },
    { threshold: 0.1 },
  );

  for (const [id] of thresholds) {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  }

  return () => observer.disconnect();
}, []);
```

**Step 2: Commit**

```bash
git add src/pages/Home.tsx
git commit -m "feat: add scroll depth tracking via IntersectionObserver on Home"
```

---

### Task 11: Add group ad click tracking

**Files:**
- Modify: `src/components/GroupAd.tsx`

**Step 1: Add tracking**

Add import:
```typescript
import { trackGroupAdClicked } from '../lib/analytics';
```

Add `onClick` to the `<a>` tag (line 20):
```tsx
<a
  href="#booking"
  onClick={() => trackGroupAdClicked(group.name)}
  className="..."
>
```

**Step 2: Commit**

```bash
git add src/components/GroupAd.tsx
git commit -m "feat: add Amplitude tracking for group ad banner clicks"
```

---

### Task 12: Final verification

**Step 1: Build check**

Run: `npm run build`
Expected: Clean build, zero errors.

**Step 2: Lint check**

Run: `npm run lint`
Expected: No new warnings or errors.

**Step 3: Manual smoke test**

Run: `npm run dev`

Open browser console, check:
1. No Amplitude errors in console (key should be missing in dev if `.env` not set)
2. Consent banner appears on first visit
3. Click "Akzeptieren" → banner disappears
4. Navigate between pages → no errors
5. Open localStorage → `mut-taucher-consent` = `accepted`

**Step 4: Final commit (if any lint fixes needed)**

```bash
git add -A
git commit -m "chore: lint fixes for Amplitude integration"
```
