-- Migration 006: therapy_sessions table
CREATE TABLE IF NOT EXISTS therapy_sessions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    therapy_id INT UNSIGNED NOT NULL,
    session_date DATE NOT NULL,
    session_time VARCHAR(5) NOT NULL,
    duration_minutes INT UNSIGNED NOT NULL DEFAULT 60,
    status ENUM('scheduled', 'completed', 'cancelled', 'no_show') NOT NULL DEFAULT 'scheduled',
    notes TEXT DEFAULT NULL,
    payment_status ENUM('due', 'paid') NOT NULL DEFAULT 'due',
    payment_due_date DATE DEFAULT NULL,
    payment_paid_date DATE DEFAULT NULL,
    invoice_sent TINYINT(1) NOT NULL DEFAULT 0,
    invoice_sent_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sessions_therapy FOREIGN KEY (therapy_id) REFERENCES therapies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
