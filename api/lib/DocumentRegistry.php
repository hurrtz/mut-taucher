<?php

/**
 * Central registry for all document definitions per context type.
 * Each document has a key, label, category, and optional PDF template.
 */
class DocumentRegistry {
    private static array $registry = [
        'booking' => [
            ['key' => 'dsgvo_hinweise',        'label' => 'Datenschutzhinweise DSGVO',           'category' => 'muss_vorhanden',     'template' => 'datenschutzinfo'],
            ['key' => 'impressum',             'label' => 'Impressum',                           'category' => 'muss_vorhanden',     'template' => null],
            ['key' => 'preisangabe',           'label' => 'Preisangabe',                         'category' => 'muss_vorhanden',     'template' => null],
            ['key' => 'privatleistung_hinweis','label' => 'Privatleistung-Hinweis',              'category' => 'muss_vorhanden',     'template' => null],
            ['key' => 'kurzvertrag',           'label' => 'Kurzvertrag/Honorarvereinbarung',     'category' => 'sollte_unterschrieben', 'template' => 'kurzvertrag'],
            ['key' => 'video_einverstaendnis', 'label' => 'Video-Einverständnis',                'category' => 'sollte_unterschrieben', 'template' => 'video_einverstaendnis'],
            ['key' => 'datenschutz_digital',   'label' => 'Datenschutzrisiken digital',          'category' => 'sollte_unterschrieben', 'template' => 'datenschutz_digital'],
        ],
        'therapy' => [
            ['key' => 'behandlungsvertrag',    'label' => 'Behandlungsvertrag',                  'category' => 'muss_vorhanden',     'template' => 'behandlungsvertrag'],
            ['key' => 'dsgvo_hinweise',        'label' => 'Datenschutzhinweise',                 'category' => 'muss_vorhanden',     'template' => 'datenschutzinfo'],
            ['key' => 'honorarhinweis',        'label' => 'Honorarhinweis',                      'category' => 'muss_vorhanden',     'template' => null],
            ['key' => 'dokumentation',         'label' => 'Dokumentation',                       'category' => 'muss_vorhanden',     'template' => null],
            ['key' => 'datenspeicherung',      'label' => 'Datenspeicherung',                    'category' => 'muss_vorhanden',     'template' => null],
            ['key' => 'behandlungsvertrag_sig','label' => 'Behandlungsvertrag (unterschrieben)', 'category' => 'muss_unterschrieben', 'template' => 'behandlungsvertrag'],
            ['key' => 'online_zustimmung',     'label' => 'Online-Zustimmung',                   'category' => 'sollte_unterschrieben', 'template' => 'onlinetherapie'],
            ['key' => 'privatleistung',        'label' => 'Privatleistung',                      'category' => 'sollte_unterschrieben', 'template' => null],
            ['key' => 'email_einwilligung',    'label' => 'E-Mail-Einwilligung',                 'category' => 'sollte_unterschrieben', 'template' => 'email_einwilligung'],
        ],
        'group' => [
            ['key' => 'behandlungsvertrag',    'label' => 'Behandlungsvertrag',                  'category' => 'muss_vorhanden',     'template' => 'behandlungsvertrag'],
            ['key' => 'dsgvo_hinweise',        'label' => 'Datenschutzhinweise',                 'category' => 'muss_vorhanden',     'template' => 'datenschutzinfo'],
            ['key' => 'zahlungsregelung',      'label' => 'Zahlungsregelung',                    'category' => 'muss_vorhanden',     'template' => null],
            ['key' => 'dokumentationspflicht', 'label' => 'Dokumentationspflicht',               'category' => 'muss_vorhanden',     'template' => null],
            ['key' => 'behandlungsvertrag_sig','label' => 'Behandlungsvertrag (unterschrieben)', 'category' => 'muss_unterschrieben', 'template' => 'behandlungsvertrag'],
            ['key' => 'vertraulichkeit_gruppe','label' => 'Vertraulichkeitsvereinbarung Gruppe', 'category' => 'muss_unterschrieben', 'template' => 'schweigepflichtentbindung'],
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
