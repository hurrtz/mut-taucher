<?php

/**
 * Document completeness helper.
 *
 * Mirrors the TypeScript DOCUMENT_DEFINITIONS in src/lib/useDocumentSends.ts.
 * Keep the two lists in sync — a mismatch silently breaks the badge status.
 */

const DOCUMENT_DEFINITIONS = [
    'therapy' => [
        ['key' => 'vertrag_einzeltherapie',    'category' => 'muss_vorhanden',        'signedCounterpart' => 'vertrag_einzeltherapie_sig'],
        ['key' => 'onlinetherapie',            'category' => 'muss_vorhanden',        'signedCounterpart' => 'onlinetherapie_sig'],
        ['key' => 'video_einverstaendnis',     'category' => 'muss_vorhanden',        'signedCounterpart' => 'video_einverstaendnis_sig'],
        ['key' => 'email_einwilligung',        'category' => 'muss_vorhanden',        'signedCounterpart' => 'email_einwilligung_sig'],
        ['key' => 'datenschutzinfo',           'category' => 'muss_vorhanden',        'signedCounterpart' => null],
        ['key' => 'schweigepflichtentbindung', 'category' => 'sollte_unterschrieben', 'signedCounterpart' => 'schweigepflichtentbindung_sig'],
    ],
    'group' => [
        ['key' => 'vertrag_gruppentherapie',   'category' => 'muss_vorhanden',        'signedCounterpart' => 'vertrag_gruppentherapie_sig'],
        ['key' => 'onlinetherapie',            'category' => 'muss_vorhanden',        'signedCounterpart' => 'onlinetherapie_sig'],
        ['key' => 'video_einverstaendnis',     'category' => 'muss_vorhanden',        'signedCounterpart' => 'video_einverstaendnis_sig'],
        ['key' => 'email_einwilligung',        'category' => 'muss_vorhanden',        'signedCounterpart' => 'email_einwilligung_sig'],
        ['key' => 'datenschutzinfo',           'category' => 'muss_vorhanden',        'signedCounterpart' => null],
        ['key' => 'schweigepflichtentbindung', 'category' => 'sollte_unterschrieben', 'signedCounterpart' => 'schweigepflichtentbindung_sig'],
    ],
];

/**
 * Compute a three-state completeness status for a therapy or group subject.
 *
 * $sends is a flat array of rows each containing at least a 'document_key' key
 * (matches the shape returned by SELECT document_key FROM document_sends).
 * $contextType is 'therapy' or 'group'.
 *
 * Returns one of: 'sends-pending', 'signed-pending', 'complete'.
 * The caller is responsible for deciding whether the subject is "started" —
 * this function always returns one of the three strings and never null.
 */
function computeDocumentStatus(array $sends, string $contextType): string
{
    $definitions = DOCUMENT_DEFINITIONS[$contextType] ?? [];
    $sentKeys = [];
    foreach ($sends as $s) {
        if (isset($s['document_key'])) {
            $sentKeys[$s['document_key']] = true;
        }
    }

    $allMussSent = true;
    $allSignedPresent = true;

    foreach ($definitions as $def) {
        if ($def['category'] !== 'muss_vorhanden') {
            continue;
        }
        if (empty($sentKeys[$def['key']])) {
            $allMussSent = false;
        }
        if (!empty($def['signedCounterpart']) && empty($sentKeys[$def['signedCounterpart']])) {
            $allSignedPresent = false;
        }
    }

    if (!$allMussSent) {
        return 'sends-pending';
    }
    if (!$allSignedPresent) {
        return 'signed-pending';
    }
    return 'complete';
}
