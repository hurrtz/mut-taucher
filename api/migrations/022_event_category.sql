ALTER TABLE recurring_rules ADD COLUMN category ENUM('erstgespraech','einzeltherapie','gruppentherapie','andere') NOT NULL DEFAULT 'erstgespraech';
ALTER TABLE events ADD COLUMN category ENUM('erstgespraech','einzeltherapie','gruppentherapie','andere') NOT NULL DEFAULT 'erstgespraech';
