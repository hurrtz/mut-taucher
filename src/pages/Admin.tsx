import { useState, useEffect, useMemo, useLayoutEffect, type FormEvent, type ReactNode } from 'react';
import { useAdminBooking, type AdminBooking } from '../lib/useAdminBooking';
import { generateSlots } from '../lib/useBooking';
import type { RecurringRule, DayConfig, Event, TherapyGroup } from '../lib/data';
import {
  format, startOfMonth, addMonths, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameDay, isSameMonth, parseISO,
} from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Plus, Trash2, Pencil, ChevronLeft, ChevronRight, ChevronDown, LogOut, Calendar as CalendarIcon,
  Clock, Repeat, Ban, Loader2, AlertCircle, Mail, MailCheck, X, Users, CalendarPlus,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DAY_LABELS = ['', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const DAY_LABELS_LONG = ['', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const DURATION_OPTIONS = [
  { value: 20, label: '20 Min.' },
  { value: 50, label: '50 Min.' },
  { value: 90, label: '90 Min.' },
  { value: 0, label: 'Andere' },
];

// ─── Rule Form ───────────────────────────────────────────────────

interface RuleFormData {
  label: string;
  time: string;
  durationMinutes: number;
  customDuration: string;
  days: Record<number, { enabled: boolean; frequency: 'weekly' | 'biweekly' }>;
  startDate: string;
  endDate: string;
  indefinite: boolean;
}

const emptyForm = (): RuleFormData => ({
  label: '',
  time: '10:00',
  durationMinutes: 50,
  customDuration: '',
  days: Object.fromEntries(
    [1, 2, 3, 4, 5, 6, 7].map(d => [d, { enabled: false, frequency: 'weekly' as const }])
  ),
  startDate: format(new Date(), 'yyyy-MM-dd'),
  endDate: '',
  indefinite: true,
});

function ruleToForm(rule: RecurringRule): RuleFormData {
  const days: RuleFormData['days'] = {};
  for (let d = 1; d <= 7; d++) {
    const match = rule.days.find(dc => dc.dayOfWeek === d);
    days[d] = { enabled: !!match, frequency: match?.frequency ?? 'weekly' };
  }
  const isPreset = DURATION_OPTIONS.some(o => o.value === rule.durationMinutes);
  return {
    label: rule.label,
    time: rule.time,
    durationMinutes: isPreset ? rule.durationMinutes : 0,
    customDuration: isPreset ? '' : String(rule.durationMinutes),
    days,
    startDate: rule.startDate,
    endDate: rule.endDate ?? '',
    indefinite: !rule.endDate,
  };
}

function formToDayConfigs(days: RuleFormData['days']): DayConfig[] {
  return Object.entries(days)
    .filter(([, v]) => v.enabled)
    .map(([k, v]) => ({ dayOfWeek: Number(k), frequency: v.frequency }));
}

function RuleForm({ initial, onSave, onCancel }: {
  initial?: RecurringRule;
  onSave: (data: Omit<RecurringRule, 'id' | 'exceptions'>) => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<RuleFormData>(initial ? ruleToForm(initial) : emptyForm());

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const dayConfigs = formToDayConfigs(form.days);
    if (dayConfigs.length === 0) return;

    const duration = form.durationMinutes === 0 ? Number(form.customDuration) || 50 : form.durationMinutes;
    onSave({
      label: form.label || dayConfigs.map(d => DAY_LABELS[d.dayOfWeek]).join(', '),
      time: form.time,
      durationMinutes: duration,
      days: dayConfigs,
      startDate: form.startDate,
      endDate: form.indefinite ? null : (form.endDate || null),
    });
    if (!initial) setForm(emptyForm());
  };

  const toggleDay = (day: number) => {
    setForm(f => ({
      ...f,
      days: { ...f.days, [day]: { ...f.days[day], enabled: !f.days[day].enabled } },
    }));
  };

  const setFrequency = (day: number, freq: 'weekly' | 'biweekly') => {
    setForm(f => ({
      ...f,
      days: { ...f.days, [day]: { ...f.days[day], frequency: freq } },
    }));
  };

  const selectedDayCount = Object.values(form.days).filter(d => d.enabled).length;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Bezeichnung (optional)</label>
        <input
          type="text"
          value={form.label}
          onChange={e => setForm({ ...form, label: e.target.value })}
          placeholder="z.B. Montags Vormittag"
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tage</label>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6, 7].map(day => (
            <div key={day} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => toggleDay(day)}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                  form.days[day].enabled
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {DAY_LABELS[day]}
              </button>
              {form.days[day].enabled && (
                <select
                  value={form.days[day].frequency}
                  onChange={e => setFrequency(day, e.target.value as 'weekly' | 'biweekly')}
                  className="text-sm border rounded-md px-2 py-1.5"
                >
                  <option value="weekly">Jede Woche</option>
                  <option value="biweekly">Jede 2. Woche</option>
                </select>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Uhrzeit</label>
        <input
          type="time"
          value={form.time}
          onChange={e => setForm({ ...form, time: e.target.value })}
          className="w-full border rounded-md px-3 py-2 text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Dauer</label>
        <div className="flex flex-wrap gap-2">
          {DURATION_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm({ ...form, durationMinutes: opt.value })}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                form.durationMinutes === opt.value
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {form.durationMinutes === 0 && (
          <input
            type="number"
            min="5"
            max="480"
            value={form.customDuration}
            onChange={e => setForm({ ...form, customDuration: e.target.value })}
            placeholder="Minuten"
            className="mt-2 w-32 border rounded-md px-3 py-2 text-sm"
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Startdatum</label>
          <input
            type="date"
            value={form.startDate}
            onChange={e => setForm({ ...form, startDate: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Enddatum</label>
          <div className="flex items-center gap-2 mb-1">
            <input
              type="checkbox"
              id="indefinite"
              checked={form.indefinite}
              onChange={e => setForm({ ...form, indefinite: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="indefinite" className="text-xs text-gray-500">Unbegrenzt</label>
          </div>
          {!form.indefinite && (
            <input
              type="date"
              value={form.endDate}
              onChange={e => setForm({ ...form, endDate: e.target.value })}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={selectedDayCount === 0}
          className="flex-1 bg-primary text-white py-2 rounded-md hover:bg-teal-600 disabled:opacity-50 text-sm font-medium"
        >
          {initial ? 'Speichern' : 'Regel anlegen'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded-md text-sm text-gray-600 hover:bg-gray-50"
          >
            Abbrechen
          </button>
        )}
      </div>
    </form>
  );
}

// ─── Rule Card ───────────────────────────────────────────────────

function RuleCard({ rule, onEdit, onDelete, onToggleException }: {
  rule: RecurringRule;
  onEdit: () => void;
  onDelete: () => void;
  onToggleException: (date: string) => void;
}) {
  const [showExceptions, setShowExceptions] = useState(false);

  const daysLabel = rule.days
    .map(d => `${DAY_LABELS_LONG[d.dayOfWeek]}${d.frequency === 'biweekly' ? ' (2-wöch.)' : ''}`)
    .join(', ');

  const formatDuration = (m: number) => {
    if (m < 60) return `${m} Min.`;
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r > 0 ? `${h} Std. ${r} Min.` : `${h} Std.`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{rule.label || 'Ohne Bezeichnung'}</h3>
          <div className="mt-1 space-y-0.5 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <Repeat size={14} className="text-gray-400 shrink-0" />
              {daysLabel}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-gray-400 shrink-0" />
              {rule.time} Uhr · {formatDuration(rule.durationMinutes)}
            </div>
            <div className="flex items-center gap-1.5">
              <CalendarIcon size={14} className="text-gray-400 shrink-0" />
              Ab {format(parseISO(rule.startDate), 'd. MMM yyyy', { locale: de })}
              {rule.endDate ? ` bis ${format(parseISO(rule.endDate), 'd. MMM yyyy', { locale: de })}` : ' · unbegrenzt'}
            </div>
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-primary rounded hover:bg-gray-100" title="Bearbeiten">
            <Pencil size={16} />
          </button>
          <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-gray-100" title="Löschen">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {rule.exceptions.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setShowExceptions(!showExceptions)}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <Ban size={12} />
            {rule.exceptions.length} Ausnahme{rule.exceptions.length > 1 ? 'n' : ''}
            <ChevronRight size={12} className={`transition-transform ${showExceptions ? 'rotate-90' : ''}`} />
          </button>
          {showExceptions && (
            <div className="mt-2 flex flex-wrap gap-1">
              {rule.exceptions.sort().map(date => (
                <button
                  key={date}
                  onClick={() => onToggleException(date)}
                  className="px-2 py-0.5 text-xs bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 line-through"
                  title="Klicken um Ausnahme aufzuheben"
                >
                  {format(parseISO(date), 'd. MMM', { locale: de })}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Collapsible Section ─────────────────────────────────────────

function CollapsibleSection({ title, icon, children, defaultOpen = false }: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 p-5 text-left hover:bg-gray-50 transition-colors"
      >
        {icon}
        <h2 className="text-lg font-semibold flex-1">{title}</h2>
        <ChevronDown
          size={20}
          className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="px-5 pb-5 border-t border-gray-100 pt-4">{children}</div>}
    </div>
  );
}

// ─── Event Form ──────────────────────────────────────────────────

function EventForm({ onSave }: { onSave: (data: Omit<Event, 'id'>) => void }) {
  const [form, setForm] = useState({
    label: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '10:00',
    durationMinutes: 50,
    customDuration: '',
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const duration = form.durationMinutes === 0 ? Number(form.customDuration) || 50 : form.durationMinutes;
    onSave({
      label: form.label,
      date: form.date,
      time: form.time,
      durationMinutes: duration,
    });
    setForm({ label: '', date: format(new Date(), 'yyyy-MM-dd'), time: '10:00', durationMinutes: 50, customDuration: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Bezeichnung (optional)</label>
        <input
          type="text"
          value={form.label}
          onChange={e => setForm({ ...form, label: e.target.value })}
          placeholder="z.B. Sondertermin"
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
        <input
          type="date"
          value={form.date}
          onChange={e => setForm({ ...form, date: e.target.value })}
          className="w-full border rounded-md px-3 py-2 text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Uhrzeit</label>
        <input
          type="time"
          value={form.time}
          onChange={e => setForm({ ...form, time: e.target.value })}
          className="w-full border rounded-md px-3 py-2 text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Dauer</label>
        <div className="flex flex-wrap gap-2">
          {DURATION_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm({ ...form, durationMinutes: opt.value })}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                form.durationMinutes === opt.value
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {form.durationMinutes === 0 && (
          <input
            type="number"
            min="5"
            max="480"
            value={form.customDuration}
            onChange={e => setForm({ ...form, customDuration: e.target.value })}
            placeholder="Minuten"
            className="mt-2 w-32 border rounded-md px-3 py-2 text-sm"
          />
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-primary text-white py-2 rounded-md hover:bg-teal-600 text-sm font-medium"
      >
        Einzeltermin anlegen
      </button>
    </form>
  );
}

// ─── Event List ──────────────────────────────────────────────────

function EventList({ events, onDelete }: { events: Event[]; onDelete: (id: number) => void }) {
  if (events.length === 0) return null;

  return (
    <div className="space-y-2 mt-4">
      <h3 className="text-sm font-medium text-gray-700">Angelegte Einzeltermine ({events.length})</h3>
      {events.map(event => (
        <div key={event.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 text-sm">
          <div>
            <span className="font-medium text-gray-900">{event.label || 'Einzeltermin'}</span>
            <span className="text-gray-500 ml-2">
              {format(parseISO(event.date), 'd. MMM yyyy', { locale: de })} · {event.time} Uhr · {event.durationMinutes} Min.
            </span>
          </div>
          <button
            onClick={() => {
              if (confirm(`Einzeltermin "${event.label || event.date}" wirklich löschen?`)) {
                onDelete(event.id);
              }
            }}
            className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-gray-100"
            title="Löschen"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Calendar Preview ────────────────────────────────────────────

function CalendarPreview({ rules, events, onToggleException }: {
  rules: RecurringRule[];
  events: Event[];
  onToggleException: (ruleId: string, date: string) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Client-side slot generation for instant preview
  const allSlots = useMemo(
    () => generateSlots(rules, calendarStart, calendarEnd, [], events),
    [rules, events, calendarStart.getTime(), calendarEnd.getTime()]
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <CalendarIcon size={20} className="text-gray-500" />
          Vorschau: {format(currentMonth, 'MMMM yyyy', { locale: de })}
        </h2>
        <div className="flex items-center gap-1">
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, -1))} className="p-1 hover:bg-gray-100 rounded">
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setCurrentMonth(startOfMonth(new Date()))}
            className="px-2 py-0.5 text-xs text-gray-500 hover:text-primary hover:bg-gray-100 rounded"
          >
            Heute
          </button>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-gray-100 rounded">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => (
          <div key={d} className="text-xs font-medium text-gray-400">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => {
          const inCurrentMonth = isSameMonth(day, currentMonth);
          const dateStr = format(day, 'yyyy-MM-dd');
          const daySlots = allSlots.filter(s => s.date === dateStr);
          const isToday = isSameDay(day, new Date());

          const cancelledOnDay = rules.flatMap(r =>
            r.exceptions.includes(dateStr)
              ? [{ ruleId: r.id, time: r.time }]
              : []
          );

          return (
            <div
              key={i}
              className={`min-h-[60px] p-1 rounded-lg border text-xs ${
                !inCurrentMonth ? 'bg-gray-50 border-gray-100 opacity-40' :
                isToday ? 'bg-blue-50 border-blue-200' :
                'bg-white border-gray-100'
              }`}
            >
              <div className={`text-center text-[11px] mb-0.5 ${isToday ? 'font-bold text-blue-600' : 'text-gray-500'}`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-0.5">
                {daySlots.map(slot => (
                  <button
                    key={slot.id}
                    onClick={() => {
                      if (slot.ruleId) {
                        onToggleException(slot.ruleId, dateStr);
                      }
                    }}
                    className={`w-full px-1 py-0.5 rounded text-[10px] text-left truncate transition-colors ${
                      slot.eventId
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        : 'bg-teal-100 text-teal-800 hover:bg-teal-200'
                    } cursor-pointer`}
                    title={slot.eventId ? 'Einzeltermin' : 'Klicken um als Ausnahme zu markieren'}
                  >
                    {slot.time}
                  </button>
                ))}
                {cancelledOnDay.map((c, j) => (
                  <button
                    key={`exc-${j}`}
                    onClick={() => onToggleException(c.ruleId, dateStr)}
                    className="w-full px-1 py-0.5 rounded text-[10px] text-left truncate bg-gray-100 text-gray-400 line-through hover:bg-gray-200 cursor-pointer"
                    title="Ausnahme aufheben"
                  >
                    {c.time}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-4 text-[11px] text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-teal-100 border border-teal-200" /> Regel</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-200" /> Einzeltermin</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 border border-gray-200" /> Ausnahme</span>
      </div>
    </div>
  );
}

// ─── Booking Management ──────────────────────────────────────────

function BookingList({ bookings, onUpdate, onSendEmail }: {
  bookings: AdminBooking[];
  onUpdate: (id: number, updates: Partial<AdminBooking>) => void;
  onSendEmail: (id: number, type: 'intro' | 'reminder') => void;
}) {
  if (bookings.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-6">Keine Buchungen im gewählten Zeitraum.</p>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map(b => (
        <div
          key={b.id}
          className={`bg-white rounded-xl border p-4 shadow-sm ${
            b.status === 'cancelled' ? 'border-red-200 opacity-60' : 'border-gray-200'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-semibold text-gray-900">{b.clientName}</div>
              <div className="text-sm text-gray-600">{b.clientEmail}</div>
              <div className="mt-1 text-sm text-gray-500 flex items-center gap-1.5">
                <CalendarIcon size={14} />
                {format(parseISO(b.date), 'd. MMMM yyyy', { locale: de })} · {b.time} Uhr · {b.durationMinutes} Min.
              </div>
              {b.ruleLabel && (
                <div className="text-xs text-gray-400 mt-0.5">Regel: {b.ruleLabel}</div>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {b.status === 'confirmed' && (
                <>
                  <button
                    onClick={() => onSendEmail(b.id, 'intro')}
                    disabled={b.introEmailSent}
                    className={`p-1.5 rounded transition-colors ${
                      b.introEmailSent
                        ? 'text-green-400 cursor-default'
                        : 'text-gray-400 hover:text-primary hover:bg-gray-100'
                    }`}
                    title={b.introEmailSent ? 'Intro-E-Mail gesendet' : 'Intro-E-Mail senden'}
                  >
                    {b.introEmailSent ? <MailCheck size={16} /> : <Mail size={16} />}
                  </button>
                  <button
                    onClick={() => onSendEmail(b.id, 'reminder')}
                    disabled={b.reminderSent}
                    className={`p-1.5 rounded transition-colors ${
                      b.reminderSent
                        ? 'text-green-400 cursor-default'
                        : 'text-gray-400 hover:text-blue-500 hover:bg-gray-100'
                    }`}
                    title={b.reminderSent ? 'Erinnerung gesendet' : 'Erinnerung senden'}
                  >
                    {b.reminderSent ? <MailCheck size={16} /> : <Clock size={16} />}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Buchung von ${b.clientName} wirklich stornieren?`)) {
                        onUpdate(b.id, { status: 'cancelled' });
                      }
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-gray-100"
                    title="Stornieren"
                  >
                    <X size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Group Form ──────────────────────────────────────────────────

interface GroupFormData {
  label: string;
  maxParticipants: number;
  currentParticipants: number;
  showOnHomepage: boolean;
}

function GroupForm({ initial, onSave, onCancel }: {
  initial?: TherapyGroup;
  onSave: (data: Omit<TherapyGroup, 'id'>) => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<GroupFormData>({
    label: initial?.label ?? '',
    maxParticipants: initial?.maxParticipants ?? 7,
    currentParticipants: initial?.currentParticipants ?? 0,
    showOnHomepage: initial?.showOnHomepage ?? false,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(form);
    if (!initial) setForm({ label: '', maxParticipants: 7, currentParticipants: 0, showOnHomepage: false });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Bezeichnung</label>
        <input
          type="text"
          value={form.label}
          onChange={e => setForm({ ...form, label: e.target.value })}
          placeholder="z.B. Emotionsregulation Frühjahr 2026"
          className="w-full border rounded-md px-3 py-2 text-sm"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max. Teilnehmer</label>
          <input
            type="number"
            min="1"
            max="50"
            value={form.maxParticipants}
            onChange={e => setForm({ ...form, maxParticipants: Number(e.target.value) })}
            className="w-full border rounded-md px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Aktuelle Teilnehmer</label>
          <input
            type="number"
            min="0"
            max={form.maxParticipants}
            value={form.currentParticipants}
            onChange={e => setForm({ ...form, currentParticipants: Number(e.target.value) })}
            className="w-full border rounded-md px-3 py-2 text-sm"
            required
          />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.showOnHomepage}
          onChange={e => setForm({ ...form, showOnHomepage: e.target.checked })}
          className="rounded"
        />
        <span className="text-sm text-gray-700">Auf Homepage anzeigen</span>
      </label>

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 bg-primary text-white py-2 rounded-md hover:bg-teal-600 text-sm font-medium"
        >
          {initial ? 'Speichern' : 'Gruppe anlegen'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded-md text-sm text-gray-600 hover:bg-gray-50"
          >
            Abbrechen
          </button>
        )}
      </div>
    </form>
  );
}

// ─── Group Manager ───────────────────────────────────────────────

function GroupManager({ groups, editingGroupId, onAdd, onUpdate, onDelete, onToggleHomepage, onEditStart, onEditCancel }: {
  groups: TherapyGroup[];
  editingGroupId: number | null;
  onAdd: (data: Omit<TherapyGroup, 'id'>) => void;
  onUpdate: (id: number, data: Partial<TherapyGroup>) => void;
  onDelete: (id: number) => void;
  onToggleHomepage: (id: number, current: boolean) => void;
  onEditStart: (id: number) => void;
  onEditCancel: () => void;
}) {
  const editingGroup = editingGroupId !== null ? groups.find(g => g.id === editingGroupId) : undefined;

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          {editingGroup ? (
            <><Pencil size={20} className="text-primary" /> Gruppe bearbeiten</>
          ) : (
            <><Plus size={20} className="text-primary" /> Neue Gruppe</>
          )}
        </h2>
        {editingGroup ? (
          <GroupForm
            key={editingGroupId}
            initial={editingGroup}
            onSave={data => onUpdate(editingGroupId!, data)}
            onCancel={onEditCancel}
          />
        ) : (
          <GroupForm onSave={onAdd} />
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Users size={20} className="text-gray-500" />
          Gruppen ({groups.length})
        </h2>
        {groups.length === 0 ? (
          <p className="text-sm text-gray-400 bg-white rounded-xl border border-gray-200 p-6 text-center">
            Noch keine Gruppen angelegt.
          </p>
        ) : (
          <div className="space-y-3">
            {groups.map(group => {
              const pct = group.maxParticipants > 0
                ? Math.round((group.currentParticipants / group.maxParticipants) * 100)
                : 0;
              const spotsLeft = group.maxParticipants - group.currentParticipants;

              return (
                <div key={group.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">{group.label || 'Ohne Bezeichnung'}</h3>
                        {group.showOnHomepage && (
                          <span className="shrink-0 text-[10px] font-medium bg-secondary/10 text-secondary px-1.5 py-0.5 rounded">
                            Homepage
                          </span>
                        )}
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                          <span>{group.currentParticipants} / {group.maxParticipants} Teilnehmer</span>
                          <span className="text-xs text-gray-400">{spotsLeft > 0 ? `${spotsLeft} frei` : 'Voll'}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${pct >= 100 ? 'bg-red-400' : pct >= 70 ? 'bg-amber-400' : 'bg-primary'}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => onToggleHomepage(group.id, group.showOnHomepage)}
                        className={`p-1.5 rounded transition-colors ${
                          group.showOnHomepage
                            ? 'text-secondary hover:text-secondary/70 hover:bg-gray-100'
                            : 'text-gray-400 hover:text-secondary hover:bg-gray-100'
                        }`}
                        title={group.showOnHomepage ? 'Von Homepage entfernen' : 'Auf Homepage anzeigen'}
                      >
                        <CalendarIcon size={16} />
                      </button>
                      <button
                        onClick={() => onEditStart(group.id)}
                        className="p-1.5 text-gray-400 hover:text-primary rounded hover:bg-gray-100"
                        title="Bearbeiten"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Gruppe "${group.label || 'Ohne Bezeichnung'}" wirklich löschen?`)) {
                            onDelete(group.id);
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-gray-100"
                        title="Löschen"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Main Admin Page ─────────────────────────────────────────────

export default function Admin() {
  // Block indexing of admin page
  useLayoutEffect(() => {
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'robots');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', 'noindex, nofollow');
    return () => { meta.remove(); };
  }, []);

  const {
    authenticated, rules, events, bookings, groups, loading, error,
    login, logout, fetchRules, addRule, updateRule, removeRule,
    toggleException, fetchEvents, addEvent, removeEvent,
    fetchBookings, updateBooking, sendEmail,
    fetchGroups, addGroup, updateGroup, removeGroup,
  } = useAdminBooking();

  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'rules' | 'bookings' | 'groups'>('rules');
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);

  // Load data on auth
  useEffect(() => {
    if (authenticated) {
      fetchRules();
      fetchEvents();
      fetchBookings();
      fetchGroups();
    }
  }, [authenticated, fetchRules, fetchEvents, fetchBookings, fetchGroups]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    const success = await login(password);
    if (!success) {
      setLoginError('Falsches Passwort');
    }
    setLoginLoading(false);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Admin Login</h2>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-4"
            placeholder="Passwort"
          />
          {loginError && (
            <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded p-2">
              <AlertCircle size={16} />
              {loginError}
            </div>
          )}
          <button
            type="submit"
            disabled={loginLoading}
            className="w-full bg-primary text-white py-2 rounded hover:bg-teal-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loginLoading && <Loader2 size={18} className="animate-spin" />}
            Login
          </button>
          <Link to="/" className="block text-center mt-4 text-sm text-gray-500 hover:underline">Zurück zur Website</Link>
        </form>
      </div>
    );
  }

  const editingRule = editingRuleId ? rules.find(r => r.id === editingRuleId) : undefined;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Verfügbarkeit verwalten</h1>
          <div className="flex items-center gap-4">
            <a href="https://app.eu.amplitude.com/analytics/mut-taucher-395196/home" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">Amplitude</a>
            <Link to="/" className="text-primary hover:underline text-sm">Zur Website</Link>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-red-500 hover:text-red-700 text-sm"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Tab navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'rules'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Repeat size={16} /> Regeln & Kalender
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'bookings'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Users size={16} /> Buchungen ({bookings.filter(b => b.status === 'confirmed').length})
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'groups'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Users size={16} /> Gruppen ({groups.length})
          </button>
        </div>

        {loading && rules.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Create / Edit Rule + Events */}
            <div className="lg:col-span-1 space-y-4">
              {editingRule ? (
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Pencil size={20} className="text-primary" />
                    Regel bearbeiten
                  </h2>
                  <RuleForm
                    key={editingRuleId}
                    initial={editingRule}
                    onSave={data => {
                      updateRule(editingRuleId!, { ...data, exceptions: editingRule.exceptions });
                      setEditingRuleId(null);
                    }}
                    onCancel={() => setEditingRuleId(null)}
                  />
                </div>
              ) : (
                <CollapsibleSection
                  title="Regeltermine anlegen"
                  icon={<CalendarPlus size={20} className="text-primary" />}
                >
                  <RuleForm onSave={addRule} />
                </CollapsibleSection>
              )}

              <CollapsibleSection
                title="Einzeltermin anlegen"
                icon={<CalendarPlus size={20} className="text-primary" />}
              >
                <EventForm onSave={addEvent} />
                <EventList events={events} onDelete={removeEvent} />
              </CollapsibleSection>

              {/* Active Rules */}
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Repeat size={20} className="text-gray-500" />
                  Aktive Regeln ({rules.length})
                </h2>
                {rules.length === 0 && !loading ? (
                  <p className="text-sm text-gray-400 bg-white rounded-xl border border-gray-200 p-6 text-center">
                    Noch keine Regeln angelegt.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {rules.map(rule => (
                      <RuleCard
                        key={rule.id}
                        rule={rule}
                        onEdit={() => setEditingRuleId(rule.id)}
                        onDelete={() => {
                          if (confirm(`Regel "${rule.label || 'Ohne Bezeichnung'}" wirklich löschen?`)) {
                            removeRule(rule.id);
                            if (editingRuleId === rule.id) setEditingRuleId(null);
                          }
                        }}
                        onToggleException={date => toggleException(rule.id, date)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Calendar Preview */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <CalendarPreview
                rules={rules}
                events={events}
                onToggleException={toggleException}
              />
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="max-w-3xl">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users size={20} className="text-gray-500" />
                Buchungen
              </h2>
              <BookingList
                bookings={bookings}
                onUpdate={updateBooking}
                onSendEmail={sendEmail}
              />
            </div>
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="max-w-3xl space-y-6">
            <GroupManager
              groups={groups}
              editingGroupId={editingGroupId}
              onAdd={async (g) => { await addGroup(g); setEditingGroupId(null); }}
              onUpdate={async (id, g) => { await updateGroup(id, g); setEditingGroupId(null); }}
              onDelete={removeGroup}
              onToggleHomepage={(id, current) => updateGroup(id, { showOnHomepage: !current })}
              onEditStart={setEditingGroupId}
              onEditCancel={() => setEditingGroupId(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
