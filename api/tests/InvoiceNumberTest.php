<?php

declare(strict_types=1);

require_once __DIR__ . '/../lib/InvoiceNumber.php';

use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\Attributes\Test;

final class InvoiceNumberTest extends TestCase
{
    #[Test]
    public function it_parses_a_well_formed_number(): void
    {
        $this->assertSame(
            ['year_prefix' => '26', 'sequence_number' => 42],
            parseInvoiceNumber('26-0042')
        );
    }

    #[Test]
    public function it_strips_leading_zeros_from_sequence(): void
    {
        $this->assertSame(
            ['year_prefix' => '26', 'sequence_number' => 1],
            parseInvoiceNumber('26-0001')
        );
    }

    #[Test]
    public function it_rejects_missing_separator(): void
    {
        $this->assertNull(parseInvoiceNumber('260042'));
    }

    #[Test]
    public function it_rejects_wrong_year_width(): void
    {
        $this->assertNull(parseInvoiceNumber('2026-0042'));
    }

    #[Test]
    public function it_rejects_wrong_sequence_width(): void
    {
        $this->assertNull(parseInvoiceNumber('26-42'));
        $this->assertNull(parseInvoiceNumber('26-00042'));
    }

    #[Test]
    public function it_rejects_non_digits(): void
    {
        $this->assertNull(parseInvoiceNumber('2A-0042'));
        $this->assertNull(parseInvoiceNumber('26-00X2'));
    }
}
