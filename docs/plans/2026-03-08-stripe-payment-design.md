# Stripe Payment Integration — Design

## Goal

Allow users to pay for Erstgespräch (initial consultation, 95 EUR) via Stripe Checkout or wire transfer (Überweisung) during the booking flow. PayPal will be added later as a separate step.

## Booking Status Model

Current `status` enum `('confirmed', 'cancelled')` becomes `('pending_payment', 'confirmed', 'cancelled')`.

- **`pending_payment`** — Booking created, awaiting payment (Stripe or wire transfer)
- **`confirmed`** — Payment received (automatically via Stripe webhook, or manually by therapist for wire transfer)
- **`cancelled`** — Therapist cancels the booking, slot freed

New columns on `bookings`:
- `payment_method` — `'stripe' | 'paypal' | 'wire_transfer'` (paypal reserved for later)
- `payment_id` — Stripe Checkout Session ID (nullable, empty for wire transfer)

## Slot Availability

Slots with `pending_payment` or `confirmed` bookings are both treated as unavailable. The slot is reserved the moment the user books, regardless of payment method. The therapist can cancel a booking to free the slot.

## Flow: Stripe

```
User submits form (payment method = stripe)
  -> POST /api/bookings
     -> creates booking with status=pending_payment, payment_method=stripe
     -> creates Stripe Checkout Session (mode=payment, line item = Erstgespräch 95 EUR)
     -> stores Stripe session ID in bookings.payment_id
     -> returns { id, stripeCheckoutUrl }
  -> Frontend redirects to Stripe Checkout

Stripe payment succeeds:
  -> Stripe redirects user to /booking/success?session_id=...
  -> Stripe webhook POST /api/webhooks/stripe
     -> verifies signature
     -> on checkout.session.completed: updates booking to status=confirmed
     -> sends confirmation email

User cancels on Stripe page:
  -> Stripe redirects to /booking/cancelled
  -> Booking remains pending_payment (therapist can cancel later)
```

## Flow: Wire Transfer (Überweisung)

```
User submits form (payment method = wire_transfer)
  -> POST /api/bookings
     -> creates booking with status=pending_payment, payment_method=wire_transfer
     -> returns { id, bankDetails: { ... } }
  -> Frontend shows bank transfer details inline (no redirect)
  -> Confirmation email includes bank transfer details

Therapist confirms payment received:
  -> Admin panel: mark booking as confirmed
  -> Or: cancel booking to free slot
```

## Backend Changes

### New files
- `api/lib/Stripe.php` — wrapper to create Checkout Sessions
- `api/routes/webhooks.php` — `POST /api/webhooks/stripe`, signature verification, booking status update
- `api/migrations/032_booking_payment.sql` — adds payment_method, payment_id columns, updates status enum

### Modified files
- `api/routes/public.php` — `handleCreateBooking()` accepts paymentMethod, creates Stripe session for stripe payments
- `api/routes/bookings.php` — admin endpoint to manually confirm or cancel bookings
- `api/config.example.php` — add stripe_secret_key, stripe_publishable_key, stripe_webhook_secret
- `api/index.php` — register webhook route (no auth required)
- `api/composer.json` — add `stripe/stripe-php` dependency

### Config keys (config.php)
```php
'stripe_secret_key' => 'sk_...',
'stripe_publishable_key' => 'pk_...',
'stripe_webhook_secret' => 'whsec_...',
'bank_account_holder' => '...',
'bank_iban' => '...',
'bank_bic' => '...',
'bank_name' => '...',
```

## Frontend Changes

### New files
- `src/pages/BookingSuccess.tsx` — `/booking/success?session_id=...`, shows payment confirmation
- `src/pages/BookingCancelled.tsx` — `/booking/cancelled`, shows retry option

### Modified files
- `src/components/Booking.tsx` — payment method selector (Stripe / Überweisung) before submit, redirect logic for Stripe, bank details display for wire transfer
- `src/lib/usePublicBooking.ts` — bookSlot accepts paymentMethod, returns stripeCheckoutUrl
- `src/App.tsx` — add routes for /booking/success and /booking/cancelled

### Admin
- Bookings list shows `pending_payment` status with visual indicator
- Therapist can manually confirm (wire transfer received) or cancel a booking

## Decisions

- **Stripe Checkout (hosted)** over embedded Elements — no PCI scope, minimal frontend code
- **No PayPal in this iteration** — architecture supports it (payment_method column, selector UI) but implementation deferred
- **Indefinite reservation** — pending_payment bookings hold the slot until therapist confirms or cancels; no automatic expiry
- **Webhook as source of truth** — booking only moves to confirmed via webhook (Stripe) or manual action (wire transfer), never from the success redirect alone
