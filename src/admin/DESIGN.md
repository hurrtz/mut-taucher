# DESIGN.md

## Route Architecture

```mermaid
flowchart TD
  App[App.tsx] --> Suspense[AdminSuspense]
  Suspense --> Layout[AdminLayout]
  Layout --> Kalender[CalendarTab]
  Layout --> Erstgespraeche[BookingsTab]
  Layout --> Einzel[TherapiesTab]
  Layout --> Gruppen[GroupsTab]
  Layout --> Kunden[PatientsTab]
  Layout --> Dokumente[TemplatesTab]
  Layout --> Arbeitsmappe[WorkbookTab]
  Layout --> ClientDetail[pages/ClientDetail.tsx]
```

## Route and Hook Ownership

| UI surface | Primary hooks | Durable responsibility |
|---|---|---|
| `AdminLayout` | `useAdminBooking` | Auth gate, login/logout, nav counts, shared shell |
| `CalendarTab` | `useAdminBooking` | Rules, events, blocked days, calendar session preview, cancellations |
| `BookingsTab` | `useAdminBooking`, `useAdminClients` | Intro-call bookings, booking/payment-request visibility, status/payment actions, deferred invoice generation, migration to patient |
| `TherapiesTab` | `useAdminTherapies`, `useAdminClients` | Individual therapies and session lifecycle |
| `GroupsTab` | `useAdminGroups`, `useAdminClients` | Group setup, participants, sessions, attendance, invoices |
| `PatientsTab` | `useAdminClients` | Patient list and navigation into detail history |
| `ClientDetail` | `useClientHistory` | Timeline aggregation, notes, sent/received documents |
| `TemplatesTab` | `useAdminTemplates`, `useAdminBranding` | Template CRUD, preview, mappings, branding, logo variants |
| `WorkbookTab` | `useAdminWorkbook`, `useAdminTherapies`, `useAdminGroups`, `useAdminClients` | Material library and distribution targeting |

## Login and Shell Flow

```mermaid
sequenceDiagram
  actor Therapist
  participant Layout as AdminLayout
  participant Hook as useAdminBooking
  participant API as /api/login and /api/admin/counts
  participant Storage as sessionStorage

  Therapist->>Layout: submit password
  Layout->>Hook: login(password)
  Hook->>API: POST /login
  API-->>Hook: JWT
  Hook->>Storage: set token
  Hook-->>Layout: authenticated
  Layout->>API: GET /admin/counts
  API-->>Layout: sidebar badge counts
```

## Stable Design Decisions

- The admin shell is route-based rather than tab-state-based; navigation is URL-addressable and each tab mounts independently.
- Auth ownership stays in `AdminLayout`, while feature ownership stays inside the tab or detail page that needs the data.
- `BookingsTab` is the control point for the transition from booking confirmation/payment request to invoice creation, so it must mirror server truth after every status change rather than rely on optimistic flags alone.
- Binary workflows such as template preview, workbook preview, and document downloads use raw `fetch()` or query-token URLs when `apiFetch()` is not sufficient for `FormData` or binary responses.
- Ant Design is the design system for the admin area, with `src/admin/theme.ts`, `src/admin/styles.ts`, and shared constants carrying the common visual language.
