import { useState, useCallback } from 'react';
import { apiFetch } from './api';
import type { DocumentSend, DocumentDefinition } from './data';

// ─── Document Definitions (mirrors backend DocumentRegistry) ────

export const DOCUMENT_DEFINITIONS: Record<string, DocumentDefinition[]> = {
  therapy: [
    { key: 'vertrag_einzeltherapie',    label: 'Vertrag — Einzeltherapie',                     category: 'muss_vorhanden',        template: 'vertrag_einzeltherapie', signedCounterpart: 'vertrag_einzeltherapie_sig' },
    { key: 'onlinetherapie',            label: 'Vereinbarung Online-Therapie',                  category: 'muss_vorhanden',        template: 'onlinetherapie',         signedCounterpart: 'onlinetherapie_sig' },
    { key: 'video_einverstaendnis',     label: 'Einverständnis Video-Therapie',                 category: 'muss_vorhanden',        template: 'video_einverstaendnis',  signedCounterpart: 'video_einverstaendnis_sig' },
    { key: 'email_einwilligung',        label: 'Einwilligung E-Mail-Kommunikation',             category: 'muss_vorhanden',        template: 'email_einwilligung',     signedCounterpart: 'email_einwilligung_sig' },
    { key: 'datenschutzinfo',           label: 'Datenschutzinformation Art. 13 DSGVO',          category: 'muss_vorhanden',        template: 'datenschutzinfo' },
    { key: 'schweigepflichtentbindung', label: 'Schweigepflichtentbindung',                     category: 'sollte_unterschrieben', template: 'schweigepflichtentbindung', signedCounterpart: 'schweigepflichtentbindung_sig' },
  ],
  group: [
    { key: 'vertrag_gruppentherapie',   label: 'Vertrag — Gruppentherapie',                     category: 'muss_vorhanden',        template: 'vertrag_gruppentherapie', signedCounterpart: 'vertrag_gruppentherapie_sig' },
    { key: 'onlinetherapie',            label: 'Vereinbarung Online-Therapie',                  category: 'muss_vorhanden',        template: 'onlinetherapie',          signedCounterpart: 'onlinetherapie_sig' },
    { key: 'video_einverstaendnis',     label: 'Einverständnis Video-Therapie',                 category: 'muss_vorhanden',        template: 'video_einverstaendnis',   signedCounterpart: 'video_einverstaendnis_sig' },
    { key: 'email_einwilligung',        label: 'Einwilligung E-Mail-Kommunikation',             category: 'muss_vorhanden',        template: 'email_einwilligung',      signedCounterpart: 'email_einwilligung_sig' },
    { key: 'datenschutzinfo',           label: 'Datenschutzinformation Art. 13 DSGVO',          category: 'muss_vorhanden',        template: 'datenschutzinfo' },
    { key: 'schweigepflichtentbindung', label: 'Schweigepflichtentbindung',                     category: 'sollte_unterschrieben', template: 'schweigepflichtentbindung', signedCounterpart: 'schweigepflichtentbindung_sig' },
  ],
};

export const CATEGORY_LABELS: Record<string, string> = {
  muss_vorhanden: 'MUSS vorhanden',
  muss_unterschrieben: 'MUSS unterschrieben',
  sollte_unterschrieben: 'OPTIONAL',
};

export function useDocumentSends() {
  const [sends, setSends] = useState<DocumentSend[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);

  const fetchStatus = useCallback(async (contextType: string, contextId: number, clientId?: number) => {
    setError(null);
    try {
      const url = clientId
        ? `/admin/documents/status?contextType=${contextType}&contextId=${contextId}&clientId=${clientId}`
        : `/admin/documents/status?contextType=${contextType}&contextId=${contextId}`;
      const data = await apiFetch<DocumentSend[]>(url);
      setSends(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden des Dokumentstatus');
    }
  }, []);

  const sendDocument = useCallback(async (
    contextType: string,
    contextId: number,
    documentKey: string,
    clientId?: number,
  ) => {
    setError(null);
    setSending(documentKey);
    try {
      const body: Record<string, unknown> = { contextType, contextId, documentKey };
      if (clientId) body.clientId = clientId;
      await apiFetch('/admin/documents/send', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      await fetchStatus(contextType, contextId, clientId);
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
