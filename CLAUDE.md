# CLAUDE.md — mut-taucher (gemini)

## Project Overview

German-language online psychotherapy website ("Mut-Taucher" = courage divers). Vite + React 19 SPA with landing page, appointment booking, knowledge base, and admin panel. Currently **presentation-only** — no backend, booking uses localStorage.

## Quick Start

```bash
cd gemini && npm install && npm run dev
```

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | `tsc -b && vite build` |
| `npm run lint` | ESLint |
| `npm run preview` | Preview production build |

## Tech Stack

- **React 19.2** + **TypeScript 5.9** + **Vite 7.3**
- **Tailwind CSS 4** (v4 engine, `@theme` config in `index.css`)
- **React Router 7** (3 routes: `/`, `/wissen/:slug`, `/admin`)
- **Framer Motion 12** (hero animations)
- **react-hook-form 7** + **zod 4** (zod installed but unused)
- **date-fns 4** (German locale)
- **react-markdown 10** (article rendering)
- **lucide-react** (icons)
- **clsx + tailwind-merge** (class utilities)

## Project Structure

```
gemini/src/
├── main.tsx                 # Entry point
├── App.tsx                  # Router (/, /wissen/:slug, /admin)
├── index.css                # Tailwind theme (primary/secondary/accent colors)
├── App.css                  # Dead code — Vite template leftovers
├── lib/
│   ├── data.ts              # Article + Slot types, hardcoded data
│   └── useBooking.ts        # Booking hook (localStorage persistence)
├── pages/
│   ├── Home.tsx             # Composes all landing sections
│   ├── Article.tsx          # Single article view (markdown)
│   └── Admin.tsx            # Slot management (hardcoded pw: "secret")
└── components/
    ├── Header.tsx           # Fixed navbar + mobile hamburger menu
    ├── Hero.tsx             # Full-screen hero with Framer Motion
    ├── About.tsx            # Bio section with animated blobs
    ├── Services.tsx         # 3 service cards (Einzel/Gruppe/Erstgespräch)
    ├── Articles.tsx         # Article grid linking to /wissen/:slug
    ├── Booking.tsx          # Week calendar + slot picker + booking form
    └── Footer.tsx           # Contact info + legal links (# placeholders)
```

## Data Model

```typescript
interface Slot { id: string; date: string; time: string; available: boolean; }
interface Article { id: string; title: string; excerpt: string; content: string; slug: string; image: string; }
```

All data hardcoded in `src/lib/data.ts`. Slots persist to localStorage key `'mut-taucher-slots'`.

## Theme (index.css)

| Token | Value | Usage |
|---|---|---|
| `--color-primary` | `#2dd4bf` (teal) | CTAs, links, primary accents |
| `--color-secondary` | `#f43f5e` (rose) | Secondary accents |
| `--color-accent` | `#f59e0b` (amber) | Tertiary highlights |
| `--color-background` | `#f8fafc` | Page background |
| `--color-surface` | `#ffffff` | Cards |
| `--color-text` | `#334155` | Body text |
| `--font-sans` | Inter | Body, UI |
| `--font-serif` | Merriweather | Headings |

## Conventions

- PascalCase component files, camelCase utilities
- Functional components with hooks, TypeScript strict mode
- 2-space indent, semicolons
- Use `log` utilities, not `console.log`
- All UI text in German

## Known Issues

- **No backend** — booking is localStorage-only, no emails sent
- **Hardcoded admin password** `"secret"` in `Admin.tsx:17`
- **`console.log`** in `useBooking.ts:26` (should use logger)
- **Unused dependency**: zod is installed but never imported
- **Dead CSS**: `App.css` contains Vite template remnants
- **Placeholder links**: Footer legal links point to `#`
- **No tests**, no CI/CD, no error boundaries
- **No form validation** beyond HTML `required`
- **Single JS bundle** — no code splitting
- **Images**: External Unsplash URLs (no local assets)
