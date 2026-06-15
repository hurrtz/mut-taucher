-- Migration 053: invoice tax-exemption note wording
-- The §4 Nr. 14 UStG exemption note must say "Psychotherapie", not "Humanmedizin",
-- on database-stored invoice templates. Idempotent: a no-op where the phrase is absent
-- (e.g. templates already edited via the admin UI).
UPDATE document_templates
SET html_content = REPLACE(
    html_content,
    'Heilbehandlung im Bereich der Humanmedizin',
    'Heilbehandlung im Bereich der Psychotherapie'
)
WHERE html_content LIKE '%Heilbehandlung im Bereich der Humanmedizin%';
