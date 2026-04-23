-- Migration 050: lower the default Einzeltherapie session cost from 120 € to 110 €
ALTER TABLE therapies
  MODIFY COLUMN session_cost_cents INT UNSIGNED NOT NULL DEFAULT 11000;
