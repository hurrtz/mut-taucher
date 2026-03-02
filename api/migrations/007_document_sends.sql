-- Migration 007: document_sends table
CREATE TABLE IF NOT EXISTS document_sends (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    context_type ENUM('booking', 'therapy', 'group') NOT NULL,
    context_id INT UNSIGNED NOT NULL,
    document_key VARCHAR(100) NOT NULL,
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_document_context (context_type, context_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
