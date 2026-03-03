CREATE TABLE workbook_materials (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    group_name  VARCHAR(255) DEFAULT NULL,
    filename    VARCHAR(255) NOT NULL,
    mime_type   VARCHAR(100) NOT NULL,
    file_size   INT UNSIGNED NOT NULL DEFAULT 0,
    file_path   VARCHAR(500) NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workbook_sends (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    material_id  INT UNSIGNED NOT NULL,
    client_id    INT UNSIGNED NOT NULL,
    sent_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (material_id) REFERENCES workbook_materials(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    INDEX (material_id),
    INDEX (client_id)
);
