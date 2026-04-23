<?php

declare(strict_types=1);

require_once __DIR__ . '/../lib/DocumentCompleteness.php';

use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\Attributes\Test;

final class DocumentCompletenessTest extends TestCase
{
    private function keys(array $sends): array
    {
        return array_map(fn($s) => ['document_key' => $s], $sends);
    }

    #[Test]
    public function it_returns_sends_pending_when_no_sends_for_therapy(): void
    {
        $this->assertSame('sends-pending', computeDocumentStatus([], 'therapy'));
    }

    #[Test]
    public function it_returns_sends_pending_when_any_muss_vorhanden_missing_for_therapy(): void
    {
        $sends = $this->keys([
            'vertrag_einzeltherapie',
            'onlinetherapie',
            'video_einverstaendnis',
            // missing: email_einwilligung, datenschutzinfo
        ]);
        $this->assertSame('sends-pending', computeDocumentStatus($sends, 'therapy'));
    }

    #[Test]
    public function it_returns_signed_pending_when_all_sent_but_signed_counterpart_missing(): void
    {
        $sends = $this->keys([
            'vertrag_einzeltherapie',
            'onlinetherapie',
            'video_einverstaendnis',
            'email_einwilligung',
            'datenschutzinfo',
            // signed counterparts for the first four are missing
        ]);
        $this->assertSame('signed-pending', computeDocumentStatus($sends, 'therapy'));
    }

    #[Test]
    public function it_returns_complete_when_all_muss_docs_and_all_signed_counterparts_present(): void
    {
        $sends = $this->keys([
            'vertrag_einzeltherapie',      'vertrag_einzeltherapie_sig',
            'onlinetherapie',              'onlinetherapie_sig',
            'video_einverstaendnis',       'video_einverstaendnis_sig',
            'email_einwilligung',          'email_einwilligung_sig',
            'datenschutzinfo',
        ]);
        $this->assertSame('complete', computeDocumentStatus($sends, 'therapy'));
    }

    #[Test]
    public function it_ignores_unknown_send_keys(): void
    {
        $sends = $this->keys([
            'vertrag_einzeltherapie',      'vertrag_einzeltherapie_sig',
            'onlinetherapie',              'onlinetherapie_sig',
            'video_einverstaendnis',       'video_einverstaendnis_sig',
            'email_einwilligung',          'email_einwilligung_sig',
            'datenschutzinfo',
            'something_unknown_1',
            'sollte_unterschrieben_only',
        ]);
        $this->assertSame('complete', computeDocumentStatus($sends, 'therapy'));
    }

    #[Test]
    public function it_computes_status_for_group_context(): void
    {
        $this->assertSame('sends-pending', computeDocumentStatus([], 'group'));

        $sends = $this->keys([
            'vertrag_gruppentherapie',
            'onlinetherapie',
            'video_einverstaendnis',
            'email_einwilligung',
            'datenschutzinfo',
        ]);
        $this->assertSame('signed-pending', computeDocumentStatus($sends, 'group'));

        $sends = $this->keys([
            'vertrag_gruppentherapie',   'vertrag_gruppentherapie_sig',
            'onlinetherapie',            'onlinetherapie_sig',
            'video_einverstaendnis',     'video_einverstaendnis_sig',
            'email_einwilligung',        'email_einwilligung_sig',
            'datenschutzinfo',
        ]);
        $this->assertSame('complete', computeDocumentStatus($sends, 'group'));
    }

    #[Test]
    public function it_returns_sends_pending_when_signed_key_present_without_main_key(): void
    {
        // Defensive: a lone signed counterpart is meaningless — main key is still the gate.
        $sends = $this->keys([
            'vertrag_einzeltherapie_sig',
            'onlinetherapie',
            'video_einverstaendnis',
            'email_einwilligung',
            'datenschutzinfo',
        ]);
        $this->assertSame('sends-pending', computeDocumentStatus($sends, 'therapy'));
    }
}
