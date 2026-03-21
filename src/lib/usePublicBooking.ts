import { useState, useCallback } from 'react';
import { apiFetch } from './api';
import { format } from 'date-fns';

export interface PublicSlot {
  id: string;
  ruleId: number | null;
  eventId?: number | null;
  date: string;
  time: string;
  durationMinutes: number;
}

export interface BankDetails {
  accountHolder: string;
  iban: string;
  bic: string;
  bankName: string;
  amount: string;
  reference: string;
}

export interface BookingResult {
  id: number;
  message: string;
  paymentMethod: string;
  stripeCheckoutUrl?: string;
  paypalApprovalUrl?: string;
  bankDetails?: BankDetails;
}

export function usePublicBooking() {
  const [slots, setSlots] = useState<PublicSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);

  const fetchSlots = useCallback(async (
    from: Date,
    to: Date,
    options?: { silent?: boolean },
  ) => {
    const silent = options?.silent ?? false;
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const fromStr = format(from, 'yyyy-MM-dd');
      const toStr = format(to, 'yyyy-MM-dd');
      const data = await apiFetch<PublicSlot[]>(`/slots?from=${fromStr}&to=${toStr}`);
      setSlots(data);
    } catch (e) {
      if (!silent) {
        setError(e instanceof Error ? e.message : 'Fehler beim Laden der Termine');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  const bookSlot = useCallback(async (
    slot: { ruleId: number | null; eventId?: number | null },
    date: string,
    time: string,
    firstName: string,
    lastName: string,
    email: string,
    phone: string,
    street: string,
    zip: string,
    city: string,
    paymentMethod: 'stripe' | 'paypal' | 'wire_transfer',
    message?: string,
  ): Promise<BookingResult | null> => {
    setBooking(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { date, time, firstName, lastName, email, phone, street, zip, city, paymentMethod };
      if (message) body.message = message;
      if (slot.eventId) {
        body.eventId = slot.eventId;
      } else {
        body.ruleId = slot.ruleId;
      }
      const result = await apiFetch<BookingResult>('/bookings', {
        method: 'POST',
        body: JSON.stringify(body),
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
