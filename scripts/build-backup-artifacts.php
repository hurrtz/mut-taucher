#!/usr/bin/env php
<?php

declare(strict_types=1);

date_default_timezone_set('UTC');

function usage(): void {
    $script = basename(__FILE__);
    fwrite(STDOUT, <<<TXT
Usage: php {$script} --config api/config.php --api-dir api --output-dir /tmp/backup-meta --site-name mut-taucher

Builds backup-side metadata for:
- content-addressed asset manifests split into `financial` and `general`
- a financial archive export from money-relevant database rows

Writes to the output directory:
- assets-financial-manifest.json
- assets-general-manifest.json
- assets-upload-plan.tsv
- db-financial.json
- db-financial.metadata.json

TXT);
}

/** @return array<string, mixed> */
function parseOptions(): array {
    $options = getopt('', ['config:', 'api-dir:', 'output-dir:', 'site-name:', 'help']);
    if ($options === false || isset($options['help'])) {
        usage();
        exit(0);
    }

    foreach (['config', 'api-dir', 'output-dir', 'site-name'] as $required) {
        if (!isset($options[$required]) || !is_string($options[$required]) || trim($options[$required]) === '') {
            fwrite(STDERR, "Missing required option --{$required}\n");
            usage();
            exit(1);
        }
    }

    return $options;
}

/** @return PDO */
function connectDb(string $configFile): PDO {
    if (!is_file($configFile)) {
        throw new RuntimeException("Config file not found: {$configFile}");
    }

    /** @var array<string, mixed> $config */
    $config = require $configFile;

    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=utf8mb4',
        $config['db_host'] ?? '',
        $config['db_name'] ?? ''
    );

    return new PDO($dsn, (string)($config['db_user'] ?? ''), (string)($config['db_pass'] ?? ''), [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
}

/** @return array<int, array<string, mixed>> */
function fetchRows(PDO $db, string $sql): array {
    $stmt = $db->query($sql);
    $rows = $stmt->fetchAll();

    return is_array($rows) ? $rows : [];
}

/** @return array<string, array<string, mixed>> */
function buildFinancialDocumentMap(PDO $db): array {
    $rows = fetchRows(
        $db,
        "SELECT client_id, direction, label, filename, file_path, created_at
         FROM client_documents
         WHERE label LIKE 'Rechnung %'
            OR filename LIKE 'Rechnung_%'
            OR label LIKE 'Zahlungsaufforderung %'
            OR filename LIKE 'Zahlungsaufforderung_%'
         ORDER BY id"
    );

    $map = [];
    foreach ($rows as $row) {
        $relativePath = 'api/' . ltrim((string)$row['file_path'], '/');
        $map[$relativePath] = [
            'clientId' => isset($row['client_id']) ? (int)$row['client_id'] : null,
            'direction' => $row['direction'] ?? null,
            'label' => $row['label'] ?? null,
            'filename' => $row['filename'] ?? null,
            'createdAt' => $row['created_at'] ?? null,
            'reason' => str_starts_with((string)($row['label'] ?? ''), 'Rechnung ')
                || str_starts_with((string)($row['filename'] ?? ''), 'Rechnung_')
                ? 'invoice_document'
                : 'payment_request_document',
        ];
    }

    return $map;
}

/** @return array{financial: array<int, array<string, mixed>>, general: array<int, array<string, mixed>>, uploadPlan: array<int, array<string, string|int>>} */
function buildAssetArtifacts(string $apiDir, string $siteName, array $financialDocumentMap): array {
    $assetsDir = rtrim($apiDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'assets';
    if (!is_dir($assetsDir)) {
        throw new RuntimeException("Assets directory not found: {$assetsDir}");
    }

    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($assetsDir, FilesystemIterator::SKIP_DOTS)
    );

    $paths = [];
    foreach ($iterator as $fileInfo) {
        if ($fileInfo instanceof SplFileInfo && $fileInfo->isFile()) {
            $paths[] = $fileInfo->getPathname();
        }
    }
    sort($paths, SORT_STRING);

    $records = [
        'financial' => [],
        'general' => [],
    ];
    $uploadPlan = [];
    $seenBlobs = [
        'financial' => [],
        'general' => [],
    ];

    foreach ($paths as $absolutePath) {
        $relativeFromApi = str_replace('\\', '/', substr($absolutePath, strlen(rtrim($apiDir, DIRECTORY_SEPARATOR)) + 1));
        $repoRelative = 'api/' . ltrim($relativeFromApi, '/');
        $sha256 = hash_file('sha256', $absolutePath);
        if ($sha256 === false) {
            throw new RuntimeException("Could not hash asset file: {$absolutePath}");
        }

        $class = isset($financialDocumentMap[$repoRelative]) ? 'financial' : 'general';
        $blobPath = sprintf('assets/blobs/%s/%s', substr($sha256, 0, 2), $sha256);
        $record = [
            'path' => $repoRelative,
            'bucketClass' => $class,
            'blobPath' => $blobPath,
            'sha256' => $sha256,
            'size' => filesize($absolutePath),
            'modifiedAt' => gmdate('c', filemtime($absolutePath) ?: time()),
        ];

        if ($class === 'financial') {
            $record['documentMeta'] = $financialDocumentMap[$repoRelative];
        }

        $records[$class][] = $record;

        if (!isset($seenBlobs[$class][$blobPath])) {
            $uploadPlan[] = [
                'class' => $class,
                'sourcePath' => $absolutePath,
                'blobPath' => $blobPath,
                'sha256' => $sha256,
                'size' => (int)filesize($absolutePath),
            ];
            $seenBlobs[$class][$blobPath] = true;
        }
    }

    return [
        'financial' => [
            'version' => 1,
            'siteName' => $siteName,
            'scope' => 'financial_assets',
            'generatedAt' => gmdate('c'),
            'fileCount' => count($records['financial']),
            'totalBytes' => array_sum(array_map(static fn(array $row): int => (int)$row['size'], $records['financial'])),
            'files' => $records['financial'],
        ],
        'general' => [
            'version' => 1,
            'siteName' => $siteName,
            'scope' => 'general_assets',
            'generatedAt' => gmdate('c'),
            'fileCount' => count($records['general']),
            'totalBytes' => array_sum(array_map(static fn(array $row): int => (int)$row['size'], $records['general'])),
            'files' => $records['general'],
        ],
        'uploadPlan' => $uploadPlan,
    ];
}

/** @return array<string, mixed> */
function buildFinancialExport(PDO $db, string $siteName): array {
    $financialBookingWhere = "booking_number IS NOT NULL
        OR invoice_number IS NOT NULL
        OR payment_request_sent = 1
        OR payment_confirmed_at IS NOT NULL
        OR invoice_sent = 1";

    $groupPaymentFinancialWhere = "payment_status = 'paid'
        OR payment_paid_date IS NOT NULL
        OR invoice_sent = 1";

    $therapyFinancialWhere = "payment_status = 'paid'
        OR payment_paid_date IS NOT NULL
        OR invoice_sent = 1";

    $tables = [
        'bookings' => fetchRows(
            $db,
            "SELECT id, rule_id, event_id, booking_date, booking_time, duration_minutes,
                    client_first_name, client_last_name, client_email, client_phone,
                    client_street, client_zip, client_city,
                    status, created_at, payment_method, payment_id,
                    invoice_number, booking_number,
                    payment_request_sent, payment_request_sent_at,
                    payment_confirmed_at, invoice_sent, invoice_sent_at
             FROM bookings
             WHERE {$financialBookingWhere}
             ORDER BY id"
        ),
        'booking_events' => fetchRows(
            $db,
            "SELECT id, booking_id, client_id, event_type, occurred_at
             FROM booking_events
             WHERE booking_id IN (
                 SELECT id FROM bookings WHERE {$financialBookingWhere}
             )
             ORDER BY id"
        ),
        'booking_numbers' => fetchRows(
            $db,
            'SELECT id, year_prefix, sequence_number, booking_number, created_at
             FROM booking_numbers
             ORDER BY id'
        ),
        'invoice_numbers' => fetchRows(
            $db,
            'SELECT id, year_prefix, sequence_number, invoice_number, created_at
             FROM invoice_numbers
             ORDER BY id'
        ),
        'therapy_context' => fetchRows(
            $db,
            "SELECT DISTINCT t.id, t.client_id, t.label, t.start_date, t.end_date,
                    t.status, t.session_cost_cents, t.session_duration_minutes, t.created_at
             FROM therapies t
             JOIN therapy_sessions s ON s.therapy_id = t.id
             WHERE {$therapyFinancialWhere}
             ORDER BY t.id"
        ),
        'therapy_sessions' => fetchRows(
            $db,
            "SELECT id, therapy_id, session_date, session_time, duration_minutes,
                    status, payment_status, payment_due_date, payment_paid_date,
                    invoice_sent, invoice_sent_at, created_at
             FROM therapy_sessions
             WHERE {$therapyFinancialWhere}
             ORDER BY id"
        ),
        'group_context' => fetchRows(
            $db,
            "SELECT DISTINCT g.id, g.label, g.start_date, g.end_date,
                    g.status, g.session_cost_cents, g.session_duration_minutes
             FROM therapy_groups g
             WHERE EXISTS (
                 SELECT 1
                 FROM group_sessions gs
                 JOIN group_session_payments gsp ON gsp.group_session_id = gs.id
                 WHERE gs.group_id = g.id
                   AND ({$groupPaymentFinancialWhere})
             )
                OR EXISTS (
                 SELECT 1
                 FROM group_participants gp
                 WHERE gp.group_id = g.id
                   AND gp.invoice_status <> 'none'
             )
             ORDER BY g.id"
        ),
        'group_sessions' => fetchRows(
            $db,
            "SELECT DISTINCT gs.id, gs.group_id, gs.session_date, gs.session_time,
                    gs.duration_minutes, gs.status, gs.created_at
             FROM group_sessions gs
             JOIN group_session_payments gsp ON gsp.group_session_id = gs.id
             WHERE {$groupPaymentFinancialWhere}
             ORDER BY gs.id"
        ),
        'group_session_payments' => fetchRows(
            $db,
            "SELECT id, group_session_id, client_id, payment_status,
                    payment_due_date, payment_paid_date,
                    invoice_sent, invoice_sent_at
             FROM group_session_payments
             WHERE {$groupPaymentFinancialWhere}
             ORDER BY id"
        ),
        'group_participants_financial' => fetchRows(
            $db,
            "SELECT id, group_id, client_id, joined_at, left_at, status, invoice_status
             FROM group_participants
             WHERE invoice_status <> 'none'
             ORDER BY id"
        ),
        'document_sends_financial' => fetchRows(
            $db,
            "SELECT id, client_id, context_type, context_id, document_key, sent_at
             FROM document_sends
             WHERE document_key LIKE 'rechnung%'
                OR document_key LIKE 'zahlungsaufforderung%'
             ORDER BY id"
        ),
        'client_documents_financial' => fetchRows(
            $db,
            "SELECT id, client_id, direction, label, filename, mime_type, file_size,
                    file_path, document_send_id, created_at
             FROM client_documents
             WHERE label LIKE 'Rechnung %'
                OR filename LIKE 'Rechnung_%'
                OR label LIKE 'Zahlungsaufforderung %'
                OR filename LIKE 'Zahlungsaufforderung_%'
             ORDER BY id"
        ),
    ];

    $counts = [];
    foreach ($tables as $table => $rows) {
        $counts[$table] = count($rows);
    }

    return [
        'version' => 1,
        'siteName' => $siteName,
        'scope' => 'financial_archive',
        'generatedAt' => gmdate('c'),
        'counts' => $counts,
        'tables' => $tables,
    ];
}

function writeJson(string $path, mixed $value): void {
    $json = json_encode($value, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if ($json === false) {
        throw new RuntimeException("Could not encode JSON for {$path}: " . json_last_error_msg());
    }

    file_put_contents($path, $json . PHP_EOL);
}

function writeUploadPlan(string $path, array $rows): void {
    $handle = fopen($path, 'wb');
    if ($handle === false) {
        throw new RuntimeException("Could not open {$path} for writing");
    }

    foreach ($rows as $row) {
        $line = [
            (string)$row['class'],
            (string)$row['sourcePath'],
            (string)$row['blobPath'],
            (string)$row['sha256'],
            (string)$row['size'],
        ];
        fwrite($handle, implode("\t", $line) . PHP_EOL);
    }

    fclose($handle);
}

$options = parseOptions();
$configFile = realpath($options['config']) ?: $options['config'];
$apiDir = realpath($options['api-dir']) ?: $options['api-dir'];
$outputDir = $options['output-dir'];
$siteName = $options['site-name'];

if (!is_dir($outputDir) && !mkdir($outputDir, 0755, true) && !is_dir($outputDir)) {
    throw new RuntimeException("Could not create output directory: {$outputDir}");
}

$db = connectDb($configFile);
$financialDocumentMap = buildFinancialDocumentMap($db);
$assetArtifacts = buildAssetArtifacts($apiDir, $siteName, $financialDocumentMap);
$financialExport = buildFinancialExport($db, $siteName);

writeJson($outputDir . '/assets-financial-manifest.json', $assetArtifacts['financial']);
writeJson($outputDir . '/assets-general-manifest.json', $assetArtifacts['general']);
writeUploadPlan($outputDir . '/assets-upload-plan.tsv', $assetArtifacts['uploadPlan']);
writeJson($outputDir . '/db-financial.json', $financialExport);
writeJson($outputDir . '/db-financial.metadata.json', [
    'version' => 1,
    'siteName' => $siteName,
    'scope' => 'financial_archive_metadata',
    'generatedAt' => $financialExport['generatedAt'],
    'counts' => $financialExport['counts'],
]);
