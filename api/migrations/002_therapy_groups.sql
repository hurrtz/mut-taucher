-- Migration 002: Add therapy_groups table for group therapy management

CREATE TABLE IF NOT EXISTS therapy_groups (
  id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  label                VARCHAR(255) NOT NULL DEFAULT '',
  max_participants     SMALLINT UNSIGNED NOT NULL DEFAULT 7,
  current_participants SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  show_on_homepage     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
