<?php

declare(strict_types=1);

require_once __DIR__ . '/../lib/InvoiceNumber.php';

use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\Attributes\Test;

final class SessionCostTest extends TestCase
{
    #[Test]
    public function it_returns_default_when_override_is_null(): void
    {
        $this->assertSame(12000, resolveSessionCost(null, 12000));
    }

    #[Test]
    public function it_returns_override_when_set(): void
    {
        $this->assertSame(15000, resolveSessionCost(15000, 12000));
    }

    #[Test]
    public function it_treats_zero_override_as_valid_free_session(): void
    {
        $this->assertSame(0, resolveSessionCost(0, 12000));
    }
}
