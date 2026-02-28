#!/usr/bin/env php
<?php

/**
 * Simple SQL migration runner.
 *
 * Tracks applied migrations in a `_migrations` table.
 * Runs all *.sql files in api/migrations/ in sorted order, skipping already-applied ones.
 *
 * Usage:
 *   php api/migrate.php            # run pending migrations
 *   php api/migrate.php --status   # show migration status
 */

require_once __DIR__ . '/db.php';

$db = getDB();

// Ensure migrations tracking table exists
$db->exec('
    CREATE TABLE IF NOT EXISTS _migrations (
        name       VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
');

// Load already-applied migrations
$applied = [];
foreach ($db->query('SELECT name FROM _migrations ORDER BY name') as $row) {
    $applied[$row['name']] = true;
}

// Discover migration files
$dir = __DIR__ . '/migrations';
$files = glob($dir . '/*.sql');
sort($files);

if (in_array('--status', $argv ?? [])) {
    echo "Migration status:\n";
    foreach ($files as $file) {
        $name = basename($file);
        $status = isset($applied[$name]) ? '✓ applied' : '· pending';
        echo "  $status  $name\n";
    }
    if (empty($files)) echo "  No migration files found.\n";
    exit(0);
}

$ran = 0;
foreach ($files as $file) {
    $name = basename($file);
    if (isset($applied[$name])) continue;

    echo "Running $name ... ";

    $sql = file_get_contents($file);
    // Strip comment-only lines, then split on semicolons
    $sql = preg_replace('/^\s*--.*$/m', '', $sql);
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        fn($s) => $s !== ''
    );

    try {
        foreach ($statements as $stmt) {
            $db->exec($stmt);
        }
        $db->prepare('INSERT INTO _migrations (name) VALUES (?)')->execute([$name]);
        echo "OK\n";
        $ran++;
    } catch (Exception $e) {
        echo "FAILED\n";
        echo "  Error: " . $e->getMessage() . "\n";
        echo "  Note: DDL statements already executed cannot be rolled back in MySQL.\n";
        exit(1);
    }
}

if ($ran === 0) {
    echo "Nothing to migrate — all up to date.\n";
} else {
    echo "Done. Applied $ran migration(s).\n";
}
