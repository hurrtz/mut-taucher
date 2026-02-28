import { useState, useCallback } from 'react';
import { apiFetch, setToken, clearToken, isAuthenticated as checkAuth, ApiError } from './api';
import type { RecurringRule, DayConfig, Event, TherapyGroup } from './data';

// ─── Types ───────────────────────────────────────────────────────

export interface AdminBooking {
  id: number;
  ruleId: number;
  ruleLabel: string;
  date: string;
  time: string;
  durationMinutes: number;
  clientName: string;
  clientEmail: string;
  status: 'confirmed' | 'cancelled';
  introEmailSent: boolean;
  reminderSent: boolean;
  createdAt: string;
}

interface ApiRule {
  id: number;
  label: string;
  time: string;
  durationMinutes: number;
  startDate: string;
  endDate: string | null;
  days: DayConfig[];
  exceptions: string[];
}

// Convert API rule format to frontend RecurringRule format
function apiRuleToRule(r: ApiRule): RecurringRule {
  return {
    id: String(r.id),
    label: r.label,
    time: r.time,
    durationMinutes: r.durationMinutes,
    startDate: r.startDate,
    endDate: r.endDate,
    days: r.days,
    exceptions: r.exceptions,
  };
}

// ─── Hook ────────────────────────────────────────────────────────

export function useAdminBooking() {
  const [authenticated, setAuthenticated] = useState(checkAuth());
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [groups, setGroups] = useState<TherapyGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (password: string): Promise<boolean> => {
    setError(null);
    try {
      const { token } = await apiFetch<{ token: string }>('/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      setToken(token);
      setAuthenticated(true);
      return true;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setError('Falsches Passwort');
      } else {
        setError(e instanceof Error ? e.message : 'Login fehlgeschlagen');
      }
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setAuthenticated(false);
    setRules([]);
    setEvents([]);
    setBookings([]);
    setGroups([]);
  }, []);

  // ─── Rules ───────────────────────────────────────────────────

  const fetchRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<ApiRule[]>('/admin/rules');
      setRules(data.map(apiRuleToRule));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  }, []);

  const addRule = useCallback(async (rule: Omit<RecurringRule, 'id' | 'exceptions'>) => {
    setError(null);
    try {
      await apiFetch('/admin/rules', {
        method: 'POST',
        body: JSON.stringify(rule),
      });
      await fetchRules();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Anlegen');
    }
  }, [fetchRules]);

  const updateRule = useCallback(async (id: string, updates: Partial<RecurringRule>) => {
    setError(null);
    try {
      // Merge with existing rule data for full PUT
      const existing = rules.find(r => r.id === id);
      if (!existing) return;
      const merged = { ...existing, ...updates };
      await apiFetch(`/admin/rules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(merged),
      });
      await fetchRules();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Aktualisieren');
    }
  }, [rules, fetchRules]);

  const removeRule = useCallback(async (id: string) => {
    setError(null);
    try {
      await apiFetch(`/admin/rules/${id}`, { method: 'DELETE' });
      await fetchRules();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Löschen');
    }
  }, [fetchRules]);

  const toggleException = useCallback(async (ruleId: string, date: string) => {
    setError(null);
    try {
      await apiFetch(`/admin/rules/${ruleId}/exceptions`, {
        method: 'POST',
        body: JSON.stringify({ date }),
      });
      await fetchRules();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler bei Ausnahme');
    }
  }, [fetchRules]);

  // ─── Events ─────────────────────────────────────────────────

  const fetchEvents = useCallback(async () => {
    setError(null);
    try {
      const data = await apiFetch<Event[]>('/admin/events');
      setEvents(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden der Einzeltermine');
    }
  }, []);

  const addEvent = useCallback(async (event: Omit<Event, 'id'>) => {
    setError(null);
    try {
      await apiFetch('/admin/events', {
        method: 'POST',
        body: JSON.stringify(event),
      });
      await fetchEvents();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Anlegen');
    }
  }, [fetchEvents]);

  const removeEvent = useCallback(async (id: number) => {
    setError(null);
    try {
      await apiFetch(`/admin/events/${id}`, { method: 'DELETE' });
      await fetchEvents();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Löschen');
    }
  }, [fetchEvents]);

  // ─── Groups ─────────────────────────────────────────────────

  const fetchGroups = useCallback(async () => {
    setError(null);
    try {
      const data = await apiFetch<TherapyGroup[]>('/admin/groups');
      setGroups(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden der Gruppen');
    }
  }, []);

  const addGroup = useCallback(async (group: Omit<TherapyGroup, 'id'>) => {
    setError(null);
    try {
      await apiFetch('/admin/groups', {
        method: 'POST',
        body: JSON.stringify(group),
      });
      await fetchGroups();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Anlegen');
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

  // ─── Bookings ────────────────────────────────────────────────

  const fetchBookings = useCallback(async (from?: string, to?: string) => {
    setError(null);
    try {
      const params = from && to ? `?from=${from}&to=${to}` : '';
      const data = await apiFetch<AdminBooking[]>(`/admin/bookings${params}`);
      setBookings(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden der Buchungen');
    }
  }, []);

  const updateBooking = useCallback(async (id: number, updates: Partial<AdminBooking>) => {
    setError(null);
    try {
      await apiFetch(`/admin/bookings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      // Refresh bookings list
      setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Aktualisieren');
    }
  }, []);

  const sendEmail = useCallback(async (bookingId: number, type: 'intro' | 'reminder') => {
    setError(null);
    try {
      await apiFetch(`/admin/bookings/${bookingId}/email`, {
        method: 'POST',
        body: JSON.stringify({ type }),
      });
      // Update local state
      setBookings(prev => prev.map(b => {
        if (b.id !== bookingId) return b;
        return {
          ...b,
          ...(type === 'intro' ? { introEmailSent: true } : { reminderSent: true }),
        };
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim E-Mail-Versand');
    }
  }, []);

  return {
    authenticated,
    rules,
    events,
    bookings,
    groups,
    loading,
    error,
    login,
    logout,
    fetchRules,
    addRule,
    updateRule,
    removeRule,
    toggleException,
    fetchEvents,
    addEvent,
    removeEvent,
    fetchBookings,
    updateBooking,
    sendEmail,
    fetchGroups,
    addGroup,
    updateGroup,
    removeGroup,
  };
}
