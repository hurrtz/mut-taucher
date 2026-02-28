-- Mut-Taucher Booking System Schema
-- Run once to set up the database

CREATE TABLE IF NOT EXISTS recurring_rules (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  label       VARCHAR(255) NOT NULL DEFAULT '',
  time        VARCHAR(5)   NOT NULL,            -- "HH:MM"
  duration_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 50,
  start_date  DATE         NOT NULL,
  end_date    DATE         DEFAULT NULL,        -- NULL = indefinite
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS rule_days (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  rule_id     INT UNSIGNED NOT NULL,
  day_of_week TINYINT UNSIGNED NOT NULL,        -- 1=Mon ... 7=Sun (ISO)
  frequency   ENUM('weekly','biweekly') NOT NULL DEFAULT 'weekly',
  FOREIGN KEY (rule_id) REFERENCES recurring_rules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS rule_exceptions (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  rule_id         INT UNSIGNED NOT NULL,
  exception_date  DATE NOT NULL,
  UNIQUE KEY uq_rule_exception (rule_id, exception_date),
  FOREIGN KEY (rule_id) REFERENCES recurring_rules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS bookings (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  rule_id           INT UNSIGNED NOT NULL,
  booking_date      DATE         NOT NULL,
  booking_time      VARCHAR(5)   NOT NULL,      -- "HH:MM"
  duration_minutes  SMALLINT UNSIGNED NOT NULL,
  client_name       VARCHAR(255) NOT NULL,
  client_email      VARCHAR(255) NOT NULL,
  status            ENUM('confirmed','cancelled') NOT NULL DEFAULT 'confirmed',
  intro_email_sent  BOOLEAN      NOT NULL DEFAULT FALSE,
  reminder_sent     BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_booking (rule_id, booking_date, booking_time),
  FOREIGN KEY (rule_id) REFERENCES recurring_rules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
