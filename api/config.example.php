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
    'therapist_email' => 'info@mut-taucher.de',
    'therapist_name'  => 'Mut-Taucher Praxis',

    // Site URL for email links
    'site_url'    => 'https://example.com',

    // SMTP
    'smtp_host'       => '',
    'smtp_port'       => 587,
    'smtp_user'       => '',
    'smtp_pass'       => '',
    'smtp_from_email' => 'info@mut-taucher.de',
    'smtp_from_name'  => 'Mut-Taucher Praxis',

    // Stripe
    'stripe_secret_key'       => '',
    'stripe_publishable_key'  => '',
    'stripe_webhook_secret'   => '',

    // Bank transfer details (shown to clients choosing Überweisung)
    'bank_account_holder' => '',
    'bank_iban'           => '',
    'bank_bic'            => '',
    'bank_name'           => '',
];
