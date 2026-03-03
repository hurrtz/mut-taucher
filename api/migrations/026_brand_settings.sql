CREATE TABLE brand_settings (
    id INT UNSIGNED PRIMARY KEY DEFAULT 1,
    practice_name VARCHAR(255) NOT NULL DEFAULT 'Mut Taucher',
    subtitle VARCHAR(255) NOT NULL DEFAULT 'Mut-Taucher Praxis',
    logo_path VARCHAR(500) DEFAULT 'assets/logo.png',
    primary_color VARCHAR(7) NOT NULL DEFAULT '#2dd4bf',
    secondary_color VARCHAR(7) NOT NULL DEFAULT '#94a3b8',
    font_family VARCHAR(100) NOT NULL DEFAULT 'helvetica',
    font_size_body SMALLINT UNSIGNED NOT NULL DEFAULT 11,
    font_size_heading SMALLINT UNSIGNED NOT NULL DEFAULT 16,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CHECK (id = 1)
);

INSERT INTO brand_settings (id) VALUES (1);
