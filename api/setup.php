<?php
/**
 * One-time setup script to generate a bcrypt hash for the admin password.
 *
 * Usage:
 *   php setup.php <your-password>
 *
 * Copy the output hash into config.php under 'admin_hash'.
 * Then DELETE this file from the server.
 */

if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    echo 'This script must be run from the command line.';
    exit(1);
}

if ($argc < 2) {
    echo "Usage: php setup.php <password>\n";
    exit(1);
}

$password = $argv[1];
$hash = password_hash($password, PASSWORD_BCRYPT);

echo "\nYour bcrypt hash:\n\n";
echo "  $hash\n\n";
echo "Paste this into config.php as the 'admin_hash' value.\n";
echo "Then delete this setup.php file from the server.\n\n";
