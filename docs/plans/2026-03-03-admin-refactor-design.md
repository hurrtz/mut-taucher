# Admin Refactor: Architecture, State, Routing, Styling

## Problem

`AdminPage.tsx` (886 lines) is a god component that instantiates 7 data hooks, manages 20+ pieces of local state, and renders all 7 admin sections via conditional blocks. Inline styles (327 occurrences) use raw hex values instead of Ant Design tokens. Admin routes are flat siblings with simulated tab navigation.

## Design

### 1. Nested Routes with `<Outlet>`

Replace the 3 flat admin routes with nested routes:

```
/admin              → redirect to /admin/kalender
/admin/kalender     → CalendarTab
/admin/erstgespraeche → BookingsTab
/admin/einzel       → TherapiesTab
/admin/gruppen      → GroupsTab
/admin/kunden       → PatientsTab
/admin/dokumente    → TemplatesTab
/admin/arbeitsmappe → WorkbookTab
/admin/client/:id   → ClientDetail
*                   → 404 page
```

`AdminLayout` becomes a route layout component with `<Outlet />`. Auth gating lives in the layout.

### 2. Tab → Route Component Split

Each conditional block becomes its own file under `src/admin/tabs/`:

| File | Scope |
|---|---|
| `CalendarTab.tsx` | Rules, events, calendar preview, cancellation modal |
| `BookingsTab.tsx` | Erstgespraeche list |
| `TherapiesTab.tsx` | Therapy CRUD + session management |
| `GroupsTab.tsx` | Group CRUD + participants + sessions |
| `PatientsTab.tsx` | Client list + inline history panel |
| `TemplatesTab.tsx` | Template list + editor + branding sub-tabs |
| `WorkbookTab.tsx` | Material list + preview + share |

Each tab owns its hook calls, local UI state, and action bar buttons.

### 3. Per-Tab Hook Ownership

Each tab calls only the hooks it needs. Data fetches on tab mount (route navigation), not all at once. Cross-tab data (e.g. `clients` in `GroupsTab`) is fetched locally.

Auth state stays in the layout component.

### 4. Inline Styles → Ant Design Tokens

Use `theme.useToken()` to access design tokens. Extract common patterns into `src/admin/styles.ts`:
- `centered` — flex center layout
- `sectionSpacing` — consistent margins
- `emptyState` — placeholder text styling

Per-component styles use `useToken()` locally for token-aware values. No raw hex values.

### 5. Shared Components

- `TabHeader` — title + action buttons pattern used by all tabs
- Shared `statusLabels`/`statusColors` constants (currently duplicated in 3 files)

## Files Changed

- `src/App.tsx` — nested admin routes
- `src/admin/AdminLayout.tsx` — add `<Outlet />`, auth gate, responsive sidebar
- `src/admin/AdminPage.tsx` — delete (replaced by tabs)
- `src/admin/tabs/*.tsx` — 7 new tab components
- `src/admin/styles.ts` — shared token-based styles
- `src/admin/constants.ts` — add shared status labels/colors
- `src/admin/components/TabHeader.tsx` — shared header component
- `src/pages/NotFound.tsx` — 404 page
