import { useState, useCallback } from 'react';
import { apiFetch } from './api';
import { format } from 'date-fns';

export interface PublicSlot {
  id: string;
  ruleId: number;
  date: string;
  time: string;
  durationMinutes: number;
}

interface BookingResult {
  id: number;
  message: string;
}

export function usePublicBooking() {
  const [slots, setSlots] = useState<PublicSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);

  const fetchSlots = useCallback(async (from: Date, to: Date) => {
    setLoading(true);
    setError(null);
    try {
      const fromStr = format(from, 'yyyy-MM-dd');
      const toStr = format(to, 'yyyy-MM-dd');
      const data = await apiFetch<PublicSlot[]>(`/slots?from=${fromStr}&to=${toStr}`);
      setSlots(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden der Termine');
    } finally {
      setLoading(false);
    }
  }, []);

  const bookSlot = useCallback(async (
    ruleId: number,
    date: string,
    time: string,
    name: string,
    email: string,
  ): Promise<BookingResult | null> => {
    setBooking(true);
    setError(null);
    try {
      const result = await apiFetch<BookingResult>('/bookings', {
        method: 'POST',
        body: JSON.stringify({ ruleId, date, time, name, email }),
      });
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler bei der Buchung');
      return null;
    } finally {
      setBooking(false);
    }
  }, []);

  return { slots, loading, error, booking, fetchSlots, bookSlot };
}
