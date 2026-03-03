import { useState, useCallback } from 'react';
import { apiFetch } from './api';
import type { Client } from './data';

export function useAdminClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async (status: string = 'active') => {
    setError(null);
    try {
      const data = await apiFetch<Client[]>(`/admin/clients?status=${status}`);
      setClients(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden der Patient:innen');
    }
  }, []);

  const addClient = useCallback(async (client: { title?: string; firstName: string; lastName: string; suffix?: string; email: string; phone?: string; street?: string; zip?: string; city?: string; country?: string; notes?: string }) => {
    setError(null);
    try {
      const result = await apiFetch<{ id: number }>('/admin/clients', {
        method: 'POST',
        body: JSON.stringify(client),
      });
      await fetchClients();
      return result.id;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Anlegen');
      return null;
    }
  }, [fetchClients]);

  const updateClient = useCallback(async (id: number, updates: Partial<Client>) => {
    setError(null);
    try {
      const existing = clients.find(c => c.id === id);
      if (!existing) return;
      const merged = { ...existing, ...updates };
      await apiFetch(`/admin/clients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(merged),
      });
      await fetchClients();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Aktualisieren');
    }
  }, [clients, fetchClients]);

  const removeClient = useCallback(async (id: number) => {
    setError(null);
    try {
      await apiFetch(`/admin/clients/${id}`, { method: 'DELETE' });
      await fetchClients();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Löschen');
    }
  }, [fetchClients]);

  const migrateBookingToClient = useCallback(async (bookingId: number) => {
    setError(null);
    try {
      const result = await apiFetch<{ id: number }>(`/admin/bookings/${bookingId}/migrate-to-client`, {
        method: 'POST',
      });
      await fetchClients();
      return result.id;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Migrieren');
      return null;
    }
  }, [fetchClients]);

  return {
    clients,
    error,
    fetchClients,
    addClient,
    updateClient,
    removeClient,
    migrateBookingToClient,
  };
}
