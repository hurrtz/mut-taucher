-- Remove Erstgespräch contract template (now implicit via booking + payment)
DELETE FROM template_mappings WHERE sending_point = 'pdf:vertrag_erstgespraech';
DELETE FROM document_sends WHERE document_key IN ('vertrag_erstgespraech', 'vertrag_erstgespraech_sig');
DELETE FROM document_templates WHERE template_key = 'vertrag_erstgespraech';
