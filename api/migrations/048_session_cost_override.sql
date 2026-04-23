-- Migration 048: per-session cost override for therapies and groups
ALTER TABLE therapy_sessions
  ADD COLUMN session_cost_cents_override INT UNSIGNED DEFAULT NULL AFTER duration_minutes;

ALTER TABLE group_sessions
  ADD COLUMN session_cost_cents_override INT UNSIGNED DEFAULT NULL AFTER duration_minutes;
