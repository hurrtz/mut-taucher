<?php

/**
 * Central registry for all document definitions per context type.
 * Each document has a key, label, category, and optional PDF template.
 *
 * Categories:
 *   muss_vorhanden       — document MUST be sent
 *   muss_unterschrieben  — document MUST be signed by patient
 *   sollte_unterschrieben — optional, but signature required when sent
 */
class DocumentRegistry {
    private static array $registry = [
        'therapy' => [
            ['key' => 'vertrag_einzeltherapie',        'label' => 'Vertrag — Einzeltherapie',                    'category' => 'muss_vorhanden',        'template' => 'vertrag_einzeltherapie'],
            ['key' => 'vertrag_einzeltherapie_sig',    'label' => 'Vertrag — Einzeltherapie (unterschrieben)',    'category' => 'muss_unterschrieben',   'template' => null],
            ['key' => 'onlinetherapie',                'label' => 'Vereinbarung Online-Therapie',                 'category' => 'muss_vorhanden',        'template' => 'onlinetherapie'],
            ['key' => 'onlinetherapie_sig',            'label' => 'Vereinbarung Online-Therapie (unterschrieben)','category' => 'muss_unterschrieben',   'template' => null],
            ['key' => 'video_einverstaendnis',         'label' => 'Einverständnis Video-Therapie',                'category' => 'muss_vorhanden',        'template' => 'video_einverstaendnis'],
            ['key' => 'video_einverstaendnis_sig',     'label' => 'Einverständnis Video-Therapie (unterschrieben)','category' => 'muss_unterschrieben',  'template' => null],
            ['key' => 'email_einwilligung',            'label' => 'Einwilligung E-Mail-Kommunikation',            'category' => 'muss_vorhanden',        'template' => 'email_einwilligung'],
            ['key' => 'email_einwilligung_sig',        'label' => 'Einwilligung E-Mail-Kommunikation (unterschrieben)','category' => 'muss_unterschrieben','template' => null],
            ['key' => 'datenschutzinfo',               'label' => 'Datenschutzinformation Art. 13 DSGVO',         'category' => 'muss_vorhanden',        'template' => 'datenschutzinfo'],
            ['key' => 'schweigepflichtentbindung',     'label' => 'Schweigepflichtentbindung',                    'category' => 'sollte_unterschrieben', 'template' => 'schweigepflichtentbindung'],
            ['key' => 'schweigepflichtentbindung_sig', 'label' => 'Schweigepflichtentbindung (unterschrieben)',   'category' => 'sollte_unterschrieben', 'template' => null],
        ],
        'group' => [
            ['key' => 'vertrag_gruppentherapie',        'label' => 'Vertrag — Gruppentherapie',                    'category' => 'muss_vorhanden',        'template' => 'vertrag_gruppentherapie'],
            ['key' => 'vertrag_gruppentherapie_sig',    'label' => 'Vertrag — Gruppentherapie (unterschrieben)',    'category' => 'muss_unterschrieben',   'template' => null],
            ['key' => 'onlinetherapie',                 'label' => 'Vereinbarung Online-Therapie',                 'category' => 'muss_vorhanden',        'template' => 'onlinetherapie'],
            ['key' => 'onlinetherapie_sig',             'label' => 'Vereinbarung Online-Therapie (unterschrieben)','category' => 'muss_unterschrieben',   'template' => null],
            ['key' => 'video_einverstaendnis',          'label' => 'Einverständnis Video-Therapie',                'category' => 'muss_vorhanden',        'template' => 'video_einverstaendnis'],
            ['key' => 'video_einverstaendnis_sig',      'label' => 'Einverständnis Video-Therapie (unterschrieben)','category' => 'muss_unterschrieben',  'template' => null],
            ['key' => 'email_einwilligung',             'label' => 'Einwilligung E-Mail-Kommunikation',            'category' => 'muss_vorhanden',        'template' => 'email_einwilligung'],
            ['key' => 'email_einwilligung_sig',         'label' => 'Einwilligung E-Mail-Kommunikation (unterschrieben)','category' => 'muss_unterschrieben','template' => null],
            ['key' => 'datenschutzinfo',                'label' => 'Datenschutzinformation Art. 13 DSGVO',         'category' => 'muss_vorhanden',        'template' => 'datenschutzinfo'],
            ['key' => 'schweigepflichtentbindung',      'label' => 'Schweigepflichtentbindung',                    'category' => 'sollte_unterschrieben', 'template' => 'schweigepflichtentbindung'],
            ['key' => 'schweigepflichtentbindung_sig',  'label' => 'Schweigepflichtentbindung (unterschrieben)',   'category' => 'sollte_unterschrieben', 'template' => null],
        ],
    ];

    public static function getDocuments(string $contextType): array {
        return self::$registry[$contextType] ?? [];
    }

    public static function findDocument(string $contextType, string $documentKey): ?array {
        foreach (self::$registry[$contextType] ?? [] as $doc) {
            if ($doc['key'] === $documentKey) {
                return $doc;
            }
        }
        return null;
    }

    public static function getAll(): array {
        return self::$registry;
    }
}
