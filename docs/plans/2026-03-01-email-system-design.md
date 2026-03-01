# Email System Design

**Date**: 2026-03-01
**Status**: Approved

## Goal

SMTP-based email system with PDF document generation for the Mut-Taucher therapy website. 6 email types: contact form copy, booking confirmation, and 4 legal documents as PDF attachments.

## Approach

PHPMailer for SMTP delivery + TCPDF for PDF generation, integrated into the existing PHP backend. No new services or infrastructure.

## Email Types

| # | Email | Trigger | Attachments |
|---|---|---|---|
| 1 | Contact form copy | Auto — user submits contact form with "sendCopy" checked | None |
| 2 | Booking confirmation | Auto — user books introductory call | None |
| 3 | Introductory call contract | Manual — admin panel | PDF: Behandlungsvertrag |
| 4 | DSGVO Art. 13 information | Manual — admin panel | PDF: Datenschutzinformation |
| 5 | Confidentiality release | Manual — admin panel | PDF: Schweigepflichtentbindung |
| 6 | Online therapy agreement | Manual — admin panel | PDF: Vereinbarung Onlinetherapie |

## Architecture

### Dependencies (Composer)

- `phpmailer/phpmailer` — SMTP email delivery
- `tecnickcom/tcpdf` — PDF generation

### New Files

```
api/
├── lib/
│   └── Mailer.php                         # PHPMailer wrapper (SMTP config from config.php)
├── templates/
│   ├── pdf/
│   │   ├── behandlungsvertrag.php         # Contract template
│   │   ├── datenschutzinfo.php            # DSGVO Art. 13 template
│   │   ├── schweigepflichtentbindung.php  # Confidentiality release template
│   │   └── onlinetherapie.php             # Online therapy agreement template
│   └── email/
│       ├── contact_copy.php               # Contact form copy email body
│       ├── booking_confirmation.php       # Booking confirmation email body
│       └── document_cover.php             # Cover letter for PDF document emails
├── migrations/
│   └── 005_document_tracking.sql          # Add _sent columns to bookings
```

### Modified Files

| File | Change |
|---|---|
| `api/config.php` | Add SMTP credentials (host, port, user, pass, from_email, from_name) |
| `api/index.php` | Add `POST /contact` and `POST /admin/bookings/:id/document` routes |
| `api/routes/admin.php` | Refactor `handleSendEmail` to use Mailer class |
| `api/routes/public.php` | Add contact form handler, auto-send booking confirmation |
| `src/lib/useAdminBooking.ts` | Add `sendDocument()` function |
| `src/pages/Admin.tsx` | Add document buttons with sent-status UI |
| `composer.json` | Add phpmailer + tcpdf dependencies |

### API Routes

| Method | Route | Auth | Purpose |
|---|---|---|---|
| `POST` | `/contact` | Public | Handle contact form submission |
| `POST` | `/admin/bookings/:id/document` | Admin | Send document email with PDF attachment |

### Database Changes

```sql
ALTER TABLE bookings ADD COLUMN contract_sent TINYINT(1) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN dsgvo_sent TINYINT(1) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN confidentiality_sent TINYINT(1) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN online_therapy_sent TINYINT(1) DEFAULT 0;
```

### SMTP Config (config.php)

```php
'smtp_host' => 'smtp.example.com',
'smtp_port' => 587,
'smtp_user' => 'user@example.com',
'smtp_pass' => '...',
'smtp_from_email' => 'praxis@mut-taucher.de',
'smtp_from_name' => 'Mut-Taucher Praxis',
```

### PDF Templates

Each PDF template receives booking data ($clientName, $bookingDate, $bookingTime) and returns a TCPDF instance. Generated on-the-fly, not stored on disk. All templates include:
- Mut-Taucher header/logo
- Client name and date
- Placeholder legal text (to be filled in by therapist/lawyer)

### Admin UI

Booking detail view gets a "Dokumente" section with 4 buttons:
- Behandlungsvertrag senden (checkmark when sent)
- Datenschutzinformation senden (checkmark when sent)
- Schweigepflichtentbindung senden (checkmark when sent)
- Vereinbarung Onlinetherapie senden (checkmark when sent)

## Non-Goals

- Email tracking / open rates
- Template editor UI
- Bulk email sending
- Email queue / retry system
- Digital signatures on PDFs
