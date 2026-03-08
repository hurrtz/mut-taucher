CREATE TABLE IF NOT EXISTS invoice_numbers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  year_prefix CHAR(2) NOT NULL,
  sequence_number INT NOT NULL,
  invoice_number VARCHAR(10) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_year_seq (year_prefix, sequence_number)
);
