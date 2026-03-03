<?php

/**
 * Central registry for all document definitions per context type.
 * Each document has a key, label, category, and optional PDF template.
 */
class DocumentRegistry {
    private static array $registry = [
        'client' => [
            ['key' => 'dsgvo_hinweise',        'label' => 'Datenschutzhinweise DSGVO',           'category' => 'muss_vorhanden',        'template' => 'datenschutzinfo'],
            ['key' => 'impressum',             'label' => 'Impressum',                           'category' => 'muss_vorhanden',        'template' => null],
            ['key' => 'preisangabe',           'label' => 'Preisangabe',                         'category' => 'muss_vorhanden',        'template' => null],
            ['key' => 'privatleistung_hinweis','label' => 'Privatleistung-Hinweis',              'category' => 'muss_vorhanden',        'template' => null],
            ['key' => 'datenspeicherung',      'label' => 'Datenspeicherung',                    'category' => 'muss_vorhanden',        'template' => null],
            ['key' => 'dokumentation',         'label' => 'Dokumentationspflicht',               'category' => 'muss_vorhanden',        'template' => null],
            ['key' => 'datenschutz_digital',   'label' => 'Datenschutzrisiken digital',          'category' => 'sollte_unterschrieben', 'template' => 'datenschutz_digital'],
            ['key' => 'email_einwilligung',    'label' => 'E-Mail-Einwilligung',                 'category' => 'sollte_unterschrieben', 'template' => 'email_einwilligung'],
        ],
        'erstgespraech' => [
            ['key' => 'vertrag_erstgespraech', 'label' => 'Vertrag — Erstgespräch',              'category' => 'muss_vorhanden',        'template' => 'vertrag_erstgespraech'],
            ['key' => 'vertrag_erstgespraech_sig','label' => 'Vertrag — Erstgespräch (unterschrieben)','category' => 'muss_unterschrieben','template' => null],
['key' => 'video_einverstaendnis', 'label' => 'Video-Einverständnis',                'category' => 'sollte_unterschrieben', 'template' => 'video_einverstaendnis'],
        ],
        'therapy' => [
            ['key' => 'vertrag_einzeltherapie',    'label' => 'Vertrag — Einzeltherapie',            'category' => 'muss_vorhanden',        'template' => 'vertrag_einzeltherapie'],
            ['key' => 'vertrag_einzeltherapie_sig','label' => 'Vertrag — Einzeltherapie (unterschrieben)','category' => 'muss_unterschrieben','template' => null],
            ['key' => 'honorarhinweis',        'label' => 'Honorarhinweis',                      'category' => 'muss_vorhanden',        'template' => null],
            ['key' => 'online_zustimmung',     'label' => 'Online-Zustimmung',                   'category' => 'sollte_unterschrieben', 'template' => 'onlinetherapie'],
        ],
        'group' => [
            ['key' => 'vertrag_gruppentherapie',    'label' => 'Vertrag — Gruppentherapie',          'category' => 'muss_vorhanden',        'template' => 'vertrag_gruppentherapie'],
            ['key' => 'vertrag_gruppentherapie_sig','label' => 'Vertrag — Gruppentherapie (unterschrieben)','category' => 'muss_unterschrieben','template' => null],
            ['key' => 'zahlungsregelung',      'label' => 'Zahlungsregelung',                    'category' => 'muss_vorhanden',        'template' => null],
            ['key' => 'vertraulichkeit_gruppe','label' => 'Vertraulichkeitsvereinbarung Gruppe', 'category' => 'muss_unterschrieben',   'template' => 'schweigepflichtentbindung'],
            ['key' => 'video_zustimmung',      'label' => 'Video-Zustimmung',                    'category' => 'sollte_unterschrieben', 'template' => 'video_einverstaendnis'],
            ['key' => 'gruppenformat',         'label' => 'Gruppenformat-Einverständnis',        'category' => 'sollte_unterschrieben', 'template' => null],
            ['key' => 'ausfall_erstattung',    'label' => 'Ausfall/Rückerstattung',              'category' => 'sollte_unterschrieben', 'template' => null],
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
