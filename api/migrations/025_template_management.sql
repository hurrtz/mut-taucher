ALTER TABLE document_templates ADD COLUMN group_name VARCHAR(255) DEFAULT NULL AFTER label;

CREATE TABLE template_mappings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sending_point VARCHAR(100) NOT NULL UNIQUE,
    template_key VARCHAR(50) DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (template_key) REFERENCES document_templates(template_key) ON DELETE SET NULL
);

INSERT INTO template_mappings (sending_point) VALUES
  ('email:booking_confirmation'),
  ('email:contact_copy'),
  ('email:cancellation_erstgespraech'),
  ('email:cancellation_einzeltherapie'),
  ('email:cancellation_gruppentherapie'),
  ('email:document_cover'),
  ('email:invoice_cover'),
  ('email:workbook_send'),
  ('pdf:rechnung'),
  ('pdf:vertrag_erstgespraech'),
  ('pdf:vertrag_einzeltherapie'),
  ('pdf:vertrag_gruppentherapie'),
  ('pdf:datenschutzinfo'),
  ('pdf:datenschutz_digital'),
  ('pdf:email_einwilligung'),
  ('pdf:onlinetherapie'),
  ('pdf:schweigepflichtentbindung'),
  ('pdf:video_einverstaendnis');
