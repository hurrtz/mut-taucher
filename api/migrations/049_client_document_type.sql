-- Migration 049: document type + optional invoice number on uploaded client documents
ALTER TABLE client_documents
  ADD COLUMN document_type VARCHAR(50) DEFAULT NULL AFTER label,
  ADD COLUMN invoice_number VARCHAR(10) DEFAULT NULL AFTER document_type,
  ADD INDEX idx_client_documents_invoice_number (invoice_number);
