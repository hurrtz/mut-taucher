-- Add bank details footer to invoice template
UPDATE document_templates SET html_content = CONCAT(
  html_content,
  '<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;">',
  '<p style="font-size: 11px; color: #64748b;"><strong>Bankverbindung:</strong> {{bank_account_holder}} · IBAN: {{bank_iban}} · BIC: {{bank_bic}} · {{bank_name}}</p>'
)
WHERE template_key = 'rechnung';
