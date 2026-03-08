import { useState, useCallback } from 'react';
import { apiFetch } from './api';
import type { DocumentSend, DocumentDefinition } from './data';

// ─── Document Definitions (mirrors backend DocumentRegistry) ────

export const DOCUMENT_DEFINITIONS: Record<string, DocumentDefinition[]> = {
  client: [
    { key: 'dsgvo_hinweise',        label: 'Datenschutzhinweise DSGVO',           category: 'muss_vorhanden',        template: 'datenschutzinfo' },
    { key: 'impressum',             label: 'Impressum',                           category: 'muss_vorhanden',        template: null },
    { key: 'preisangabe',           label: 'Preisangabe',                         category: 'muss_vorhanden',        template: null },
    { key: 'privatleistung_hinweis',label: 'Privatleistung-Hinweis',              category: 'muss_vorhanden',        template: null },
    { key: 'datenspeicherung',      label: 'Datenspeicherung',                    category: 'muss_vorhanden',        template: null },
    { key: 'dokumentation',         label: 'Dokumentationspflicht',               category: 'muss_vorhanden',        template: null },
    { key: 'datenschutz_digital',   label: 'Datenschutzrisiken digital',          category: 'sollte_unterschrieben', template: 'datenschutz_digital' },
    { key: 'email_einwilligung',    label: 'E-Mail-Einwilligung',                 category: 'sollte_unterschrieben', template: 'email_einwilligung' },
  ],
  erstgespraech: [
    { key: 'video_einverstaendnis', label: 'Video-Einverständnis',                category: 'sollte_unterschrieben', template: 'video_einverstaendnis' },
  ],
  therapy: [
    { key: 'vertrag_einzeltherapie',    label: 'Vertrag — Einzeltherapie',            category: 'muss_vorhanden',        template: 'vertrag_einzeltherapie', signedCounterpart: 'vertrag_einzeltherapie_sig' },
    { key: 'honorarhinweis',        label: 'Honorarhinweis',                      category: 'muss_vorhanden',        template: null },
    { key: 'online_zustimmung',     label: 'Online-Zustimmung',                   category: 'sollte_unterschrieben', template: 'onlinetherapie' },
  ],
  group: [
    { key: 'vertrag_gruppentherapie',    label: 'Vertrag — Gruppentherapie',          category: 'muss_vorhanden',        template: 'vertrag_gruppentherapie', signedCounterpart: 'vertrag_gruppentherapie_sig' },
    { key: 'zahlungsregelung',      label: 'Zahlungsregelung',                    category: 'muss_vorhanden',        template: null },
    { key: 'vertraulichkeit_gruppe',label: 'Vertraulichkeitsvereinbarung Gruppe', category: 'muss_unterschrieben',   template: 'schweigepflichtentbindung' },
    { key: 'video_zustimmung',      label: 'Video-Zustimmung',                    category: 'sollte_unterschrieben', template: 'video_einverstaendnis' },
    { key: 'gruppenformat',         label: 'Gruppenformat-Einverständnis',        category: 'sollte_unterschrieben', template: null },
    { key: 'ausfall_erstattung',    label: 'Ausfall/Rückerstattung',              category: 'sollte_unterschrieben', template: null },
  ],
};

export const CATEGORY_LABELS: Record<string, string> = {
  muss_vorhanden: 'MUSS vorhanden',
  muss_unterschrieben: 'MUSS unterschrieben',
  sollte_unterschrieben: 'SOLLTE unterschrieben',
};

export function useDocumentSends() {
  const [sends, setSends] = useState<DocumentSend[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);

  const fetchStatus = useCallback(async (contextType: string, contextId: number) => {
    setError(null);
    try {
      const data = await apiFetch<DocumentSend[]>(
        `/admin/documents/status?contextType=${contextType}&contextId=${contextId}`
      );
      setSends(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden des Dokumentstatus');
    }
  }, []);

  const sendDocument = useCallback(async (contextType: string, contextId: number, documentKey: string) => {
    setError(null);
    setSending(documentKey);
    try {
      await apiFetch('/admin/documents/send', {
        method: 'POST',
        body: JSON.stringify({ contextType, contextId, documentKey }),
      });
      await fetchStatus(contextType, contextId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Senden');
    } finally {
      setSending(null);
    }
  }, [fetchStatus]);

  const isSent = useCallback((documentKey: string) => {
    return sends.some(s => s.documentKey === documentKey);
  }, [sends]);

  const getSentAt = useCallback((documentKey: string) => {
    const send = sends.find(s => s.documentKey === documentKey);
    return send?.sentAt ?? null;
  }, [sends]);

  return {
    sends,
    error,
    sending,
    fetchStatus,
    sendDocument,
    isSent,
    getSentAt,
  };
}
