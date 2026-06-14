<?php

declare(strict_types=1);

require_once __DIR__ . '/../lib/TherapyCredit.php';

use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\Attributes\Test;

final class TherapyCreditTest extends TestCase
{
    private function session(array $overrides = []): array
    {
        return array_merge([
            'status'                     => 'scheduled',
            'payment_status'             => 'due',
            'paid_from_credit'           => 0,
            'invoice_sent'               => 0,
            'session_cost_cents_override' => null,
        ], $overrides);
    }

    // ─── Credit derivation ─────────────────────────────────────────

    #[Test]
    public function no_sessions_means_no_credit(): void
    {
        $this->assertSame(0, therapyNetCreditFromRows([]));
    }

    #[Test]
    public function cancelled_but_unpaid_session_creates_no_credit(): void
    {
        $rows = [$this->session(['status' => 'cancelled', 'payment_status' => 'due'])];
        $this->assertSame(0, therapyNetCreditFromRows($rows));
    }

    #[Test]
    public function paid_then_cancelled_session_is_a_credit_source(): void
    {
        $rows = [$this->session(['status' => 'cancelled', 'payment_status' => 'paid'])];
        $this->assertSame(1, therapyNetCreditFromRows($rows));
    }

    #[Test]
    public function multiple_paid_cancellations_accumulate(): void
    {
        $rows = [
            $this->session(['status' => 'cancelled', 'payment_status' => 'paid']),
            $this->session(['status' => 'cancelled', 'payment_status' => 'paid']),
            $this->session(['status' => 'completed', 'payment_status' => 'paid']),
        ];
        $this->assertSame(2, therapyNetCreditFromRows($rows));
    }

    #[Test]
    public function a_credit_covered_session_consumes_one_source(): void
    {
        $rows = [
            $this->session(['status' => 'cancelled', 'payment_status' => 'paid']),          // source
            $this->session(['status' => 'completed', 'payment_status' => 'paid', 'paid_from_credit' => 1]), // consumer
        ];
        $this->assertSame(0, therapyNetCreditFromRows($rows));
    }

    #[Test]
    public function net_credit_never_goes_negative(): void
    {
        $rows = [
            $this->session(['status' => 'completed', 'payment_status' => 'paid', 'paid_from_credit' => 1]),
            $this->session(['status' => 'completed', 'payment_status' => 'paid', 'paid_from_credit' => 1]),
        ];
        $this->assertSame(0, therapyNetCreditFromRows($rows));
    }

    #[Test]
    public function cancelling_a_credit_covered_session_returns_the_credit(): void
    {
        // The consumer got cancelled: it is neither a source (paid_from_credit=1) nor a
        // consumer (cancelled), so the original source's credit is available again.
        $rows = [
            $this->session(['status' => 'cancelled', 'payment_status' => 'paid']),                    // source
            $this->session(['status' => 'cancelled', 'payment_status' => 'paid', 'paid_from_credit' => 1]), // cancelled consumer
        ];
        $this->assertSame(1, therapyNetCreditFromRows($rows));
    }

    // ─── Package invoice selection ─────────────────────────────────

    #[Test]
    public function package_selection_includes_only_open_uninvoiced_held_sessions(): void
    {
        $rows = [
            $this->session(['status' => 'scheduled', 'payment_status' => 'due']),                 // ✓
            $this->session(['status' => 'completed', 'payment_status' => 'due']),                 // ✓
            $this->session(['status' => 'cancelled', 'payment_status' => 'due']),                 // ✗ cancelled
            $this->session(['status' => 'completed', 'payment_status' => 'paid']),                // ✗ already paid
            $this->session(['status' => 'completed', 'payment_status' => 'due', 'invoice_sent' => 1]), // ✗ already invoiced
        ];
        $this->assertCount(2, packageInvoiceSessions($rows));
    }

    #[Test]
    public function package_total_sums_costs_with_overrides(): void
    {
        $rows = [
            $this->session(),                                                     // default 12000
            $this->session(['session_cost_cents_override' => 9000]),             // override 9000
            $this->session(['session_cost_cents_override' => 0]),                // free session
        ];
        $this->assertSame(21000, packageInvoiceTotalCents($rows, 12000));
    }
}
