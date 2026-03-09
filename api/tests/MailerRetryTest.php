<?php

declare(strict_types=1);

// Mailer.php uses PHPMailer via require — ensure autoloader is available
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../lib/Mailer.php';

use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Tests the Mailer's isTransientError() logic via reflection,
 * since we can't easily mock external SMTP/Brevo calls.
 */
final class MailerRetryTest extends TestCase
{
    private Mailer $mailer;
    private \ReflectionMethod $isTransientError;

    protected function setUp(): void
    {
        // Mailer constructor requires config.php — provide a minimal stub
        if (!function_exists('getDB')) {
            // Not needed for isTransientError tests, but constructor loads config
        }

        // Use reflection to test the private isTransientError method
        $ref = new \ReflectionClass(Mailer::class);
        $this->isTransientError = $ref->getMethod('isTransientError');
    }

    private function checkTransient(string $message): bool
    {
        // Create Mailer without constructor to avoid config dependency
        $mailer = (new \ReflectionClass(Mailer::class))->newInstanceWithoutConstructor();
        return $this->isTransientError->invoke($mailer, new \Exception($message));
    }

    #[Test]
    #[DataProvider('transientErrorProvider')]
    public function it_identifies_transient_errors(string $message, bool $expected): void
    {
        $this->assertSame($expected, $this->checkTransient($message));
    }

    public static function transientErrorProvider(): array
    {
        return [
            'Brevo 500' => ['Brevo API error (500): Internal Server Error', true],
            'Brevo 502' => ['Brevo API error (502): Bad Gateway', true],
            'Brevo 503' => ['Brevo API error (503): Service Unavailable', true],
            'Brevo curl error' => ['Brevo API error: Connection timed out after 30001 milliseconds', true],
            'SMTP connect failure' => ['SMTP connect() failed', true],
            'Connection timed out' => ['Connection timed out', true],
            'Brevo 400 (not transient)' => ['Brevo API error (400): Bad Request', false],
            'Brevo 401 (not transient)' => ['Brevo API error (401): Unauthorized', false],
            'Brevo 403 (not transient)' => ['Brevo API error (403): Forbidden', false],
            'SMTP not configured' => ['SMTP not configured', false],
            'Generic error' => ['Something went wrong', false],
        ];
    }

    #[Test]
    public function mailer_has_retry_constants(): void
    {
        $ref = new \ReflectionClass(Mailer::class);
        $maxRetries = $ref->getConstant('MAX_RETRIES');
        $retryDelay = $ref->getConstant('RETRY_DELAY_MS');

        $this->assertSame(1, $maxRetries);
        $this->assertSame(500, $retryDelay);
    }
}
