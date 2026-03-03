CREATE TABLE client_notes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    client_id INT UNSIGNED NOT NULL,
    note_type ENUM('general', 'session', 'group_session') NOT NULL DEFAULT 'general',
    session_id INT UNSIGNED DEFAULT NULL,
    group_session_id INT UNSIGNED DEFAULT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES therapy_sessions(id) ON DELETE SET NULL,
    FOREIGN KEY (group_session_id) REFERENCES group_sessions(id) ON DELETE SET NULL,
    INDEX (client_id),
    INDEX (session_id),
    INDEX (group_session_id)
);
