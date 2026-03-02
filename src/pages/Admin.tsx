import { useState, useEffect, useMemo, useLayoutEffect, useCallback, type FormEvent, type ReactNode } from 'react';
import { useAdminBooking, type AdminBooking } from '../lib/useAdminBooking';
import { useAdminClients } from '../lib/useAdminClients';
import { useAdminTherapies } from '../lib/useAdminTherapies';
import { useAdminGroups } from '../lib/useAdminGroups';
import { useAdminTemplates } from '../lib/useAdminTemplates';
import TemplateEditor from '../components/TemplateEditor';
import { useDocumentSends, DOCUMENT_DEFINITIONS, CATEGORY_LABELS } from '../lib/useDocumentSends';
import { generateSlots } from '../lib/useBooking';
import type { RecurringRule, DayConfig, Event, TherapyGroup, Client, Therapy, TherapySession, TherapyScheduleRule, GroupSession, DocumentDefinition } from '../lib/data';
import {
  format, startOfMonth, addMonths, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameDay, isSameMonth, parseISO,
} from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Plus, Trash2, Pencil, ChevronLeft, ChevronRight, ChevronDown, LogOut, Calendar as CalendarIcon,
  Clock, Repeat, Ban, Loader2, AlertCircle, Mail, MailCheck, X, Users, CalendarPlus,
  ExternalLink, BarChart3, Home, UserPlus, FileText, Send, Check, Euro,
  Video,
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

// ─── Document Checklist ──────────────────────────────────────────

function DocumentChecklist({ contextType, contextId }: {
  contextType: 'client' | 'erstgespraech' | 'therapy' | 'group';
  contextId: number;
}) {
  const { sending, fetchStatus, sendDocument, isSent, getSentAt } = useDocumentSends();

  useEffect(() => {
    if (contextId) fetchStatus(contextType, contextId);
  }, [contextType, contextId, fetchStatus]);

  const grouped = useMemo(() => {
    const defs = DOCUMENT_DEFINITIONS[contextType] ?? [];
    const groups: Record<string, DocumentDefinition[]> = {};
    for (const doc of defs) {
      if (!groups[doc.category]) groups[doc.category] = [];
      groups[doc.category].push(doc);
    }
    return groups;
  }, [contextType]);

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([category, docs]) => (
        <div key={category}>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {CATEGORY_LABELS[category] ?? category}
          </h4>
          <div className="space-y-1">
            {docs.map(doc => {
              const sent = isSent(doc.key);
              const sentAt = getSentAt(doc.key);
              const isSending = sending === doc.key;
              const hasTemplate = !!doc.template;

              return (
                <div key={doc.key} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50">
                  <div className="flex items-center gap-2 min-w-0">
                    {sent ? (
                      <Check size={14} className="text-green-500 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 shrink-0" />
                    )}
                    <span className={`text-sm truncate ${sent ? 'text-gray-500' : 'text-gray-800'}`}>
                      {doc.label}
                    </span>
                    {sent && sentAt && (
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {format(new Date(sentAt), 'd.M.yy')}
                      </span>
                    )}
                  </div>
                  {hasTemplate ? (
                    <button
                      onClick={() => sendDocument(contextType, contextId, doc.key)}
                      disabled={isSending}
                      className={`text-xs px-2 py-1 rounded border transition-colors flex items-center gap-1 shrink-0 ${
                        sent
                          ? 'border-green-200 text-green-600 bg-green-50 hover:bg-green-100'
                          : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
                      }`}
                      title={sent ? 'Erneut senden' : 'PDF senden'}
                    >
                      {isSending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                      {sent ? 'Erneut' : 'Senden'}
                    </button>
                  ) : (
                    <button
                      onClick={() => sendDocument(contextType, contextId, doc.key)}
                      disabled={sent || isSending}
                      className={`text-xs px-2 py-1 rounded border transition-colors shrink-0 ${
                        sent
                          ? 'border-green-200 text-green-500 bg-green-50 cursor-default'
                          : 'border-gray-200 text-gray-500 hover:border-primary hover:text-primary'
                      }`}
                      title={sent ? 'Vermerkt' : 'Als erledigt markieren'}
                    >
                      {isSending ? <Loader2 size={12} className="animate-spin" /> : sent ? <Check size={12} /> : <FileText size={12} />}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Booking List (Erstgespräche) ────────────────────────────────

function BookingList({ bookings, onUpdate, onSendEmail, onMigrateToClient }: {
  bookings: AdminBooking[];
  onUpdate: (id: number, updates: Partial<AdminBooking>) => void;
  onSendEmail: (id: number, type: 'intro' | 'reminder') => void;
  onMigrateToClient: (bookingId: number) => void;
}) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

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
                    onClick={() => onMigrateToClient(b.id)}
                    className="p-1.5 text-gray-400 hover:text-primary rounded hover:bg-gray-100"
                    title="Klient:in anlegen"
                  >
                    <UserPlus size={16} />
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
          {b.status === 'confirmed' && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}
                className="text-xs text-gray-500 hover:text-primary flex items-center gap-1"
              >
                <FileText size={12} />
                Dokument-Checkliste
                <ChevronDown size={12} className={`transition-transform ${expandedId === b.id ? 'rotate-180' : ''}`} />
              </button>
              {expandedId === b.id && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <DocumentChecklist contextType="erstgespraech" contextId={b.id} />
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Group Form ──────────────────────────────────────────────────

function GroupForm({ initial, onSave, onCancel }: {
  initial?: TherapyGroup;
  onSave: (data: {
    label: string; maxParticipants: number; showOnHomepage: boolean;
    startDate?: string | null; endDate?: string | null;
    sessionCostCents?: number; sessionDurationMinutes?: number;
    videoLink?: string; notes?: string;
    schedule: TherapyScheduleRule[];
  }) => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState({
    label: initial?.label ?? '',
    maxParticipants: initial?.maxParticipants ?? 7,
    showOnHomepage: initial?.showOnHomepage ?? false,
    startDate: initial?.startDate ?? format(new Date(), 'yyyy-MM-dd'),
    endDate: initial?.endDate ?? '',
    sessionCostCents: initial?.sessionCostCents ?? 9500,
    sessionDurationMinutes: initial?.sessionDurationMinutes ?? 90,
    videoLink: initial?.videoLink ?? '',
    notes: initial?.notes ?? '',
    schedule: initial?.schedule?.length ? initial.schedule : [{ dayOfWeek: 1, frequency: 'weekly' as 'weekly' | 'biweekly', time: '16:30' }],
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave({
      label: form.label,
      maxParticipants: form.maxParticipants,
      showOnHomepage: form.showOnHomepage,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      sessionCostCents: form.sessionCostCents,
      sessionDurationMinutes: form.sessionDurationMinutes,
      videoLink: form.videoLink || undefined,
      notes: form.notes || undefined,
      schedule: form.schedule.filter(s => s.time),
    });
  };

  const addScheduleRule = () => {
    setForm(f => ({
      ...f,
      schedule: [...f.schedule, { dayOfWeek: 1, frequency: 'weekly' as 'weekly' | 'biweekly', time: '16:30' }],
    }));
  };

  const removeScheduleRule = (idx: number) => {
    setForm(f => ({ ...f, schedule: f.schedule.filter((_, i) => i !== idx) }));
  };

  const updateScheduleRule = (idx: number, updates: Partial<TherapyScheduleRule>) => {
    setForm(f => ({
      ...f,
      schedule: f.schedule.map((s, i) => i === idx ? { ...s, ...updates } : s),
    }));
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Sitzungsdauer (Min.)</label>
          <input
            type="number"
            value={form.sessionDurationMinutes}
            onChange={e => setForm({ ...form, sessionDurationMinutes: Number(e.target.value) })}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Startdatum</label>
          <input
            type="date"
            value={form.startDate}
            onChange={e => setForm({ ...form, startDate: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Enddatum (optional)</label>
          <input
            type="date"
            value={form.endDate}
            onChange={e => setForm({ ...form, endDate: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kosten pro Sitzung (Cent)</label>
          <input
            type="number"
            value={form.sessionCostCents}
            onChange={e => setForm({ ...form, sessionCostCents: Number(e.target.value) })}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
          <span className="text-xs text-gray-400">{(form.sessionCostCents / 100).toFixed(2)} €</span>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Video-Link</label>
          <input
            type="url"
            value={form.videoLink}
            onChange={e => setForm({ ...form, videoLink: e.target.value })}
            placeholder="https://..."
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Zeitplan</label>
        {form.schedule.map((rule, idx) => (
          <div key={idx} className="flex items-center gap-2 mb-2">
            <select
              value={rule.dayOfWeek}
              onChange={e => updateScheduleRule(idx, { dayOfWeek: Number(e.target.value) })}
              className="border rounded-md px-2 py-1.5 text-sm"
            >
              {[1, 2, 3, 4, 5, 6, 7].map(d => (
                <option key={d} value={d}>{DAY_LABELS_LONG[d]}</option>
              ))}
            </select>
            <select
              value={rule.frequency}
              onChange={e => updateScheduleRule(idx, { frequency: e.target.value as 'weekly' | 'biweekly' })}
              className="border rounded-md px-2 py-1.5 text-sm"
            >
              <option value="weekly">Wöchentlich</option>
              <option value="biweekly">2-wöchentlich</option>
            </select>
            <input
              type="time"
              value={rule.time}
              onChange={e => updateScheduleRule(idx, { time: e.target.value })}
              className="border rounded-md px-2 py-1.5 text-sm"
            />
            {form.schedule.length > 1 && (
              <button type="button" onClick={() => removeScheduleRule(idx)} className="p-1 text-gray-400 hover:text-red-500">
                <X size={14} />
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addScheduleRule} className="text-xs text-primary hover:underline flex items-center gap-1">
          <Plus size={12} /> Weiteren Termin hinzufügen
        </button>
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notizen</label>
        <textarea
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
          rows={2}
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
      </div>

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

// ─── Participant Panel ───────────────────────────────────────────

function ParticipantPanel({ group, clients, onAdd, onRemove }: {
  group: TherapyGroup;
  clients: Client[];
  onAdd: (clientId: number) => void;
  onRemove: (clientId: number) => void;
}) {
  const [selectedClientId, setSelectedClientId] = useState(0);
  const activeParticipants = group.participants?.filter(p => p.status === 'active') ?? [];
  const participantIds = new Set(activeParticipants.map(p => p.clientId));
  const availableClients = clients.filter(c => !participantIds.has(c.id));
  const isFull = activeParticipants.length >= group.maxParticipants;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">
          Teilnehmer ({activeParticipants.length} / {group.maxParticipants})
        </h4>
      </div>

      {/* Participant list */}
      {activeParticipants.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-2">Noch keine Teilnehmer.</p>
      ) : (
        <div className="space-y-1">
          {activeParticipants.map(p => (
            <div key={p.clientId} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
              <div>
                <span className="font-medium text-gray-900">{p.clientName}</span>
                <span className="text-gray-500 ml-2">{p.clientEmail}</span>
              </div>
              <button
                onClick={() => { if (confirm(`${p.clientName} wirklich entfernen?`)) onRemove(p.clientId); }}
                className="p-1 text-gray-400 hover:text-red-500"
                title="Entfernen"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add participant */}
      {!isFull && availableClients.length > 0 && (
        <div className="flex items-center gap-2">
          <select
            value={selectedClientId}
            onChange={e => setSelectedClientId(Number(e.target.value))}
            className="flex-1 border rounded-md px-2 py-1.5 text-sm"
          >
            <option value={0}>Klient:in auswählen...</option>
            {availableClients.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
            ))}
          </select>
          <button
            onClick={() => { if (selectedClientId) { onAdd(selectedClientId); setSelectedClientId(0); } }}
            disabled={!selectedClientId}
            className="px-3 py-1.5 bg-primary text-white rounded text-sm hover:bg-teal-600 disabled:opacity-50"
          >
            Hinzufügen
          </button>
        </div>
      )}
      {isFull && (
        <p className="text-xs text-amber-600">Maximale Teilnehmerzahl erreicht.</p>
      )}
    </div>
  );
}

// ─── Group Session Panel ─────────────────────────────────────────

function GroupSessionPanel({ group, sessions, onGenerate, onUpdateSession, onDeleteSession, onUpdatePayment, onSendInvoice }: {
  group: TherapyGroup;
  sessions: GroupSession[];
  onGenerate: (from: string, to: string) => void;
  onUpdateSession: (id: number, updates: Partial<GroupSession>) => void;
  onDeleteSession: (id: number) => void;
  onUpdatePayment: (paymentId: number, updates: { paymentStatus?: string; paymentPaidDate?: string | null }) => void;
  onSendInvoice: (paymentId: number) => void;
}) {
  const [genFrom, setGenFrom] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [genTo, setGenTo] = useState(format(addMonths(new Date(), 3), 'yyyy-MM-dd'));
  const [expandedSessionId, setExpandedSessionId] = useState<number | null>(null);

  const statusLabels: Record<string, string> = {
    scheduled: 'Geplant',
    completed: 'Abgeschlossen',
    cancelled: 'Abgesagt',
    no_show: 'Nicht erschienen',
  };

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
    completed: 'bg-green-50 text-green-700 border-green-200',
    cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
    no_show: 'bg-red-50 text-red-600 border-red-200',
  };

  // Payment summary across all sessions and participants
  const allPayments = sessions.flatMap(s => s.payments);
  const totalDue = allPayments.filter(p => p.paymentStatus === 'due').length;
  const totalPaid = allPayments.filter(p => p.paymentStatus === 'paid').length;
  const amountDue = totalDue * group.sessionCostCents;
  const amountPaid = totalPaid * group.sessionCostCents;

  return (
    <div className="space-y-4">
      {/* Payment Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-xs text-blue-600 font-medium">Offen</div>
          <div className="text-lg font-bold text-blue-700">{(amountDue / 100).toFixed(0)} €</div>
          <div className="text-xs text-blue-500">{totalDue} Zahlungen</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-xs text-green-600 font-medium">Bezahlt</div>
          <div className="text-lg font-bold text-green-700">{(amountPaid / 100).toFixed(0)} €</div>
          <div className="text-xs text-green-500">{totalPaid} Zahlungen</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-600 font-medium">Gesamt</div>
          <div className="text-lg font-bold text-gray-700">{((amountDue + amountPaid) / 100).toFixed(0)} €</div>
          <div className="text-xs text-gray-500">{sessions.length} Sitzungen</div>
        </div>
      </div>

      {/* Generate Sessions */}
      <div className="bg-gray-50 rounded-lg p-3">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Sitzungen generieren</h4>
        <div className="flex items-end gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Von</label>
            <input type="date" value={genFrom} onChange={e => setGenFrom(e.target.value)} className="border rounded px-2 py-1 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Bis</label>
            <input type="date" value={genTo} onChange={e => setGenTo(e.target.value)} className="border rounded px-2 py-1 text-sm" />
          </div>
          <button
            onClick={() => onGenerate(genFrom, genTo)}
            className="px-3 py-1.5 bg-primary text-white rounded text-sm hover:bg-teal-600"
          >
            Generieren
          </button>
        </div>
      </div>

      {/* Session List */}
      {sessions.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">Noch keine Sitzungen.</p>
      ) : (
        <div className="space-y-2">
          {sessions.map(s => {
            const isExpanded = expandedSessionId === s.id;
            const paidCount = s.payments.filter(p => p.paymentStatus === 'paid').length;
            const totalCount = s.payments.length;

            return (
              <div key={s.id} className="bg-white rounded-lg border border-gray-200 text-sm">
                <div className="flex items-center justify-between gap-2 p-3">
                  <button
                    onClick={() => setExpandedSessionId(isExpanded ? null : s.id)}
                    className="flex items-center gap-2 text-left flex-1"
                  >
                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    <span className="font-medium">
                      {format(parseISO(s.sessionDate), 'd. MMM yyyy', { locale: de })}
                    </span>
                    <span className="text-gray-500">{s.sessionTime} Uhr</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded border ${statusColors[s.status]}`}>
                      {statusLabels[s.status]}
                    </span>
                    {totalCount > 0 && (
                      <span className="text-xs text-gray-400">{paidCount}/{totalCount} bezahlt</span>
                    )}
                  </button>
                  <div className="flex items-center gap-1">
                    <select
                      value={s.status}
                      onChange={e => onUpdateSession(s.id, { status: e.target.value as GroupSession['status'] })}
                      className="text-xs border rounded px-1.5 py-1"
                    >
                      <option value="scheduled">Geplant</option>
                      <option value="completed">Abgeschlossen</option>
                      <option value="cancelled">Abgesagt</option>
                      <option value="no_show">Nicht erschienen</option>
                    </select>
                    <button
                      onClick={() => { if (confirm('Sitzung löschen?')) onDeleteSession(s.id); }}
                      className="p-1 text-gray-400 hover:text-red-500 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {/* Expandable per-participant payment rows */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-3 pb-3 pt-2 space-y-1">
                    {s.payments.length === 0 ? (
                      <p className="text-xs text-gray-400">Keine Zahlungen (keine Teilnehmer).</p>
                    ) : (
                      s.payments.map(p => (
                        <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded px-2 py-1.5 text-xs">
                          <span className="font-medium text-gray-700">{p.clientName}</span>
                          <div className="flex items-center gap-1">
                            <span className={`px-1.5 py-0.5 rounded border ${
                              p.paymentStatus === 'paid' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                            }`}>
                              {p.paymentStatus === 'paid' ? 'Bezahlt' : 'Offen'}
                            </span>
                            <button
                              onClick={() => onUpdatePayment(p.id, {
                                paymentStatus: p.paymentStatus === 'paid' ? 'due' : 'paid',
                                paymentPaidDate: p.paymentStatus === 'paid' ? null : format(new Date(), 'yyyy-MM-dd'),
                              })}
                              className={`p-0.5 rounded ${p.paymentStatus === 'paid' ? 'text-green-500' : 'text-gray-400 hover:text-green-500'}`}
                              title={p.paymentStatus === 'paid' ? 'Als offen markieren' : 'Als bezahlt markieren'}
                            >
                              <Euro size={12} />
                            </button>
                            <button
                              onClick={() => onSendInvoice(p.id)}
                              disabled={p.invoiceSent}
                              className={`p-0.5 rounded ${p.invoiceSent ? 'text-green-400 cursor-default' : 'text-gray-400 hover:text-primary'}`}
                              title={p.invoiceSent ? 'Rechnung gesendet' : 'Rechnung senden'}
                            >
                              {p.invoiceSent ? <MailCheck size={12} /> : <FileText size={12} />}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Group Manager ───────────────────────────────────────────────

function GroupManager({ groups, clients, selectedGroupId, onSelect, onDelete,
  onToggleHomepage, onAddParticipant, onRemoveParticipant,
  groupSessions, onGenerateSessions, onUpdateSession, onDeleteSession,
  onUpdatePayment, onSendInvoice }: {
  groups: TherapyGroup[];
  clients: Client[];
  selectedGroupId: number | null;
  onSelect: (id: number | null) => void;
  onDelete: (id: number) => void;
  onToggleHomepage: (id: number, current: boolean) => void;
  onAddParticipant: (groupId: number, clientId: number) => void;
  onRemoveParticipant: (groupId: number, clientId: number) => void;
  groupSessions: GroupSession[];
  onGenerateSessions: (groupId: number, from: string, to: string) => void;
  onUpdateSession: (id: number, updates: Partial<GroupSession>) => void;
  onDeleteSession: (id: number, groupId: number) => void;
  onUpdatePayment: (paymentId: number, updates: { paymentStatus?: string; paymentPaidDate?: string | null }) => void;
  onSendInvoice: (paymentId: number) => void;
}) {
  if (groups.length === 0) {
    return (
      <p className="text-sm text-gray-400 bg-white rounded-xl border border-gray-200 p-6 text-center">
        Noch keine Gruppen angelegt.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map(group => {
        const isSelected = selectedGroupId === group.id;
        const pct = group.maxParticipants > 0
          ? Math.round((group.participantCount / group.maxParticipants) * 100)
          : 0;
        const spotsLeft = group.maxParticipants - group.participantCount;
        const scheduleLabel = group.schedule
          ?.map(s => `${DAY_LABELS[s.dayOfWeek]} ${s.time}${s.frequency === 'biweekly' ? ' (2-wöch.)' : ''}`)
          .join(', ');

        return (
          <div key={group.id} className={`bg-white rounded-xl border shadow-sm ${isSelected ? 'border-primary' : 'border-gray-200'}`}>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <button onClick={() => onSelect(isSelected ? null : group.id)} className="text-left min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">{group.label || 'Ohne Bezeichnung'}</h3>
                    {group.showOnHomepage && (
                      <span className="shrink-0 text-[10px] font-medium bg-secondary/10 text-secondary px-1.5 py-0.5 rounded">
                        Homepage
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 space-y-0.5">
                    {scheduleLabel && <div className="flex items-center gap-1"><Repeat size={12} /> {scheduleLabel}</div>}
                    {group.startDate && (
                      <div className="flex items-center gap-1">
                        <CalendarIcon size={12} />
                        Ab {format(parseISO(group.startDate), 'd. MMM yyyy', { locale: de })}
                        {group.endDate && ` bis ${format(parseISO(group.endDate), 'd. MMM yyyy', { locale: de })}`}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Euro size={12} /> {(group.sessionCostCents / 100).toFixed(0)} € · {group.sessionDurationMinutes} Min.
                    </div>
                    {group.videoLink && (
                      <a href={group.videoLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline" onClick={e => e.stopPropagation()}>
                        <Video size={12} /> Video-Link
                      </a>
                    )}
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>{group.participantCount} / {group.maxParticipants} Teilnehmer</span>
                      <span className="text-xs text-gray-400">{spotsLeft > 0 ? `${spotsLeft} frei` : 'Voll'}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${pct >= 100 ? 'bg-red-400' : pct >= 70 ? 'bg-amber-400' : 'bg-primary'}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                </button>
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
                    <Home size={16} />
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
            {isSelected && (
              <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-4">
                {/* Document checklist */}
                <CollapsibleSection
                  title="Dokumente"
                  icon={<FileText size={18} className="text-gray-500" />}
                >
                  <DocumentChecklist contextType="group" contextId={group.id} />
                </CollapsibleSection>

                {/* Participants */}
                <CollapsibleSection
                  title="Teilnehmer"
                  icon={<Users size={18} className="text-gray-500" />}
                  defaultOpen={true}
                >
                  <ParticipantPanel
                    group={group}
                    clients={clients}
                    onAdd={(clientId) => onAddParticipant(group.id, clientId)}
                    onRemove={(clientId) => onRemoveParticipant(group.id, clientId)}
                  />
                </CollapsibleSection>

                {/* Sessions */}
                <GroupSessionPanel
                  group={group}
                  sessions={groupSessions}
                  onGenerate={(from, to) => onGenerateSessions(group.id, from, to)}
                  onUpdateSession={onUpdateSession}
                  onDeleteSession={(id) => onDeleteSession(id, group.id)}
                  onUpdatePayment={onUpdatePayment}
                  onSendInvoice={onSendInvoice}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Client Form ─────────────────────────────────────────────────

function ClientForm({ initial, onSave, onCancel }: {
  initial?: Client;
  onSave: (data: { name: string; email: string; phone?: string; notes?: string; status?: 'active' | 'archived' }) => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<{
    name: string; email: string; phone: string; notes: string; status: 'active' | 'archived';
  }>({
    name: initial?.name ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    notes: initial?.notes ?? '',
    status: initial?.status ?? 'active',
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave({
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      notes: form.notes || undefined,
      status: form.status,
    });
    if (!initial) setForm({ name: '', email: '', phone: '', notes: '', status: 'active' });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
          <input
            type="email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm"
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
        <input
          type="tel"
          value={form.phone}
          onChange={e => setForm({ ...form, phone: e.target.value })}
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notizen</label>
        <textarea
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
          rows={3}
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
      </div>
      {initial && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={form.status}
            onChange={e => setForm({ ...form, status: e.target.value as 'active' | 'archived' })}
            className="w-full border rounded-md px-3 py-2 text-sm"
          >
            <option value="active">Aktiv</option>
            <option value="archived">Archiviert</option>
          </select>
        </div>
      )}
      <div className="flex gap-2">
        <button type="submit" className="flex-1 bg-primary text-white py-2 rounded-md hover:bg-teal-600 text-sm font-medium">
          {initial ? 'Speichern' : 'Klient:in anlegen'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-md text-sm text-gray-600 hover:bg-gray-50">
            Abbrechen
          </button>
        )}
      </div>
    </form>
  );
}

// ─── Client List ─────────────────────────────────────────────────

function ClientList({ clients, onEdit, onDelete, onNewTherapy }: {
  clients: Client[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onNewTherapy: (clientId: number) => void;
}) {
  const [expandedDocId, setExpandedDocId] = useState<number | null>(null);

  if (clients.length === 0) {
    return (
      <p className="text-sm text-gray-400 bg-white rounded-xl border border-gray-200 p-6 text-center">
        Noch keine Klient:innen angelegt.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {clients.map(c => (
        <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">{c.name}</h3>
                {c.status === 'archived' && (
                  <span className="text-[10px] font-medium bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Archiviert</span>
                )}
              </div>
              <div className="text-sm text-gray-600">{c.email}</div>
              {c.phone && <div className="text-sm text-gray-500">{c.phone}</div>}
              <div className="mt-1 text-xs text-gray-400">
                {c.therapyCount > 0 && <>{c.therapyCount} Einzeltherapie{c.therapyCount !== 1 ? 'n' : ''}</>}
                {c.therapyCount > 0 && c.groupCount > 0 && ' · '}
                {c.groupCount > 0 && <>{c.groupCount} Gruppe{c.groupCount !== 1 ? 'n' : ''}</>}
                {c.therapyCount === 0 && c.groupCount === 0 && 'Keine Therapien'}
                {c.bookingId && ' · aus Erstgespräch'}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => onNewTherapy(c.id)}
                className="p-1.5 text-gray-400 hover:text-primary rounded hover:bg-gray-100"
                title="Neue Therapie"
              >
                <Plus size={16} />
              </button>
              <button
                onClick={() => onEdit(c.id)}
                className="p-1.5 text-gray-400 hover:text-primary rounded hover:bg-gray-100"
                title="Bearbeiten"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Klient:in "${c.name}" wirklich löschen?`)) onDelete(c.id);
                }}
                className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-gray-100"
                title="Löschen"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          {c.notes && (
            <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded p-2">{c.notes}</div>
          )}
          <div className="mt-2 pt-2 border-t border-gray-100">
            <button
              onClick={() => setExpandedDocId(expandedDocId === c.id ? null : c.id)}
              className="text-xs text-gray-500 hover:text-primary flex items-center gap-1"
            >
              <FileText size={12} />
              Dokumente
              <ChevronDown size={12} className={`transition-transform ${expandedDocId === c.id ? 'rotate-180' : ''}`} />
            </button>
            {expandedDocId === c.id && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <DocumentChecklist contextType="client" contextId={c.id} />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Therapy Form ────────────────────────────────────────────────

function TherapyForm({ clients, initialClientId, onSave, onCancel }: {
  clients: Client[];
  initialClientId?: number;
  onSave: (data: {
    clientId: number; label: string; startDate: string; endDate?: string | null;
    sessionCostCents?: number; sessionDurationMinutes?: number; videoLink?: string;
    notes?: string; schedule: TherapyScheduleRule[];
  }) => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState({
    clientId: initialClientId ?? 0,
    label: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: '',
    sessionCostCents: 12000,
    sessionDurationMinutes: 60,
    videoLink: '',
    notes: '',
    schedule: [{ dayOfWeek: 1, frequency: 'weekly' as 'weekly' | 'biweekly', time: '10:00' }],
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.clientId) return;
    onSave({
      clientId: form.clientId,
      label: form.label,
      startDate: form.startDate,
      endDate: form.endDate || null,
      sessionCostCents: form.sessionCostCents,
      sessionDurationMinutes: form.sessionDurationMinutes,
      videoLink: form.videoLink || undefined,
      notes: form.notes || undefined,
      schedule: form.schedule.filter(s => s.time),
    });
  };

  const addScheduleRule = () => {
    setForm(f => ({
      ...f,
      schedule: [...f.schedule, { dayOfWeek: 1, frequency: 'weekly' as 'weekly' | 'biweekly', time: '10:00' }],
    }));
  };

  const removeScheduleRule = (idx: number) => {
    setForm(f => ({ ...f, schedule: f.schedule.filter((_, i) => i !== idx) }));
  };

  const updateScheduleRule = (idx: number, updates: Partial<TherapyScheduleRule>) => {
    setForm(f => ({
      ...f,
      schedule: f.schedule.map((s, i) => i === idx ? { ...s, ...updates } : s),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Klient:in</label>
        <select
          value={form.clientId}
          onChange={e => setForm({ ...form, clientId: Number(e.target.value) })}
          className="w-full border rounded-md px-3 py-2 text-sm"
          required
        >
          <option value={0}>Bitte wählen...</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Bezeichnung</label>
        <input
          type="text"
          value={form.label}
          onChange={e => setForm({ ...form, label: e.target.value })}
          placeholder="z.B. Einzeltherapie"
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Enddatum (optional)</label>
          <input
            type="date"
            value={form.endDate}
            onChange={e => setForm({ ...form, endDate: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kosten pro Sitzung (Cent)</label>
          <input
            type="number"
            value={form.sessionCostCents}
            onChange={e => setForm({ ...form, sessionCostCents: Number(e.target.value) })}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
          <span className="text-xs text-gray-400">{(form.sessionCostCents / 100).toFixed(2)} €</span>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sitzungsdauer (Min.)</label>
          <input
            type="number"
            value={form.sessionDurationMinutes}
            onChange={e => setForm({ ...form, sessionDurationMinutes: Number(e.target.value) })}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Video-Link</label>
        <input
          type="url"
          value={form.videoLink}
          onChange={e => setForm({ ...form, videoLink: e.target.value })}
          placeholder="https://..."
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Zeitplan</label>
        {form.schedule.map((rule, idx) => (
          <div key={idx} className="flex items-center gap-2 mb-2">
            <select
              value={rule.dayOfWeek}
              onChange={e => updateScheduleRule(idx, { dayOfWeek: Number(e.target.value) })}
              className="border rounded-md px-2 py-1.5 text-sm"
            >
              {[1, 2, 3, 4, 5, 6, 7].map(d => (
                <option key={d} value={d}>{DAY_LABELS_LONG[d]}</option>
              ))}
            </select>
            <select
              value={rule.frequency}
              onChange={e => updateScheduleRule(idx, { frequency: e.target.value as 'weekly' | 'biweekly' })}
              className="border rounded-md px-2 py-1.5 text-sm"
            >
              <option value="weekly">Wöchentlich</option>
              <option value="biweekly">2-wöchentlich</option>
            </select>
            <input
              type="time"
              value={rule.time}
              onChange={e => updateScheduleRule(idx, { time: e.target.value })}
              className="border rounded-md px-2 py-1.5 text-sm"
            />
            {form.schedule.length > 1 && (
              <button type="button" onClick={() => removeScheduleRule(idx)} className="p-1 text-gray-400 hover:text-red-500">
                <X size={14} />
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addScheduleRule} className="text-xs text-primary hover:underline flex items-center gap-1">
          <Plus size={12} /> Weiteren Termin hinzufügen
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notizen</label>
        <textarea
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
          rows={2}
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={!form.clientId} className="flex-1 bg-primary text-white py-2 rounded-md hover:bg-teal-600 disabled:opacity-50 text-sm font-medium">
          Therapie anlegen
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-md text-sm text-gray-600 hover:bg-gray-50">
            Abbrechen
          </button>
        )}
      </div>
    </form>
  );
}

// ─── Session Panel ───────────────────────────────────────────────

function SessionPanel({ therapy, sessions, onGenerate, onUpdateSession, onDeleteSession, onSendInvoice }: {
  therapy: Therapy;
  sessions: TherapySession[];
  onGenerate: (from: string, to: string) => void;
  onUpdateSession: (id: number, updates: Partial<TherapySession>) => void;
  onDeleteSession: (id: number) => void;
  onSendInvoice: (id: number) => void;
}) {
  const [genFrom, setGenFrom] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [genTo, setGenTo] = useState(format(addMonths(new Date(), 3), 'yyyy-MM-dd'));

  const statusLabels: Record<string, string> = {
    scheduled: 'Geplant',
    completed: 'Abgeschlossen',
    cancelled: 'Abgesagt',
    no_show: 'Nicht erschienen',
  };

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
    completed: 'bg-green-50 text-green-700 border-green-200',
    cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
    no_show: 'bg-red-50 text-red-600 border-red-200',
  };

  // Payment summary
  const totalDue = sessions.filter(s => s.paymentStatus === 'due' && s.status !== 'cancelled').length;
  const totalPaid = sessions.filter(s => s.paymentStatus === 'paid').length;
  const amountDue = totalDue * therapy.sessionCostCents;
  const amountPaid = totalPaid * therapy.sessionCostCents;

  return (
    <div className="space-y-4">
      {/* Payment Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-xs text-blue-600 font-medium">Offen</div>
          <div className="text-lg font-bold text-blue-700">{(amountDue / 100).toFixed(0)} €</div>
          <div className="text-xs text-blue-500">{totalDue} Sitzungen</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-xs text-green-600 font-medium">Bezahlt</div>
          <div className="text-lg font-bold text-green-700">{(amountPaid / 100).toFixed(0)} €</div>
          <div className="text-xs text-green-500">{totalPaid} Sitzungen</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-600 font-medium">Gesamt</div>
          <div className="text-lg font-bold text-gray-700">{((amountDue + amountPaid) / 100).toFixed(0)} €</div>
          <div className="text-xs text-gray-500">{sessions.length} Sitzungen</div>
        </div>
      </div>

      {/* Generate Sessions */}
      <div className="bg-gray-50 rounded-lg p-3">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Sitzungen generieren</h4>
        <div className="flex items-end gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Von</label>
            <input type="date" value={genFrom} onChange={e => setGenFrom(e.target.value)} className="border rounded px-2 py-1 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Bis</label>
            <input type="date" value={genTo} onChange={e => setGenTo(e.target.value)} className="border rounded px-2 py-1 text-sm" />
          </div>
          <button
            onClick={() => onGenerate(genFrom, genTo)}
            className="px-3 py-1.5 bg-primary text-white rounded text-sm hover:bg-teal-600"
          >
            Generieren
          </button>
        </div>
      </div>

      {/* Session List */}
      {sessions.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">Noch keine Sitzungen.</p>
      ) : (
        <div className="space-y-2">
          {sessions.map(s => (
            <div key={s.id} className="bg-white rounded-lg border border-gray-200 p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {format(parseISO(s.sessionDate), 'd. MMM yyyy', { locale: de })}
                  </span>
                  <span className="text-gray-500">{s.sessionTime} Uhr</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded border ${statusColors[s.status]}`}>
                    {statusLabels[s.status]}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded border ${
                    s.paymentStatus === 'paid' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                  }`}>
                    {s.paymentStatus === 'paid' ? 'Bezahlt' : 'Offen'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <select
                    value={s.status}
                    onChange={e => onUpdateSession(s.id, { status: e.target.value as TherapySession['status'] })}
                    className="text-xs border rounded px-1.5 py-1"
                  >
                    <option value="scheduled">Geplant</option>
                    <option value="completed">Abgeschlossen</option>
                    <option value="cancelled">Abgesagt</option>
                    <option value="no_show">Nicht erschienen</option>
                  </select>
                  <button
                    onClick={() => onUpdateSession(s.id, {
                      paymentStatus: s.paymentStatus === 'paid' ? 'due' : 'paid',
                      paymentPaidDate: s.paymentStatus === 'paid' ? null : format(new Date(), 'yyyy-MM-dd'),
                    })}
                    className={`p-1 rounded ${s.paymentStatus === 'paid' ? 'text-green-500' : 'text-gray-400 hover:text-green-500'}`}
                    title={s.paymentStatus === 'paid' ? 'Als offen markieren' : 'Als bezahlt markieren'}
                  >
                    <Euro size={14} />
                  </button>
                  <button
                    onClick={() => onSendInvoice(s.id)}
                    disabled={s.invoiceSent}
                    className={`p-1 rounded ${s.invoiceSent ? 'text-green-400 cursor-default' : 'text-gray-400 hover:text-primary'}`}
                    title={s.invoiceSent ? 'Rechnung gesendet' : 'Rechnung senden'}
                  >
                    {s.invoiceSent ? <MailCheck size={14} /> : <FileText size={14} />}
                  </button>
                  <button
                    onClick={() => { if (confirm('Sitzung löschen?')) onDeleteSession(s.id); }}
                    className="p-1 text-gray-400 hover:text-red-500 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {s.notes && (
                <div className="mt-1 text-xs text-gray-500">{s.notes}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Therapy List ────────────────────────────────────────────────

function TherapyList({ therapies, sessions, selectedTherapyId, onSelect, onDelete, onGenerateSessions,
  onUpdateSession, onDeleteSession, onSendInvoice }: {
  therapies: Therapy[];
  sessions: TherapySession[];
  selectedTherapyId: number | null;
  onSelect: (id: number | null) => void;
  onDelete: (id: number) => void;
  onGenerateSessions: (therapyId: number, from: string, to: string) => void;
  onUpdateSession: (id: number, updates: Partial<TherapySession>) => void;
  onDeleteSession: (id: number, therapyId: number) => void;
  onSendInvoice: (id: number) => void;
}) {
  if (therapies.length === 0) {
    return (
      <p className="text-sm text-gray-400 bg-white rounded-xl border border-gray-200 p-6 text-center">
        Noch keine Therapien angelegt.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {therapies.map(t => {
        const isSelected = selectedTherapyId === t.id;
        const scheduleLabel = t.schedule
          .map(s => `${DAY_LABELS[s.dayOfWeek]} ${s.time}${s.frequency === 'biweekly' ? ' (2-wöch.)' : ''}`)
          .join(', ');

        return (
          <div key={t.id} className={`bg-white rounded-xl border shadow-sm ${isSelected ? 'border-primary' : 'border-gray-200'}`}>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <button onClick={() => onSelect(isSelected ? null : t.id)} className="text-left min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900">{t.label || 'Einzeltherapie'}</h3>
                  <div className="text-sm text-gray-600">{t.clientName}</div>
                  <div className="mt-1 text-xs text-gray-500 space-y-0.5">
                    {scheduleLabel && <div className="flex items-center gap-1"><Repeat size={12} /> {scheduleLabel}</div>}
                    <div className="flex items-center gap-1">
                      <CalendarIcon size={12} />
                      Ab {format(parseISO(t.startDate), 'd. MMM yyyy', { locale: de })}
                      {t.endDate && ` bis ${format(parseISO(t.endDate), 'd. MMM yyyy', { locale: de })}`}
                    </div>
                    <div className="flex items-center gap-1">
                      <Euro size={12} /> {(t.sessionCostCents / 100).toFixed(0)} € · {t.sessionDurationMinutes} Min.
                    </div>
                    {t.videoLink && (
                      <a href={t.videoLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline" onClick={e => e.stopPropagation()}>
                        <Video size={12} /> Video-Link
                      </a>
                    )}
                  </div>
                </button>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => { if (confirm(`Therapie "${t.label || 'Einzeltherapie'}" löschen?`)) onDelete(t.id); }}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-gray-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
            {isSelected && (
              <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-4">
                {/* Document checklist */}
                <CollapsibleSection
                  title="Dokumente"
                  icon={<FileText size={18} className="text-gray-500" />}
                >
                  <DocumentChecklist contextType="therapy" contextId={t.id} />
                </CollapsibleSection>

                {/* Sessions */}
                <SessionPanel
                  therapy={t}
                  sessions={sessions}
                  onGenerate={(from, to) => onGenerateSessions(t.id, from, to)}
                  onUpdateSession={onUpdateSession}
                  onDeleteSession={(id) => onDeleteSession(id, t.id)}
                  onSendInvoice={onSendInvoice}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Admin Page ─────────────────────────────────────────────

type TabKey = 'rules' | 'erstgespraeche' | 'einzel' | 'kunden' | 'groups' | 'dokumente';

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
    authenticated, rules, events, bookings, loading, error,
    login, logout, fetchRules, addRule, updateRule, removeRule,
    toggleException, fetchEvents, addEvent, removeEvent,
    fetchBookings, updateBooking, sendEmail,
  } = useAdminBooking();

  const {
    clients, error: clientsError,
    fetchClients, addClient, updateClient, removeClient, migrateBookingToClient,
  } = useAdminClients();

  const {
    therapies, sessions, error: therapiesError,
    fetchTherapies, addTherapy, removeTherapy,
    fetchSessions, generateSessions, updateSession, removeSession, sendInvoice,
  } = useAdminTherapies();

  const {
    groups, groupSessions, error: groupsError,
    fetchGroups, addGroup, updateGroup, removeGroup,
    addParticipant, removeParticipant,
    fetchGroupSessions, generateGroupSessions,
    updateGroupSession, removeGroupSession,
    updatePayment, sendGroupInvoice,
  } = useAdminGroups();

  const {
    templates, activeTemplate, saving: templateSaving, error: templatesError,
    fetchTemplates, fetchTemplate, updateTemplate,
  } = useAdminTemplates();

  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('rules');
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [editingClientId, setEditingClientId] = useState<number | null>(null);
  const [showNewClient, setShowNewClient] = useState(false);
  const [showNewTherapy, setShowNewTherapy] = useState(false);
  const [newTherapyClientId, setNewTherapyClientId] = useState<number | undefined>();
  const [selectedTherapyId, setSelectedTherapyId] = useState<number | null>(null);

  // Load data on auth
  useEffect(() => {
    if (authenticated) {
      fetchRules();
      fetchEvents();
      fetchBookings();
      fetchGroups();
      fetchClients();
      fetchTherapies();
      fetchTemplates();
    }
  }, [authenticated, fetchRules, fetchEvents, fetchBookings, fetchGroups, fetchClients, fetchTherapies, fetchTemplates]);

  // Load group sessions when group selected
  useEffect(() => {
    if (selectedGroupId) {
      fetchGroupSessions(selectedGroupId);
    }
  }, [selectedGroupId, fetchGroupSessions]);

  // Load sessions when therapy selected
  useEffect(() => {
    if (selectedTherapyId) {
      fetchSessions(selectedTherapyId);
    }
  }, [selectedTherapyId, fetchSessions]);

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

  // Cross-tab navigation: migrate booking → create client → switch to Kunden
  const handleMigrateToClient = useCallback(async (bookingId: number) => {
    const clientId = await migrateBookingToClient(bookingId);
    if (clientId) {
      setActiveTab('kunden');
    }
  }, [migrateBookingToClient]);

  // Cross-tab navigation: new therapy from Kunden → switch to Einzel
  const handleNewTherapyFromClient = useCallback((clientId: number) => {
    setNewTherapyClientId(clientId);
    setShowNewTherapy(true);
    setActiveTab('einzel');
  }, []);

  const combinedError = error || clientsError || therapiesError || groupsError || templatesError;

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
  const editingClient = editingClientId ? clients.find(c => c.id === editingClientId) : undefined;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Administration</h1>
            <nav className="hidden sm:flex items-center gap-1 ml-2">
              <Link to="/" className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                <Home size={14} />
                Website
              </Link>
              <a href="https://app.eu.amplitude.com/analytics/mut-taucher-395196/home" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                <BarChart3 size={14} />
                Analytics
                <ExternalLink size={10} className="opacity-50" />
              </a>
            </nav>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>

        {combinedError && (
          <div className="mb-6 flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
            <AlertCircle size={16} className="shrink-0" />
            {combinedError}
          </div>
        )}

        {/* Tab navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-4 overflow-x-auto">
            {([
              ['rules', Repeat, 'Regeln & Kalender', null],
              ['erstgespraeche', CalendarIcon, 'Erstgespräche', bookings.filter(b => b.status === 'confirmed').length],
              ['einzel', Video, 'Einzeltherapie', therapies.length],
              ['groups', Users, 'Gruppentherapie', groups.length],
              ['kunden', Users, 'Kunden', clients.length],
              ['dokumente', FileText, 'Vorlagen', templates.length],
            ] as const).map(([key, Icon, label, count]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as TabKey)}
                className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={16} />
                {label}
                {count !== null && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === key ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </nav>
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

        {activeTab === 'erstgespraeche' && (
          <div className="max-w-3xl">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CalendarIcon size={20} className="text-gray-500" />
                Erstgespräche
              </h2>
              <BookingList
                bookings={bookings}
                onUpdate={updateBooking}
                onSendEmail={sendEmail}
                onMigrateToClient={handleMigrateToClient}
              />
            </div>
          </div>
        )}

        {activeTab === 'einzel' && (
          <div className="max-w-4xl space-y-6">
            {showNewTherapy ? (
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Plus size={20} className="text-primary" />
                  Neue Therapie
                </h2>
                <TherapyForm
                  clients={clients}
                  initialClientId={newTherapyClientId}
                  onSave={async (data) => {
                    await addTherapy(data);
                    setShowNewTherapy(false);
                    setNewTherapyClientId(undefined);
                  }}
                  onCancel={() => { setShowNewTherapy(false); setNewTherapyClientId(undefined); }}
                />
              </div>
            ) : (
              <button
                onClick={() => setShowNewTherapy(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-teal-600 text-sm font-medium"
              >
                <Plus size={16} /> Neue Therapie
              </button>
            )}

            <TherapyList
              therapies={therapies}
              sessions={sessions}
              selectedTherapyId={selectedTherapyId}
              onSelect={setSelectedTherapyId}
              onDelete={removeTherapy}
              onGenerateSessions={async (tid, from, to) => { await generateSessions(tid, from, to); }}
              onUpdateSession={(id, updates) => updateSession(id, updates)}
              onDeleteSession={(id, tid) => removeSession(id, tid)}
              onSendInvoice={sendInvoice}
            />
          </div>
        )}

        {activeTab === 'kunden' && (
          <div className="max-w-3xl space-y-6">
            {showNewClient || editingClient ? (
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  {editingClient ? (
                    <><Pencil size={20} className="text-primary" /> Klient:in bearbeiten</>
                  ) : (
                    <><UserPlus size={20} className="text-primary" /> Neue:r Klient:in</>
                  )}
                </h2>
                <ClientForm
                  key={editingClientId ?? 'new'}
                  initial={editingClient ?? undefined}
                  onSave={async (data) => {
                    if (editingClient) {
                      await updateClient(editingClientId!, data);
                    } else {
                      await addClient(data);
                    }
                    setEditingClientId(null);
                    setShowNewClient(false);
                  }}
                  onCancel={() => { setEditingClientId(null); setShowNewClient(false); }}
                />
              </div>
            ) : (
              <button
                onClick={() => setShowNewClient(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-teal-600 text-sm font-medium"
              >
                <UserPlus size={16} /> Neue:r Klient:in
              </button>
            )}

            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Users size={20} className="text-gray-500" />
                Klient:innen ({clients.length})
              </h2>
              <ClientList
                clients={clients}
                onEdit={(id) => { setEditingClientId(id); setShowNewClient(false); }}
                onDelete={removeClient}
                onNewTherapy={handleNewTherapyFromClient}
              />
            </div>
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="max-w-4xl space-y-6">
            {showNewGroup ? (
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Plus size={20} className="text-primary" />
                  Neue Gruppe
                </h2>
                <GroupForm
                  onSave={async (data) => {
                    await addGroup(data);
                    setShowNewGroup(false);
                  }}
                  onCancel={() => setShowNewGroup(false)}
                />
              </div>
            ) : (
              <button
                onClick={() => setShowNewGroup(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-teal-600 text-sm font-medium"
              >
                <Plus size={16} /> Neue Gruppe
              </button>
            )}

            <GroupManager
              groups={groups}
              clients={clients}
              selectedGroupId={selectedGroupId}
              onSelect={setSelectedGroupId}
              onDelete={removeGroup}
              onToggleHomepage={(id, current) => updateGroup(id, { showOnHomepage: !current })}
              onAddParticipant={addParticipant}
              onRemoveParticipant={removeParticipant}
              groupSessions={groupSessions}
              onGenerateSessions={async (gid, from, to) => { await generateGroupSessions(gid, from, to); }}
              onUpdateSession={(id, updates) => updateGroupSession(id, updates)}
              onDeleteSession={(id, gid) => removeGroupSession(id, gid)}
              onUpdatePayment={(pid, updates) => updatePayment(pid, updates, selectedGroupId ?? undefined)}
              onSendInvoice={(pid) => sendGroupInvoice(pid, selectedGroupId ?? undefined)}
            />
          </div>
        )}

        {activeTab === 'dokumente' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar: template list */}
            <div className="lg:col-span-1 space-y-1">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Vorlagen</h3>
              {templates.map(t => (
                <button
                  key={t.key}
                  onClick={() => fetchTemplate(t.key)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                    activeTemplate?.key === t.key
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Editor */}
            <div className="lg:col-span-3">
              {activeTemplate ? (
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4 text-gray-900">{activeTemplate.label}</h2>
                  <TemplateEditor
                    key={activeTemplate.key}
                    htmlContent={activeTemplate.htmlContent}
                    placeholders={activeTemplate.placeholders}
                    saving={templateSaving}
                    onSave={(html) => updateTemplate(activeTemplate.key, html)}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
                  Vorlage aus der Liste auswählen
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
