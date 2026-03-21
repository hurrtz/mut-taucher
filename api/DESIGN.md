# DESIGN.md

## Backend Architecture

```mermaid
flowchart LR
  Request[HTTP request] --> FrontController[index.php]
  FrontController --> PublicRoutes[routes/public.php and routes/webhooks.php]
  FrontController --> AdminRoutes[routes/admin.php clients.php therapies.php groups.php templates.php branding.php workbook.php client_history.php]
  PublicRoutes --> Helpers[lib/*.php and slots.php]
  AdminRoutes --> Helpers
  Helpers --> DB[(MySQL)]
  Helpers --> Assets[api/assets]
  Helpers --> Mail[Mailer]
  Helpers --> PDF[PdfGenerator]
  Helpers --> Payments[StripeCheckout and PayPalCheckout]
```

## Public Booking Flow

```mermaid
sequenceDiagram
  actor Visitor
  participant Public as routes/public.php
  participant Slots as slots.php
  participant DB as MySQL
  participant Invoice as InvoiceNumber and BookingInvoice
  participant Notify as BookingNotification and Mailer
  participant Payments as StripeCheckout or PayPalCheckout

  Visitor->>Public: POST /api/bookings
  Public->>Slots: generateSlots(date, date)
  Slots->>DB: load rules, events, and reserved bookings
  Slots-->>Public: availability decision
  Public->>DB: insert booking with pending_payment
  Public->>Invoice: generate invoice number
  Public->>DB: auto-create linked patient when possible

  alt stripe or paypal branch
    Public->>Payments: create checkout session or order
    Payments-->>Public: redirect URL
  else wire transfer branch
    Public->>Notify: send booking email and invoice
  end

  Public->>Notify: send therapist notification
  Public-->>Visitor: payment-aware response
```

## Document and Branding Flow

```mermaid
sequenceDiagram
  participant Admin as Admin API route
  participant Registry as DocumentRegistry
  participant PDF as PdfGenerator
  participant DB as MySQL
  participant Assets as api/assets
  participant Mail as Mailer

  Admin->>Registry: resolve document context and keys
  Admin->>PDF: resolve sending point to template key
  PDF->>DB: load DB template and branding settings
  alt DB template exists
    PDF->>PDF: replace placeholders and apply branding
  else fallback template
    PDF->>PDF: include PHP template from templates/pdf
  end
  PDF-->>Admin: rendered PDF bytes
  Admin->>Mail: send email with PDF or link
  Admin->>Assets: archive sent document when required
```

## Stable Design Decisions

- The backend stays framework-free and function-oriented: route files contain request handling, while reusable operational logic lives in `lib/`.
- `slots.php` is the canonical availability engine for public booking; it derives availability from recurring rules, exceptions, events, and bookings with reserved states.
- Bookings are inserted as `pending_payment` first, which lets the system reserve the slot before payment confirmation or manual completion.
- `Mailer` selects Brevo when configured, otherwise SMTP, and retries once on transient delivery failures.
- `PdfGenerator` prefers DB-backed HTML templates and falls back to file templates, while still applying brand styling and placeholder replacement consistently.
- Patient history is assembled from multiple operational tables rather than stored as a separate event log, which keeps the timeline derived from source records.
