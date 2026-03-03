SET @col_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'brand_settings'
      AND COLUMN_NAME = 'subtitle'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE brand_settings ADD COLUMN subtitle VARCHAR(255) NOT NULL DEFAULT ''Mut-Taucher Praxis'' AFTER practice_name',
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
