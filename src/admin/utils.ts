import type { TherapySession, GroupSession } from '../lib/data';

/** Returns true if any session in the therapy has been interacted with. */
export function therapyHasInteraction(sessions: TherapySession[]): boolean {
  return sessions.some(s =>
    s.status !== 'scheduled' ||
    s.notes != null ||
    s.paymentStatus === 'paid' ||
    s.invoiceSent
  );
}

/** Returns true if any session in the group has been interacted with. */
export function groupHasInteraction(sessions: GroupSession[]): boolean {
  return sessions.some(s =>
    s.status !== 'scheduled' ||
    s.notes != null ||
    s.payments.some(p => p.paymentStatus === 'paid' || p.invoiceSent)
  );
}
