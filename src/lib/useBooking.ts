import { type Slot, type RecurringRule, type Event } from './data';
import { addDays, addMonths, format, getISODay, parseISO, startOfDay, differenceInCalendarWeeks } from 'date-fns';

const GENERATION_HORIZON_MONTHS = 12;

/**
 * Pure function: generate available slots from recurring rules (+ optional events) for a date range.
 * Used by Admin CalendarPreview for instant client-side preview.
 */
export function generateSlots(
  rules: RecurringRule[],
  rangeStart: Date,
  rangeEnd: Date,
  bookedSlots: Slot[],
  events: Event[] = [],
): Slot[] {
  const horizon = addMonths(new Date(), GENERATION_HORIZON_MONTHS);
  const slots: Slot[] = [];

  for (const rule of rules) {
    const ruleStart = parseISO(rule.startDate);
    const ruleEnd = rule.endDate ? parseISO(rule.endDate) : horizon;

    const effectiveStart = startOfDay(rangeStart > ruleStart ? rangeStart : ruleStart);
    const effectiveEnd = startOfDay(rangeEnd < ruleEnd ? rangeEnd : ruleEnd);

    if (effectiveStart > effectiveEnd) continue;
    if (effectiveStart > horizon) continue;

    const finalEnd = effectiveEnd > horizon ? horizon : effectiveEnd;

    let current = effectiveStart;
    while (current <= finalEnd) {
      const isoDay = getISODay(current); // 1=Mon ... 7=Sun
      const dateStr = format(current, 'yyyy-MM-dd');

      const matchingDay = rule.days.find(d => d.dayOfWeek === isoDay);
      if (matchingDay) {
        // Check biweekly alignment: count weeks from rule start
        if (matchingDay.frequency === 'biweekly') {
          const weeksDiff = differenceInCalendarWeeks(current, ruleStart, { weekStartsOn: 1 });
          if (weeksDiff % 2 !== 0) {
            current = addDays(current, 1);
            continue;
          }
        }

        // Skip exceptions
        if (!rule.exceptions.includes(dateStr)) {
          // Skip if there's already a booked slot for this rule+date+time
          const alreadyBooked = bookedSlots.some(
            s => s.ruleId === rule.id && s.date === dateStr && s.time === rule.time
          );
          if (!alreadyBooked) {
            slots.push({
              id: `gen-${rule.id}-${dateStr}`,
              date: dateStr,
              time: rule.time,
              durationMinutes: rule.durationMinutes,
              available: true,
              ruleId: rule.id,
            });
          }
        }
      }
      current = addDays(current, 1);
    }
  }

  // Include one-off events in the range
  const rangeStartStr = format(rangeStart, 'yyyy-MM-dd');
  const rangeEndStr = format(rangeEnd, 'yyyy-MM-dd');
  for (const event of events) {
    if (event.date >= rangeStartStr && event.date <= rangeEndStr) {
      slots.push({
        id: `event-${event.id}`,
        date: event.date,
        time: event.time,
        durationMinutes: event.durationMinutes,
        available: true,
        eventId: event.id,
      });
    }
  }

  return slots;
}
