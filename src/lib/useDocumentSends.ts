import { useState, useCallback } from 'react';
import { apiFetch } from './api';
import type { DocumentSend, DocumentDefinition } from './data';

// ─── Document Definitions (mirrors backend DocumentRegistry) ────

export const DOCUMENT_DEFINITIONS: Record<string, DocumentDefinition[]> = {
  booking: [
    { key: 'dsgvo_hinweise',        label: 'Datenschutzhinweise DSGVO',           category: 'muss_vorhanden',     template: 'datenschutzinfo' },
    { key: 'impressum',             label: 'Impressum',                           category: 'muss_vorhanden',     template: null },
    { key: 'preisangabe',           label: 'Preisangabe',                         category: 'muss_vorhanden',     template: null },
    { key: 'privatleistung_hinweis',label: 'Privatleistung-Hinweis',              category: 'muss_vorhanden',     template: null },
    { key: 'kurzvertrag',           label: 'Kurzvertrag/Honorarvereinbarung',     category: 'sollte_unterschrieben', template: 'kurzvertrag' },
    { key: 'video_einverstaendnis', label: 'Video-Einverständnis',                category: 'sollte_unterschrieben', template: 'video_einverstaendnis' },
    { key: 'datenschutz_digital',   label: 'Datenschutzrisiken digital',          category: 'sollte_unterschrieben', template: 'datenschutz_digital' },
  ],
  therapy: [
    { key: 'behandlungsvertrag',    label: 'Behandlungsvertrag',                  category: 'muss_vorhanden',     template: 'behandlungsvertrag' },
    { key: 'dsgvo_hinweise',        label: 'Datenschutzhinweise',                 category: 'muss_vorhanden',     template: 'datenschutzinfo' },
    { key: 'honorarhinweis',        label: 'Honorarhinweis',                      category: 'muss_vorhanden',     template: null },
    { key: 'dokumentation',         label: 'Dokumentation',                       category: 'muss_vorhanden',     template: null },
    { key: 'datenspeicherung',      label: 'Datenspeicherung',                    category: 'muss_vorhanden',     template: null },
    { key: 'behandlungsvertrag_sig',label: 'Behandlungsvertrag (unterschrieben)', category: 'muss_unterschrieben', template: 'behandlungsvertrag' },
    { key: 'online_zustimmung',     label: 'Online-Zustimmung',                   category: 'sollte_unterschrieben', template: 'onlinetherapie' },
    { key: 'privatleistung',        label: 'Privatleistung',                      category: 'sollte_unterschrieben', template: null },
    { key: 'email_einwilligung',    label: 'E-Mail-Einwilligung',                 category: 'sollte_unterschrieben', template: 'email_einwilligung' },
  ],
  group: [
    { key: 'behandlungsvertrag',    label: 'Behandlungsvertrag',                  category: 'muss_vorhanden',     template: 'behandlungsvertrag' },
    { key: 'dsgvo_hinweise',        label: 'Datenschutzhinweise',                 category: 'muss_vorhanden',     template: 'datenschutzinfo' },
    { key: 'zahlungsregelung',      label: 'Zahlungsregelung',                    category: 'muss_vorhanden',     template: null },
    { key: 'dokumentationspflicht', label: 'Dokumentationspflicht',               category: 'muss_vorhanden',     template: null },
    { key: 'behandlungsvertrag_sig',label: 'Behandlungsvertrag (unterschrieben)', category: 'muss_unterschrieben', template: 'behandlungsvertrag' },
    { key: 'vertraulichkeit_gruppe',label: 'Vertraulichkeitsvereinbarung Gruppe', category: 'muss_unterschrieben', template: 'schweigepflichtentbindung' },
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
