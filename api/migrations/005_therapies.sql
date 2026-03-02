-- Migration 005: therapies + schedule tables
CREATE TABLE IF NOT EXISTS therapies (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    client_id INT UNSIGNED NOT NULL,
    label VARCHAR(255) NOT NULL DEFAULT '',
    start_date DATE NOT NULL,
    end_date DATE DEFAULT NULL,
    status ENUM('active', 'archived') NOT NULL DEFAULT 'active',
    video_link VARCHAR(500) DEFAULT NULL,
    session_cost_cents INT UNSIGNED NOT NULL DEFAULT 12000,
    session_duration_minutes INT UNSIGNED NOT NULL DEFAULT 60,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_therapies_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS therapy_schedule_rules (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    therapy_id INT UNSIGNED NOT NULL,
    day_of_week TINYINT UNSIGNED NOT NULL,
    frequency ENUM('weekly', 'biweekly') NOT NULL DEFAULT 'weekly',
    time VARCHAR(5) NOT NULL,
    CONSTRAINT fk_schedule_rules_therapy FOREIGN KEY (therapy_id) REFERENCES therapies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS therapy_schedule_exceptions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    therapy_id INT UNSIGNED NOT NULL,
    exception_date DATE NOT NULL,
    UNIQUE KEY uq_therapy_exception (therapy_id, exception_date),
    CONSTRAINT fk_schedule_exceptions_therapy FOREIGN KEY (therapy_id) REFERENCES therapies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
