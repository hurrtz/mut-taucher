# Stripe Payment Integration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to pay for Erstgespräch (95 EUR) via Stripe Checkout or wire transfer during the booking flow.

**Architecture:** Stripe Checkout (hosted) redirect flow. Booking created with `pending_payment` status, confirmed via Stripe webhook or manual therapist action. No embedded card form — redirect to Stripe's hosted page.

**Tech Stack:** PHP (stripe/stripe-php SDK), React/TypeScript frontend, MySQL

---

### Task 1: Database migration — payment columns and status enum

**Files:**
- Create: `api/migrations/032_booking_payment.sql`

**Step 1: Write the migration**

```sql
-- Add payment columns
ALTER TABLE bookings ADD COLUMN payment_method VARCHAR(20) DEFAULT NULL;
ALTER TABLE bookings ADD COLUMN payment_id VARCHAR(255) DEFAULT NULL;

-- Expand status enum to include pending_payment
ALTER TABLE bookings MODIFY COLUMN status ENUM('pending_payment','confirmed','cancelled') NOT NULL DEFAULT 'pending_payment';
```

**Step 2: Run the migration**

Run: `php api/migrate.php`
Expected: Migration 032 applied successfully.

**Step 3: Commit**

```bash
git add api/migrations/032_booking_payment.sql
git commit -m "feat: add payment_method, payment_id columns and pending_payment status"
```

---

### Task 2: Config — add Stripe and bank transfer settings

**Files:**
- Modify: `api/config.example.php`

**Step 1: Add Stripe and bank config keys**

Add after the SMTP block in `api/config.example.php`:

```php
// Stripe
'stripe_secret_key'       => '',
'stripe_publishable_key'  => '',
'stripe_webhook_secret'   => '',

// Bank transfer details (shown to clients choosing Überweisung)
'bank_account_holder' => '',
'bank_iban'           => '',
'bank_bic'            => '',
'bank_name'           => '',
```

**Step 2: Add the same keys to local `api/config.php`** with actual Stripe test keys.

**Step 3: Commit**

```bash
git add api/config.example.php
git commit -m "feat: add Stripe and bank transfer config keys"
```

---

### Task 3: Install Stripe PHP SDK

**Files:**
- Modify: `api/composer.json`

**Step 1: Add dependency**

Run: `cd api && composer require stripe/stripe-php`

**Step 2: Verify**

Run: `php -r "require 'vendor/autoload.php'; echo \Stripe\Stripe::VERSION;"`
Expected: Prints Stripe SDK version.

**Step 3: Commit**

```bash
git add api/composer.json api/composer.lock
git commit -m "feat: add stripe/stripe-php SDK dependency"
```

---

### Task 4: Stripe helper — create Checkout Sessions

**Files:**
- Create: `api/lib/StripeCheckout.php`

**Step 1: Write the helper**

```php
<?php

require_once __DIR__ . '/../vendor/autoload.php';

/**
 * Create a Stripe Checkout Session for a booking.
 */
function createStripeCheckoutSession(int $bookingId, int $amountCents, string $description, string $customerEmail): string {
    $config = require __DIR__ . '/../config.php';
    \Stripe\Stripe::setApiKey($config['stripe_secret_key']);

    $siteUrl = rtrim($config['site_url'] ?? '', '/');

    $session = \Stripe\Checkout\Session::create([
        'payment_method_types' => ['card'],
        'mode' => 'payment',
        'customer_email' => $customerEmail,
        'line_items' => [[
            'price_data' => [
                'currency' => 'eur',
                'unit_amount' => $amountCents,
                'product_data' => [
                    'name' => $description,
                ],
            ],
            'quantity' => 1,
        ]],
        'metadata' => [
            'booking_id' => (string)$bookingId,
        ],
        'success_url' => $siteUrl . '/booking/success?session_id={CHECKOUT_SESSION_ID}',
        'cancel_url' => $siteUrl . '/booking/cancelled',
    ]);

    return $session->url;
}
```

**Step 2: Commit**

```bash
git add api/lib/StripeCheckout.php
git commit -m "feat: add Stripe Checkout Session helper"
```

---

### Task 5: Stripe webhook endpoint

**Files:**
- Create: `api/routes/webhooks.php`
- Modify: `api/index.php` — register route

**Step 1: Write the webhook handler**

```php
<?php

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../db.php';

/**
 * POST /api/webhooks/stripe
 * Receives Stripe webhook events. No auth — verified via signature.
 */
function handleStripeWebhook(): void {
    $config = require __DIR__ . '/../config.php';
    $payload = file_get_contents('php://input');
    $sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

    try {
        $event = \Stripe\Webhook::constructEvent(
            $payload,
            $sigHeader,
            $config['stripe_webhook_secret']
        );
    } catch (\Exception $e) {
        http_response_code(400);
        echo json_encode(['error' => 'Webhook signature verification failed']);
        return;
    }

    if ($event->type === 'checkout.session.completed') {
        $session = $event->data->object;
        $bookingId = (int)($session->metadata->booking_id ?? 0);

        if ($bookingId > 0) {
            $db = getDB();

            // Update booking status to confirmed
            $stmt = $db->prepare(
                'UPDATE bookings SET status = "confirmed", payment_id = ? WHERE id = ? AND status = "pending_payment"'
            );
            $stmt->execute([$session->id, $bookingId]);

            // Send confirmation email if booking was updated
            if ($stmt->rowCount() > 0) {
                try {
                    require_once __DIR__ . '/../lib/Mailer.php';
                    $stmt = $db->prepare('SELECT * FROM bookings WHERE id = ?');
                    $stmt->execute([$bookingId]);
                    $booking = $stmt->fetch();

                    if ($booking) {
                        $mailer = new Mailer();
                        $clientName = trim($booking['client_first_name'] . ' ' . $booking['client_last_name']);
                        $dateFormatted = date('d.m.Y', strtotime($booking['booking_date']));
                        $time = $booking['booking_time'];
                        $duration = (int)$booking['duration_minutes'];
                        $therapistName = $config['therapist_name'] ?? 'Mut-Taucher Praxis';
                        $siteUrl = $config['site_url'] ?? '';

                        ob_start();
                        include __DIR__ . '/../templates/email/booking_confirmation.php';
                        $htmlBody = ob_get_clean();

                        $mailer->send(
                            $booking['client_email'],
                            $clientName,
                            'Terminbestätigung — ' . $therapistName,
                            $htmlBody
                        );
                    }
                } catch (\Exception $e) {
                    // Don't fail the webhook if email fails
                }
            }
        }
    }

    echo json_encode(['received' => true]);
}
```

**Step 2: Register route in `api/index.php`**

Add after `require_once __DIR__ . '/routes/branding.php';`:

```php
require_once __DIR__ . '/routes/webhooks.php';
```

Add before the `// Public routes` section (webhook must be before auth-protected routes, and must NOT require auth):

```php
// Webhooks (no auth — verified via signature)
if ($method === 'POST' && $uri === '/webhooks/stripe') {
    handleStripeWebhook();
    exit;
}
```

**Step 3: Commit**

```bash
git add api/routes/webhooks.php api/index.php
git commit -m "feat: add Stripe webhook endpoint for payment confirmation"
```

---

### Task 6: Update slot availability — include pending_payment

**Files:**
- Modify: `api/slots.php:40-46` and `api/slots.php:117-121`

**Step 1: Change booking filter queries**

In `api/slots.php`, find both occurrences of:
```sql
WHERE status = "confirmed"
```

Replace with:
```sql
WHERE status IN ("pending_payment", "confirmed")
```

There are two queries:
- Line ~43: rule-based bookings
- Line ~119: event-based bookings

**Step 2: Verify slots endpoint still works**

Run: `curl "http://localhost:8000/api/slots?from=2026-03-09&to=2026-03-15"`
Expected: JSON array of available slots.

**Step 3: Commit**

```bash
git add api/slots.php
git commit -m "fix: treat pending_payment bookings as unavailable slots"
```

---

### Task 7: Update booking creation — payment method and Stripe redirect

**Files:**
- Modify: `api/routes/public.php` — `handleCreateBooking()`

**Step 1: Update handleCreateBooking**

In `handleCreateBooking()`, add extraction of `paymentMethod` from input (after `$message`):

```php
$paymentMethod = $input['paymentMethod'] ?? 'wire_transfer';
if (!in_array($paymentMethod, ['stripe', 'wire_transfer'], true)) {
    $paymentMethod = 'wire_transfer';
}
```

Change the INSERT statement to include the new columns and set `status = 'pending_payment'`:

```sql
INSERT INTO bookings (rule_id, event_id, booking_date, booking_time, duration_minutes, client_first_name, client_last_name, client_email, client_phone, client_street, client_zip, client_city, client_message, status, payment_method)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_payment', ?)
```

Add `$paymentMethod` to the execute params array.

After `$bookingId = $db->lastInsertId();`, add Stripe session creation:

```php
$stripeCheckoutUrl = null;
if ($paymentMethod === 'stripe') {
    require_once __DIR__ . '/../lib/StripeCheckout.php';
    $stripeCheckoutUrl = createStripeCheckoutSession(
        (int)$bookingId,
        9500, // 95.00 EUR in cents
        'Erstgespräch (50 Minuten)',
        $email
    );
}
```

Move the confirmation email sending: for Stripe, the email is sent by the webhook after payment. For wire_transfer, send it immediately (with bank transfer details). Update the email sending block:

```php
if ($paymentMethod === 'wire_transfer') {
    // Send booking confirmation email with bank details for wire transfer
    try {
        require_once __DIR__ . '/../lib/Mailer.php';
        $config = require __DIR__ . '/../config.php';
        $mailer = new Mailer();

        $clientName = "$firstName $lastName";
        $dateFormatted = date('d.m.Y', strtotime($date));
        $duration = $durationMinutes;
        $therapistName = $config['therapist_name'] ?? 'Mut-Taucher Praxis';
        $siteUrl = $config['site_url'] ?? '';

        ob_start();
        include __DIR__ . '/../templates/email/booking_confirmation.php';
        $htmlBody = ob_get_clean();

        $mailer->send(
            $email,
            $clientName,
            'Terminbestätigung — ' . ($config['therapist_name'] ?? 'Mut-Taucher'),
            $htmlBody
        );
    } catch (Exception $e) {
        // Don't fail the booking if email fails
    }
}
```

Update the response to include `stripeCheckoutUrl` and `bankDetails`:

```php
$config = require __DIR__ . '/../config.php';
$response = [
    'id'      => (int)$bookingId,
    'message' => 'Termin erfolgreich gebucht',
    'paymentMethod' => $paymentMethod,
];

if ($stripeCheckoutUrl) {
    $response['stripeCheckoutUrl'] = $stripeCheckoutUrl;
}

if ($paymentMethod === 'wire_transfer') {
    $response['bankDetails'] = [
        'accountHolder' => $config['bank_account_holder'] ?? '',
        'iban'          => $config['bank_iban'] ?? '',
        'bic'           => $config['bank_bic'] ?? '',
        'bankName'      => $config['bank_name'] ?? '',
        'amount'        => '95,00 €',
        'reference'     => "Erstgespräch #{$bookingId}",
    ];
}

echo json_encode($response);
```

**Step 2: Commit**

```bash
git add api/routes/public.php
git commit -m "feat: support payment method selection in booking creation"
```

---

### Task 8: Admin — confirm pending bookings

**Files:**
- Modify: `api/routes/admin.php` — `handleUpdateBooking()`

**Step 1: Extend handleUpdateBooking to support confirming**

Currently `handleUpdateBooking` deletes the booking when `status === 'cancelled'`. Update to also handle `status === 'confirmed'`:

Replace the status handling block (lines ~349-353):

```php
if (isset($input['status'])) {
    if ($input['status'] === 'cancelled') {
        $db->prepare('DELETE FROM bookings WHERE id = ?')->execute([$id]);
        echo json_encode(['message' => 'Buchung gelöscht']);
        return;
    }
    if ($input['status'] === 'confirmed') {
        $fields[] = 'status = ?';
        $params[] = 'confirmed';
    }
}
```

**Step 2: Add paymentMethod and paymentId to booking response in handleGetBookings**

In the `$result` array_map in `handleGetBookings()`, add:

```php
'paymentMethod'   => $b['payment_method'],
'paymentId'       => $b['payment_id'],
```

**Step 3: Commit**

```bash
git add api/routes/admin.php
git commit -m "feat: allow admin to confirm pending bookings and show payment info"
```

---

### Task 9: Frontend — update usePublicBooking hook

**Files:**
- Modify: `src/lib/usePublicBooking.ts`

**Step 1: Update BookingResult type and bookSlot function**

Add `paymentMethod` parameter to `bookSlot`. Update the `BookingResult` type:

```typescript
interface BookingResult {
  id: number;
  message: string;
  paymentMethod: string;
  stripeCheckoutUrl?: string;
  bankDetails?: {
    accountHolder: string;
    iban: string;
    bic: string;
    bankName: string;
    amount: string;
    reference: string;
  };
}
```

Add `paymentMethod: string` parameter to `bookSlot` (after `message`). Include it in the request body:

```typescript
const body: Record<string, unknown> = { date, time, firstName, lastName, email, phone, street, zip, city, paymentMethod };
```

**Step 2: Commit**

```bash
git add src/lib/usePublicBooking.ts
git commit -m "feat: add paymentMethod to booking hook and response types"
```

---

### Task 10: Frontend — payment method selector in booking modal

**Files:**
- Modify: `src/components/Booking.tsx`

**Step 1: Add payment method state**

After the `consent` state declaration, add:

```typescript
const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'wire_transfer'>('stripe');
```

**Step 2: Add payment method selector UI**

In the modal form, between the message textarea and the payment info block (the `bg-gray-50` div), add:

```tsx
{/* Payment method selector */}
<fieldset className="space-y-2">
  <legend className="text-sm font-medium text-gray-700">Zahlungsart *</legend>
  <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
    ${paymentMethod === 'stripe' ? 'border-primary bg-teal-50' : 'border-gray-200 hover:border-gray-300'}">
    <input type="radio" name="paymentMethod" value="stripe" checked={paymentMethod === 'stripe'}
      onChange={() => setPaymentMethod('stripe')}
      className="text-primary focus:ring-primary" />
    <div>
      <span className="text-sm font-medium text-text">Kreditkarte / Online-Zahlung</span>
      <span className="block text-xs text-gray-400">Sichere Zahlung über Stripe</span>
    </div>
  </label>
  <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
    ${paymentMethod === 'wire_transfer' ? 'border-primary bg-teal-50' : 'border-gray-200 hover:border-gray-300'}">
    <input type="radio" name="paymentMethod" value="wire_transfer" checked={paymentMethod === 'wire_transfer'}
      onChange={() => setPaymentMethod('wire_transfer')}
      className="text-primary focus:ring-primary" />
    <div>
      <span className="text-sm font-medium text-text">Überweisung</span>
      <span className="block text-xs text-gray-400">Bankdaten werden nach der Buchung angezeigt</span>
    </div>
  </label>
</fieldset>
```

**Step 3: Pass paymentMethod to bookSlot and handle response**

Update the `handleBook` function. Pass `paymentMethod` to `bookSlot`. After receiving the result:

```typescript
if (result) {
  trackBookingSubmitted(selectedSlot.date, selectedSlot.time);

  if (result.stripeCheckoutUrl) {
    // Redirect to Stripe Checkout
    window.location.href = result.stripeCheckoutUrl;
    return;
  }

  if (result.bankDetails) {
    // Show bank transfer details
    setBankDetails(result.bankDetails);
    setSelectedSlot(null);
    setIsSuccess(true);
    // ... reset form after delay
  }
}
```

Add state for bank details:

```typescript
const [bankDetails, setBankDetails] = useState<BookingResult['bankDetails'] | null>(null);
```

**Step 4: Update success view for wire transfer**

When `isSuccess && bankDetails`, show the bank transfer details in the success panel instead of the generic message:

```tsx
{isSuccess && (
  <div className="...">
    <CheckCircle className="..." />
    <h3>Termin reserviert!</h3>
    {bankDetails ? (
      <div>
        <p>Bitte überweisen Sie den Betrag, um Ihren Termin zu bestätigen:</p>
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-left space-y-1">
          <p><strong>Empfänger:</strong> {bankDetails.accountHolder}</p>
          <p><strong>IBAN:</strong> {bankDetails.iban}</p>
          <p><strong>BIC:</strong> {bankDetails.bic}</p>
          <p><strong>Bank:</strong> {bankDetails.bankName}</p>
          <p><strong>Betrag:</strong> {bankDetails.amount}</p>
          <p><strong>Verwendungszweck:</strong> {bankDetails.reference}</p>
        </div>
      </div>
    ) : (
      <p>Zahlung erfolgreich. Eine Bestätigung wurde an Ihre E-Mail gesendet.</p>
    )}
  </div>
)}
```

**Step 5: Commit**

```bash
git add src/components/Booking.tsx
git commit -m "feat: add payment method selector and Stripe redirect in booking modal"
```

---

### Task 11: Frontend — BookingSuccess page

**Files:**
- Create: `src/pages/BookingSuccess.tsx`
- Modify: `src/App.tsx` — add route

**Step 1: Create the success page**

```tsx
import { Link } from 'react-router-dom';
import { useDocumentMeta } from '../lib/useDocumentMeta';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { CheckCircle } from 'lucide-react';

export default function BookingSuccess() {
  useDocumentMeta({ title: 'Zahlung erfolgreich' });

  return (
    <>
      <Header />
      <div className="pt-24 pb-20 bg-background min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <CheckCircle className="h-16 w-16 text-primary mx-auto mb-6" />
          <h1 className="text-2xl font-serif font-bold text-text mb-4">Zahlung erfolgreich!</h1>
          <p className="text-gray-600 mb-2">
            Vielen Dank — Ihr Termin ist nun bestätigt.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            Sie erhalten in Kürze eine Bestätigung per E-Mail mit allen Details.
          </p>
          <Link to="/" className="inline-flex items-center px-6 py-3 bg-primary hover:bg-teal-500 text-white font-semibold rounded-full transition-colors">
            Zurück zur Startseite
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
```

**Step 2: Create BookingCancelled page**

Create `src/pages/BookingCancelled.tsx`:

```tsx
import { Link } from 'react-router-dom';
import { useDocumentMeta } from '../lib/useDocumentMeta';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { XCircle } from 'lucide-react';

export default function BookingCancelled() {
  useDocumentMeta({ title: 'Zahlung abgebrochen' });

  return (
    <>
      <Header />
      <div className="pt-24 pb-20 bg-background min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <XCircle className="h-16 w-16 text-gray-400 mx-auto mb-6" />
          <h1 className="text-2xl font-serif font-bold text-text mb-4">Zahlung abgebrochen</h1>
          <p className="text-gray-600 mb-2">
            Die Zahlung wurde nicht abgeschlossen. Ihr Termin wurde nicht bestätigt.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            Sie können es jederzeit erneut versuchen.
          </p>
          <Link to="/#booking" className="inline-flex items-center px-6 py-3 bg-primary hover:bg-teal-500 text-white font-semibold rounded-full transition-colors">
            Erneut buchen
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
```

**Step 3: Add routes in App.tsx**

After the `/agb` route, add:

```tsx
<Route path="/booking/success" element={<BookingSuccess />} />
<Route path="/booking/cancelled" element={<BookingCancelled />} />
```

Add imports at the top:

```tsx
import BookingSuccess from './pages/BookingSuccess';
import BookingCancelled from './pages/BookingCancelled';
```

**Step 4: Commit**

```bash
git add src/pages/BookingSuccess.tsx src/pages/BookingCancelled.tsx src/App.tsx
git commit -m "feat: add booking success and cancelled pages with routes"
```

---

### Task 12: Admin frontend — show payment status

**Files:**
- Modify: `src/admin/tabs/BookingsTab.tsx` (or wherever bookings are rendered)

**Step 1: Show payment method and pending_payment status**

In the bookings list, add visual indicators:
- `pending_payment` → amber badge "Zahlung ausstehend"
- `confirmed` → green badge "Bestätigt"
- Show payment method icon/label

Add a "Bestätigen" button for pending_payment bookings that calls `PATCH /api/admin/bookings/:id` with `{ status: 'confirmed' }`.

**Step 2: Commit**

```bash
git add src/admin/tabs/BookingsTab.tsx
git commit -m "feat: show payment status and confirm button in admin bookings"
```

---

### Task 13: End-to-end verification

**Step 1: Test Stripe flow**

1. Start dev servers: `npm run dev` and `php -S localhost:8000 -t api/`
2. Book a slot with "Kreditkarte" selected
3. Verify redirect to Stripe Checkout (use test card 4242 4242 4242 4242)
4. Verify redirect back to `/booking/success`
5. Check database: booking status should be `confirmed` after webhook

**Step 2: Test wire transfer flow**

1. Book a slot with "Überweisung" selected
2. Verify bank details shown in success panel
3. Check database: booking status should be `pending_payment`
4. In admin, confirm the booking manually
5. Verify status changes to `confirmed`

**Step 3: Test slot availability**

1. Book a slot (pending_payment)
2. Verify that slot no longer appears in the public calendar

**Step 4: Set up Stripe webhook for production**

In Stripe Dashboard → Webhooks → Add endpoint:
- URL: `https://your-domain.com/api/webhooks/stripe`
- Events: `checkout.session.completed`
- Copy webhook signing secret to `config.php`

For local testing, use Stripe CLI:
```bash
stripe listen --forward-to localhost:8000/api/webhooks/stripe
```
