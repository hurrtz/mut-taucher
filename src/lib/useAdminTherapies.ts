import { useState, useCallback } from 'react';
import { apiFetch } from './api';
import type { Therapy, TherapySession, TherapyScheduleRule } from './data';

export function useAdminTherapies() {
  const [therapies, setTherapies] = useState<Therapy[]>([]);
  const [archivedTherapies, setArchivedTherapies] = useState<Therapy[]>([]);
  const [sessionsByTherapy, setSessionsByTherapy] = useState<Record<number, TherapySession[]>>({});
  const [error, setError] = useState<string | null>(null);

  const fetchTherapies = useCallback(async (status: string = 'active') => {
    setError(null);
    try {
      const data = await apiFetch<Therapy[]>(`/admin/therapies?status=${status}`);
      setTherapies(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden der Therapien');
    }
  }, []);

  const fetchArchivedTherapies = useCallback(async () => {
    try {
      const data = await apiFetch<Therapy[]>('/admin/therapies?status=archived');
      setArchivedTherapies(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden der archivierten Therapien');
    }
  }, []);

  const addTherapy = useCallback(async (therapy: {
    clientId: number;
    label: string;
    startDate: string;
    endDate?: string | null;
    sessionCostCents?: number;
    sessionDurationMinutes?: number;
    videoLink?: string;
    notes?: string;
    schedule: TherapyScheduleRule[];
    nextAppointment?: { date: string; time: string };
  }) => {
    setError(null);
    try {
      const result = await apiFetch<{ id: number }>('/admin/therapies', {
        method: 'POST',
        body: JSON.stringify(therapy),
      });
      await fetchTherapies();
      return result.id;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Anlegen');
      return null;
    }
  }, [fetchTherapies]);

  const updateTherapy = useCallback(async (id: number, updates: Partial<Therapy>) => {
    setError(null);
    try {
      const existing = therapies.find(t => t.id === id);
      if (!existing) return;
      const merged = { ...existing, ...updates };
      await apiFetch(`/admin/therapies/${id}`, {
        method: 'PUT',
        body: JSON.stringify(merged),
      });
      await fetchTherapies();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Aktualisieren');
    }
  }, [therapies, fetchTherapies]);

  const removeTherapy = useCallback(async (id: number) => {
    setError(null);
    try {
      await apiFetch(`/admin/therapies/${id}`, { method: 'DELETE' });
      await fetchTherapies();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Löschen');
    }
  }, [fetchTherapies]);

  const toggleException = useCallback(async (therapyId: number, date: string) => {
    setError(null);
    try {
      await apiFetch(`/admin/therapies/${therapyId}/exceptions`, {
        method: 'POST',
        body: JSON.stringify({ date }),
      });
      await fetchTherapies();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler bei Ausnahme');
    }
  }, [fetchTherapies]);

  // ─── Sessions ─────────────────────────────────────────────────

  const fetchSessions = useCallback(async (therapyId: number, from?: string, to?: string) => {
    setError(null);
    try {
      const params = from && to ? `?from=${from}&to=${to}` : '';
      const data = await apiFetch<TherapySession[]>(`/admin/therapies/${therapyId}/sessions${params}`);
      setSessionsByTherapy(prev => ({ ...prev, [therapyId]: data }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden der Sitzungen');
    }
  }, []);


  const addSession = useCallback(async (therapyId: number, session: { date: string; time: string; durationMinutes?: number }) => {
    setError(null);
    try {
      await apiFetch(`/admin/therapies/${therapyId}/sessions`, {
        method: 'POST',
        body: JSON.stringify(session),
      });
      await fetchSessions(therapyId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Anlegen');
    }
  }, [fetchSessions]);

  const generateSessions = useCallback(async (therapyId: number, from: string, to: string) => {
    setError(null);
    try {
      const result = await apiFetch<{ created: number }>(`/admin/therapies/${therapyId}/sessions/generate`, {
        method: 'POST',
        body: JSON.stringify({ from, to }),
      });
      await fetchSessions(therapyId);
      return result.created;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Generieren');
      return 0;
    }
  }, [fetchSessions]);

  const updateSession = useCallback(async (id: number, updates: Partial<TherapySession>) => {
    setError(null);
    try {
      await apiFetch(`/admin/sessions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      // Update local state
      setSessionsByTherapy(prev => {
        const updated: Record<number, TherapySession[]> = {};
        for (const [tid, list] of Object.entries(prev)) {
          updated[Number(tid)] = list.map(s => s.id === id ? { ...s, ...updates } : s);
        }
        return updated;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Aktualisieren');
    }
  }, []);

  const removeSession = useCallback(async (id: number, therapyId: number) => {
    setError(null);
    try {
      await apiFetch(`/admin/sessions/${id}`, { method: 'DELETE' });
      await fetchSessions(therapyId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Löschen');
    }
  }, [fetchSessions]);

  const sendInvoice = useCallback(async (sessionId: number) => {
    setError(null);
    try {
      await apiFetch(`/admin/sessions/${sessionId}/invoice`, { method: 'POST' });
      setSessionsByTherapy(prev => {
        const updated: Record<number, TherapySession[]> = {};
        for (const [tid, list] of Object.entries(prev)) {
          updated[Number(tid)] = list.map(s =>
            s.id === sessionId ? { ...s, invoiceSent: true, invoiceSentAt: new Date().toISOString() } : s
          );
        }
        return updated;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Rechnungsversand');
    }
  }, []);

  return {
    therapies,
    archivedTherapies,
    sessionsByTherapy,
    error,
    fetchTherapies,
    fetchArchivedTherapies,
    addTherapy,
    updateTherapy,
    removeTherapy,
    toggleException,
    fetchSessions,
    addSession,
    generateSessions,
    updateSession,
    removeSession,
    sendInvoice,
  };
}
