import { useState, useCallback } from 'react';
import { apiFetch } from './api';

export interface TimelineEvent {
  type: 'session' | 'group_session' | 'payment' | 'document_sent' | 'document_received' | 'note' | 'booking_event';
  date: string;
  time: string;
  data: Record<string, unknown>;
}

interface TimelineResponse {
  events: TimelineEvent[];
  total: number;
}

interface ClientNote {
  id: number;
  client_id: number;
  note_type: string;
  session_id: number | null;
  group_session_id: number | null;
  content: string;
  created_at: string;
  updated_at: string;
}

interface ClientDocument {
  id: number;
  client_id: number;
  direction: 'sent' | 'received';
  label: string;
  filename: string;
  mime_type: string;
  file_size: number;
  file_path: string;
  notes: string | null;
  created_at: string;
}

export function useClientHistory(clientId: number) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeline = useCallback(async (limit = 50, offset = 0, append = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<TimelineResponse>(
        `/admin/clients/${clientId}/timeline?limit=${limit}&offset=${offset}`
      );
      setEvents(prev => append ? [...prev, ...res.events] : res.events);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const addNote = useCallback(async (
    content: string,
    noteType: string = 'general',
    sessionId?: number,
    groupSessionId?: number,
  ) => {
    await apiFetch<ClientNote>(`/admin/clients/${clientId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ noteType, content, sessionId, groupSessionId }),
    });
    await fetchTimeline();
  }, [clientId, fetchTimeline]);

  const updateNote = useCallback(async (noteId: number, content: string) => {
    await apiFetch<ClientNote>(`/admin/client-notes/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
    await fetchTimeline();
  }, [fetchTimeline]);

  const deleteNote = useCallback(async (noteId: number) => {
    await apiFetch<{ message: string }>(`/admin/client-notes/${noteId}`, {
      method: 'DELETE',
    });
    await fetchTimeline();
  }, [fetchTimeline]);

  const uploadDocument = useCallback(async (file: File, label: string, notes?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('label', label);
    if (notes) formData.append('notes', notes);

    await apiFetch<ClientDocument>(`/admin/clients/${clientId}/documents`, {
      method: 'POST',
      body: formData,
    });
    await fetchTimeline();
  }, [clientId, fetchTimeline]);

  const deleteDocument = useCallback(async (docId: number) => {
    await apiFetch<{ message: string }>(`/admin/client-documents/${docId}`, {
      method: 'DELETE',
    });
    await fetchTimeline();
  }, [fetchTimeline]);

  return {
    events,
    total,
    loading,
    error,
    fetchTimeline,
    addNote,
    updateNote,
    deleteNote,
    uploadDocument,
    deleteDocument,
  };
}
