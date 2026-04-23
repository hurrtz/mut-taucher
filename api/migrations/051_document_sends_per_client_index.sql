-- Migration 051: covering index for per-subject document-sends lookups
ALTER TABLE document_sends
  ADD INDEX idx_document_sends_context_client
  (context_type, context_id, client_id, document_key);
