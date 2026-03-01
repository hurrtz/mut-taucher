<?php
// Copy this file to config.php and fill in your values.
// NEVER commit config.php to version control.

return [
    'db_host'     => 'localhost',
    'db_name'     => 'mut_taucher',
    'db_user'     => 'root',
    'db_pass'     => '',

    // Generate with: php setup.php <your-password>
    'admin_hash'  => '',

    // Random string, at least 32 characters
    'jwt_secret'  => 'CHANGE_ME_TO_A_RANDOM_SECRET_STRING',

    // Therapist email for notifications
    'therapist_email' => 'therapist@example.com',
    'therapist_name'  => 'Mut-Taucher Praxis',

    // Site URL for email links
    'site_url'    => 'https://example.com',

    // SMTP
    'smtp_host'       => '',
    'smtp_port'       => 587,
    'smtp_user'       => '',
    'smtp_pass'       => '',
    'smtp_from_email' => 'praxis@mut-taucher.de',
    'smtp_from_name'  => 'Mut-Taucher Praxis',
];
