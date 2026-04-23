export interface ClientDocumentTypeDef {
  key: string;
  label: string;
}

export const CLIENT_DOCUMENT_TYPES: ClientDocumentTypeDef[] = [
  { key: 'behandlungsvertrag',         label: 'Behandlungsvertrag' },
  { key: 'onlinetherapie',             label: 'Online-Therapie-Vereinbarung' },
  { key: 'schweigepflichtentbindung',  label: 'Schweigepflichtentbindung' },
  { key: 'video_einverstaendnis',      label: 'Einverständnis Video-Therapie' },
  { key: 'datenschutz_digital',        label: 'Datenschutzrisiken digitale Kommunikation' },
  { key: 'email_einwilligung',         label: 'E-Mail-Einwilligung' },
  { key: 'datenschutzinfo',            label: 'Datenschutzinformation' },
  { key: 'rechnung',                   label: 'Rechnung' },
  { key: 'zahlungsaufforderung',       label: 'Zahlungsaufforderung' },
  { key: 'sonstiges',                  label: 'Sonstiges' },
];

export const INVOICE_NUMBER_PATTERN = /^\d{2}-\d{4}$/;

export function labelForDocumentType(key: string | null | undefined): string | null {
  if (!key) return null;
  return CLIENT_DOCUMENT_TYPES.find(t => t.key === key)?.label ?? null;
}
