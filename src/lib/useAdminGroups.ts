import { useState, useCallback } from 'react';
import { apiFetch } from './api';
import type { TherapyGroup, GroupSession, TherapyScheduleRule } from './data';

export function useAdminGroups() {
  const [groups, setGroups] = useState<TherapyGroup[]>([]);
  const [groupSessionsByGroup, setGroupSessionsByGroup] = useState<Record<number, GroupSession[]>>({});
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async (status: string = 'active') => {
    setError(null);
    try {
      const data = await apiFetch<TherapyGroup[]>(`/admin/groups?status=${status}`);
      setGroups(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden der Gruppen');
    }
  }, []);

  const addGroup = useCallback(async (group: {
    label: string;
    maxParticipants: number;
    showOnHomepage: boolean;
    startDate?: string | null;
    endDate?: string | null;
    sessionCostCents?: number;
    sessionDurationMinutes?: number;
    videoLink?: string;
    notes?: string;
    schedule: TherapyScheduleRule[];
  }) => {
    setError(null);
    try {
      const result = await apiFetch<{ id: number }>('/admin/groups', {
        method: 'POST',
        body: JSON.stringify(group),
      });
      await fetchGroups();
      return result.id;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Anlegen');
      return null;
    }
  }, [fetchGroups]);

  const updateGroup = useCallback(async (id: number, updates: Partial<TherapyGroup>) => {
    setError(null);
    try {
      const existing = groups.find(g => g.id === id);
      if (!existing) return;
      const merged = { ...existing, ...updates };
      await apiFetch(`/admin/groups/${id}`, {
        method: 'PUT',
        body: JSON.stringify(merged),
      });
      await fetchGroups();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Aktualisieren');
    }
  }, [groups, fetchGroups]);

  const removeGroup = useCallback(async (id: number) => {
    setError(null);
    try {
      await apiFetch(`/admin/groups/${id}`, { method: 'DELETE' });
      await fetchGroups();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Löschen');
    }
  }, [fetchGroups]);

  const toggleException = useCallback(async (groupId: number, date: string) => {
    setError(null);
    try {
      await apiFetch(`/admin/groups/${groupId}/exceptions`, {
        method: 'POST',
        body: JSON.stringify({ date }),
      });
      await fetchGroups();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler bei Ausnahme');
    }
  }, [fetchGroups]);

  // ─── Participants ─────────────────────────────────────────────

  const addParticipant = useCallback(async (groupId: number, clientId: number) => {
    setError(null);
    try {
      await apiFetch(`/admin/groups/${groupId}/participants`, {
        method: 'POST',
        body: JSON.stringify({ clientId }),
      });
      await fetchGroups();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Hinzufügen');
    }
  }, [fetchGroups]);

  const removeParticipant = useCallback(async (groupId: number, clientId: number) => {
    setError(null);
    try {
      await apiFetch(`/admin/groups/${groupId}/participants/${clientId}`, { method: 'DELETE' });
      await fetchGroups();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Entfernen');
    }
  }, [fetchGroups]);

  // ─── Sessions ─────────────────────────────────────────────────

  const fetchGroupSessions = useCallback(async (groupId: number, from?: string, to?: string) => {
    setError(null);
    try {
      const params = from && to ? `?from=${from}&to=${to}` : '';
      const data = await apiFetch<GroupSession[]>(`/admin/groups/${groupId}/sessions${params}`);
      setGroupSessionsByGroup(prev => ({ ...prev, [groupId]: data }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden der Sitzungen');
    }
  }, []);


  const addGroupSession = useCallback(async (groupId: number, session: { date: string; time: string; durationMinutes?: number }) => {
    setError(null);
    try {
      await apiFetch(`/admin/groups/${groupId}/sessions`, {
        method: 'POST',
        body: JSON.stringify(session),
      });
      await fetchGroupSessions(groupId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Anlegen');
    }
  }, [fetchGroupSessions]);

  const generateGroupSessions = useCallback(async (groupId: number, from: string, to: string) => {
    setError(null);
    try {
      const result = await apiFetch<{ created: number }>(`/admin/groups/${groupId}/sessions/generate`, {
        method: 'POST',
        body: JSON.stringify({ from, to }),
      });
      await fetchGroupSessions(groupId);
      return result.created;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Generieren');
      return 0;
    }
  }, [fetchGroupSessions]);

  const updateGroupSession = useCallback(async (id: number, updates: Partial<GroupSession>) => {
    setError(null);
    try {
      await apiFetch(`/admin/group-sessions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      setGroupSessionsByGroup(prev => {
        const updated: Record<number, GroupSession[]> = {};
        for (const [gid, list] of Object.entries(prev)) {
          updated[Number(gid)] = list.map(s => s.id === id ? { ...s, ...updates } : s);
        }
        return updated;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Aktualisieren');
    }
  }, []);

  const removeGroupSession = useCallback(async (id: number, groupId: number) => {
    setError(null);
    try {
      await apiFetch(`/admin/group-sessions/${id}`, { method: 'DELETE' });
      await fetchGroupSessions(groupId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Löschen');
    }
  }, [fetchGroupSessions]);

  // ─── Payments ─────────────────────────────────────────────────

  const updatePayment = useCallback(async (paymentId: number, updates: { paymentStatus?: string; paymentPaidDate?: string | null }, groupId?: number) => {
    setError(null);
    try {
      await apiFetch(`/admin/group-session-payments/${paymentId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      if (groupId) await fetchGroupSessions(groupId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Aktualisieren');
    }
  }, [fetchGroupSessions]);

  const sendGroupInvoice = useCallback(async (paymentId: number, groupId?: number) => {
    setError(null);
    try {
      await apiFetch(`/admin/group-session-payments/${paymentId}/invoice`, { method: 'POST' });
      if (groupId) await fetchGroupSessions(groupId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Rechnungsversand');
    }
  }, [fetchGroupSessions]);

  return {
    groups,
    groupSessionsByGroup,
    error,
    fetchGroups,
    addGroup,
    updateGroup,
    removeGroup,
    toggleException,
    addParticipant,
    removeParticipant,
    fetchGroupSessions,
    addGroupSession,
    generateGroupSessions,
    updateGroupSession,
    removeGroupSession,
    updatePayment,
    sendGroupInvoice,
  };
}
