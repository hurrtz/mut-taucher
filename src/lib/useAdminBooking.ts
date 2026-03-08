import { useState, useCallback } from 'react';
import { apiFetch, setToken, clearToken, isAuthenticated as checkAuth, ApiError } from './api';
import type { RecurringRule, DayConfig, Event, EventCategory } from './data';

// ─── Types ───────────────────────────────────────────────────────

export interface CalendarSession {
  category: 'einzeltherapie' | 'gruppentherapie';
  sessionDate: string;
  sessionTime: string;
  durationMinutes: number;
  label: string;
  status: string;
  sessionId: number;
  sourceId: number;
}

export interface BlockedDay {
  date: string;
  reason: string;
}

export interface CancelledItem {
  type: 'erstgespraech' | 'einzeltherapie' | 'gruppentherapie';
  id: number;
  sessionId?: number;
  date: string;
  time: string;
  label?: string;
  clientName?: string;
  clientEmail?: string;
  participants?: { name: string; email: string }[];
}

export interface AdminBooking {
  id: number;
  ruleId: number;
  ruleLabel: string;
  date: string;
  time: string;
  durationMinutes: number;
  clientFirstName: string;
  clientLastName: string;
  clientName: string; // composed by backend
  clientEmail: string;
  clientPhone: string | null;
  clientStreet: string | null;
  clientZip: string | null;
  clientCity: string | null;
  clientMessage: string | null;
  status: 'pending_payment' | 'confirmed' | 'completed' | 'cancelled';
  paymentMethod: 'stripe' | 'paypal' | 'wire_transfer' | null;
  introEmailSent: boolean;
  reminderSent: boolean;
  invoiceSent: boolean;
  invoiceSentAt: string | null;
  priceCents: number | null;
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
  category: EventCategory;
  priceCents: number | null;
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
    category: r.category ?? 'erstgespraech',
    priceCents: r.priceCents ?? null,
  };
}

// ─── Hook ────────────────────────────────────────────────────────

export function useAdminBooking() {
  const [authenticated, setAuthenticated] = useState(checkAuth());
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [calendarSessions, setCalendarSessions] = useState<CalendarSession[]>([]);
  const [blockedDays, setBlockedDays] = useState<BlockedDay[]>([]);
  const [pendingCancellations, setPendingCancellations] = useState<CancelledItem[]>([]);
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

  // ─── Send Email ─────────────────────────────────────────────

  const sendEmail = useCallback(async (bookingId: number, type: 'intro' | 'reminder') => {
    setError(null);
    try {
      await apiFetch(`/admin/bookings/${bookingId}/email`, {
        method: 'POST',
        body: JSON.stringify({ type }),
      });
      const flag = type === 'intro' ? 'introEmailSent' : 'reminderSent';
      setBookings(prev => prev.map(b =>
        b.id === bookingId ? { ...b, [flag]: true } : b
      ));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim E-Mail-Versand');
    }
  }, []);

  // ─── Booking Invoice ─────────────────────────────────────────

  const sendBookingInvoice = useCallback(async (bookingId: number) => {
    setError(null);
    try {
      await apiFetch(`/admin/bookings/${bookingId}/invoice`, { method: 'POST' });
      setBookings(prev => prev.map(b =>
        b.id === bookingId ? { ...b, invoiceSent: true, invoiceSentAt: new Date().toISOString() } : b
      ));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Rechnungsversand');
    }
  }, []);

  // ─── Calendar Sessions ─────────────────────────────────────────

  const fetchCalendarSessions = useCallback(async (from: string, to: string) => {
    setError(null);
    try {
      const data = await apiFetch<CalendarSession[]>(`/admin/calendar-sessions?from=${from}&to=${to}`);
      setCalendarSessions(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden der Kalendersitzungen');
    }
  }, []);

  // ─── Blocked Days ─────────────────────────────────────────────

  const fetchBlockedDays = useCallback(async () => {
    setError(null);
    try {
      const data = await apiFetch<BlockedDay[]>('/admin/calendar/blocked-days');
      setBlockedDays(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden der gesperrten Tage');
    }
  }, []);

  const blockDay = useCallback(async (date: string, reason?: string): Promise<CancelledItem[]> => {
    setError(null);
    try {
      const { cancelled } = await apiFetch<{ cancelled: CancelledItem[] }>('/admin/calendar/block-day', {
        method: 'POST',
        body: JSON.stringify({ date, reason }),
      });
      setPendingCancellations(prev => [...prev, ...cancelled]);
      await fetchBlockedDays();
      await fetchRules();
      return cancelled;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Sperren des Tages');
      return [];
    }
  }, [fetchBlockedDays, fetchRules]);

  const unblockDay = useCallback(async (date: string) => {
    setError(null);
    try {
      await apiFetch('/admin/calendar/block-day', {
        method: 'DELETE',
        body: JSON.stringify({ date }),
      });
      await fetchBlockedDays();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Entsperren des Tages');
    }
  }, [fetchBlockedDays]);

  const cancelCalendarSession = useCallback(async (type: 'einzeltherapie' | 'gruppentherapie', sessionId: number): Promise<CancelledItem | null> => {
    setError(null);
    try {
      const { cancelled } = await apiFetch<{ cancelled: CancelledItem }>('/admin/calendar/cancel-session', {
        method: 'POST',
        body: JSON.stringify({ type, sessionId }),
      });
      setPendingCancellations(prev => [...prev, cancelled]);
      return cancelled;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Absagen der Sitzung');
      return null;
    }
  }, []);

  const sendCancellationEmails = useCallback(async (items: CancelledItem[]) => {
    setError(null);
    try {
      const result = await apiFetch<{ results: { type: string; success: boolean }[] }>('/admin/calendar/send-cancellation-emails', {
        method: 'POST',
        body: JSON.stringify({ items }),
      });
      return result.results;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Senden der Absage-E-Mails');
      return [];
    }
  }, []);

  const clearPendingCancellations = useCallback(() => {
    setPendingCancellations([]);
  }, []);

  return {
    authenticated,
    rules,
    events,
    bookings,
    calendarSessions,
    blockedDays,
    pendingCancellations,
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
    sendBookingInvoice,
    fetchCalendarSessions,
    fetchBlockedDays,
    blockDay,
    unblockDay,
    cancelCalendarSession,
    sendCancellationEmails,
    clearPendingCancellations,
  };
}
