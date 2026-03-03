ALTER TABLE brand_settings
    ADD COLUMN subtitle VARCHAR(255) NOT NULL DEFAULT 'Mut-Taucher Praxis' AFTER practice_name;
