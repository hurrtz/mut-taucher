-- Migration 008: Restructure therapy_groups for full session management
-- Mirrors therapy session management but with multi-participant support

-- Add new columns to therapy_groups
ALTER TABLE therapy_groups
  ADD COLUMN start_date DATE DEFAULT NULL AFTER show_on_homepage,
  ADD COLUMN end_date DATE DEFAULT NULL AFTER start_date,
  ADD COLUMN status ENUM('active', 'archived') NOT NULL DEFAULT 'active' AFTER end_date,
  ADD COLUMN video_link VARCHAR(500) DEFAULT NULL AFTER status,
  ADD COLUMN session_cost_cents INT UNSIGNED NOT NULL DEFAULT 9500 AFTER video_link,
  ADD COLUMN session_duration_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 90 AFTER session_cost_cents,
  ADD COLUMN notes TEXT DEFAULT NULL AFTER session_duration_minutes;

-- Drop current_participants (now computed from group_participants)
ALTER TABLE therapy_groups DROP COLUMN current_participants;

-- Participants: many-to-many between groups and clients
CREATE TABLE IF NOT EXISTS group_participants (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  group_id   INT UNSIGNED NOT NULL,
  client_id  INT UNSIGNED NOT NULL,
  joined_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  left_at    TIMESTAMP NULL DEFAULT NULL,
  status     ENUM('active', 'left') NOT NULL DEFAULT 'active',
  UNIQUE KEY uq_group_client (group_id, client_id),
  FOREIGN KEY (group_id) REFERENCES therapy_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Schedule rules for groups (mirrors therapy_schedule_rules)
CREATE TABLE IF NOT EXISTS group_schedule_rules (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  group_id    INT UNSIGNED NOT NULL,
  day_of_week TINYINT UNSIGNED NOT NULL,
  frequency   ENUM('weekly', 'biweekly') NOT NULL DEFAULT 'weekly',
  time        VARCHAR(5) NOT NULL DEFAULT '16:30',
  FOREIGN KEY (group_id) REFERENCES therapy_groups(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Schedule exceptions for groups (mirrors therapy_schedule_exceptions)
CREATE TABLE IF NOT EXISTS group_schedule_exceptions (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  group_id       INT UNSIGNED NOT NULL,
  exception_date DATE NOT NULL,
  UNIQUE KEY uq_group_exception (group_id, exception_date),
  FOREIGN KEY (group_id) REFERENCES therapy_groups(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Group sessions (NO payment columns — payments are per-participant)
CREATE TABLE IF NOT EXISTS group_sessions (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  group_id         INT UNSIGNED NOT NULL,
  session_date     DATE NOT NULL,
  session_time     VARCHAR(5) NOT NULL,
  duration_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 90,
  status           ENUM('scheduled', 'completed', 'cancelled', 'no_show') NOT NULL DEFAULT 'scheduled',
  notes            TEXT DEFAULT NULL,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES therapy_groups(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Per-participant payment tracking for group sessions
CREATE TABLE IF NOT EXISTS group_session_payments (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  group_session_id  INT UNSIGNED NOT NULL,
  client_id         INT UNSIGNED NOT NULL,
  payment_status    ENUM('due', 'paid') NOT NULL DEFAULT 'due',
  payment_due_date  DATE DEFAULT NULL,
  payment_paid_date DATE DEFAULT NULL,
  invoice_sent      BOOLEAN NOT NULL DEFAULT FALSE,
  invoice_sent_at   TIMESTAMP NULL DEFAULT NULL,
  UNIQUE KEY uq_session_client (group_session_id, client_id),
  FOREIGN KEY (group_session_id) REFERENCES group_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
