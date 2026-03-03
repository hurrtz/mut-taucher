import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useClientHistory, type TimelineEvent } from '../lib/useClientHistory';
import type { Client } from '../lib/data';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  ArrowLeft, Calendar, CreditCard, FileText, Upload, StickyNote,
  Download, Pencil, Trash2, Loader2, Users,
} from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Geplant',
  completed: 'Abgeschlossen',
  cancelled: 'Abgesagt',
  no_show: 'Nicht erschienen',
};

const EVENT_ICONS: Record<string, typeof Calendar> = {
  session: Calendar,
  group_session: Users,
  payment: CreditCard,
  document_sent: FileText,
  document_received: Upload,
  note: StickyNote,
};

const EVENT_COLORS: Record<string, string> = {
  session: 'text-blue-600 bg-blue-50',
  group_session: 'text-purple-600 bg-purple-50',
  payment: 'text-green-600 bg-green-50',
  document_sent: 'text-orange-600 bg-orange-50',
  document_received: 'text-teal-600 bg-teal-50',
  note: 'text-yellow-700 bg-yellow-50',
};

function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'dd.MM.yyyy', { locale: de });
}

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 }) + ' €';
}

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const clientId = Number(id);

  const [client, setClient] = useState<Client | null>(null);
  const [clientLoading, setClientLoading] = useState(true);

  const {
    events, total, loading, error,
    fetchTimeline, addNote, updateNote, deleteNote,
    uploadDocument, deleteDocument,
  } = useClientHistory(clientId);

  // Load client data
  useEffect(() => {
    if (!clientId) return;
    setClientLoading(true);
    apiFetch<Client>(`/admin/clients/${clientId}`)
      .then(setClient)
      .catch(() => setClient(null))
      .finally(() => setClientLoading(false));
  }, [clientId]);

  // Load timeline
  useEffect(() => {
    if (clientId) fetchTimeline();
  }, [clientId, fetchTimeline]);

  if (clientLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600">Klient:in nicht gefunden.</p>
        <Link to="/admin" className="text-primary hover:underline">← Zurück zur Übersicht</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to="/admin" className="text-gray-400 hover:text-primary">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-serif font-bold text-gray-900">
            {client.name}
          </h1>
          {client.status === 'archived' && (
            <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Archiviert</span>
          )}
        </div>

        {/* Contact info card */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">E-Mail:</span>{' '}
              <a href={`mailto:${client.email}`} className="text-primary hover:underline">{client.email}</a>
            </div>
            {client.phone && (
              <div>
                <span className="text-gray-500">Telefon:</span> {client.phone}
              </div>
            )}
            {(client.street || client.city) && (
              <div className="sm:col-span-2">
                <span className="text-gray-500">Adresse:</span>{' '}
                {[client.street, [client.zip, client.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')}
              </div>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400 flex flex-wrap gap-x-3">
            {client.therapyCount > 0 && <span>{client.therapyCount} Einzeltherapie{client.therapyCount !== 1 ? 'n' : ''}</span>}
            {client.groupCount > 0 && <span>{client.groupCount} Gruppe{client.groupCount !== 1 ? 'n' : ''}</span>}
            <span>Seit {formatDate(client.createdAt)}</span>
          </div>
        </div>

        {/* Add note */}
        <NoteForm onSubmit={addNote} />

        {/* Upload document */}
        <DocumentUploadForm onUpload={uploadDocument} />

        {/* Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Verlauf</h2>
          </div>

          {error && (
            <div className="p-4 text-sm text-red-600">{error}</div>
          )}

          {events.length === 0 && !loading && (
            <p className="p-4 text-sm text-gray-400 text-center">Noch keine Einträge vorhanden.</p>
          )}

          <Timeline
            events={events}
            onUpdateNote={updateNote}
            onDeleteNote={deleteNote}
            onDeleteDocument={deleteDocument}
          />

          {events.length < total && (
            <div className="p-4 border-t border-gray-100 text-center">
              <button
                onClick={() => fetchTimeline(50, events.length, true)}
                disabled={loading}
                className="text-sm text-primary hover:underline disabled:opacity-50"
              >
                {loading ? 'Laden…' : 'Mehr laden…'}
              </button>
            </div>
          )}

          {loading && events.length === 0 && (
            <div className="p-6 flex justify-center">
              <Loader2 className="animate-spin text-gray-400" size={24} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Note Form ───────────────────────────────────────────────────

function NoteForm({ onSubmit }: { onSubmit: (content: string) => Promise<void> }) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Notiz hinzufügen</h3>
      <div className="flex gap-2">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Notiz eingeben…"
          rows={2}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        <button
          type="submit"
          disabled={!content.trim() || submitting}
          className="self-end px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? <Loader2 className="animate-spin" size={16} /> : 'Speichern'}
        </button>
      </div>
    </form>
  );
}

// ─── Document Upload Form ────────────────────────────────────────

function DocumentUploadForm({ onUpload }: { onUpload: (file: File, label: string, notes?: string) => Promise<void> }) {
  const [label, setLabel] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file || !label.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onUpload(file, label.trim());
      setLabel('');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Dokument hochladen</h3>
      <div className="flex flex-wrap gap-2 items-end">
        <input
          ref={fileRef}
          type="file"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
          className="text-sm file:mr-2 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
        />
        <input
          type="text"
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Bezeichnung"
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        <button
          type="submit"
          disabled={!file || !label.trim() || submitting}
          className="px-4 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? <Loader2 className="animate-spin" size={16} /> : 'Hochladen'}
        </button>
      </div>
    </form>
  );
}

// ─── Timeline ────────────────────────────────────────────────────

function Timeline({ events, onUpdateNote, onDeleteNote, onDeleteDocument }: {
  events: TimelineEvent[];
  onUpdateNote: (noteId: number, content: string) => Promise<void>;
  onDeleteNote: (noteId: number) => Promise<void>;
  onDeleteDocument: (docId: number) => Promise<void>;
}) {
  // Group events by date
  const grouped = events.reduce<Record<string, TimelineEvent[]>>((acc, ev) => {
    (acc[ev.date] ??= []).push(ev);
    return acc;
  }, {});

  return (
    <div className="divide-y divide-gray-100">
      {Object.entries(grouped).map(([date, dayEvents]) => (
        <div key={date} className="p-4">
          <div className="text-xs font-medium text-gray-500 mb-3">
            {formatDate(date)}
          </div>
          <div className="space-y-3">
            {dayEvents.map((ev, i) => (
              <TimelineItem
                key={`${ev.type}-${i}`}
                event={ev}
                onUpdateNote={onUpdateNote}
                onDeleteNote={onDeleteNote}
                onDeleteDocument={onDeleteDocument}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TimelineItem({ event, onUpdateNote, onDeleteNote, onDeleteDocument }: {
  event: TimelineEvent;
  onUpdateNote: (noteId: number, content: string) => Promise<void>;
  onDeleteNote: (noteId: number) => Promise<void>;
  onDeleteDocument: (docId: number) => Promise<void>;
}) {
  const Icon = EVENT_ICONS[event.type] ?? Calendar;
  const colors = EVENT_COLORS[event.type] ?? 'text-gray-600 bg-gray-50';

  return (
    <div className="flex gap-3 items-start">
      <div className={`p-1.5 rounded-lg shrink-0 ${colors}`}>
        <Icon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <EventContent
          event={event}
          onUpdateNote={onUpdateNote}
          onDeleteNote={onDeleteNote}
          onDeleteDocument={onDeleteDocument}
        />
      </div>
    </div>
  );
}

function EventContent({ event, onUpdateNote, onDeleteNote, onDeleteDocument }: {
  event: TimelineEvent;
  onUpdateNote: (noteId: number, content: string) => Promise<void>;
  onDeleteNote: (noteId: number) => Promise<void>;
  onDeleteDocument: (docId: number) => Promise<void>;
}) {
  const { type, data } = event;

  if (type === 'session') {
    const status = STATUS_LABELS[data.status as string] ?? data.status;
    return (
      <div className="text-sm">
        <span className="font-medium text-gray-900">Sitzung:</span>{' '}
        <span className="text-gray-700">{data.therapyLabel as string}</span>
        {event.time !== '00:00' && <span className="text-gray-500"> {event.time}</span>}
        <span className="text-gray-500"> — {status}</span>
        {data.notes ? <p className="text-xs text-gray-500 mt-1">{String(data.notes)}</p> : null}
      </div>
    );
  }

  if (type === 'group_session') {
    const status = STATUS_LABELS[data.status as string] ?? data.status;
    return (
      <div className="text-sm">
        <span className="font-medium text-gray-900">Gruppensitzung:</span>{' '}
        <span className="text-gray-700">{data.groupLabel as string}</span>
        {event.time !== '00:00' && <span className="text-gray-500"> {event.time}</span>}
        <span className="text-gray-500"> — {status}</span>
      </div>
    );
  }

  if (type === 'payment') {
    const amount = formatCents(data.amountCents as number);
    const label = (data.therapyLabel ?? data.groupLabel ?? 'Sitzung') as string;
    return (
      <div className="text-sm">
        <span className="font-medium text-green-700">Zahlung:</span>{' '}
        <span className="text-gray-700">{amount}</span>
        <span className="text-gray-500"> — {label}</span>
      </div>
    );
  }

  if (type === 'document_sent' || type === 'document_received') {
    const docId = data.id as number;
    const isSent = type === 'document_sent';
    return (
      <div className="text-sm flex items-center gap-2 flex-wrap">
        <span className="font-medium text-gray-900">
          {isSent ? 'Dokument gesendet:' : 'Dokument empfangen:'}
        </span>
        <span className="text-gray-700">{data.label as string}</span>
        <a
          href={`/api/admin/client-documents/${docId}/download`}
          className="text-primary hover:underline inline-flex items-center gap-0.5"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Download size={12} />
        </a>
        {!isSent && (
          <button
            onClick={() => { if (confirm('Dokument wirklich löschen?')) onDeleteDocument(docId); }}
            className="text-gray-400 hover:text-red-500"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    );
  }

  if (type === 'note') {
    return (
      <NoteEvent
        noteId={data.id as number}
        content={data.content as string}
        onUpdate={onUpdateNote}
        onDelete={onDeleteNote}
      />
    );
  }

  return <div className="text-sm text-gray-500">Unbekannter Eintrag</div>;
}

function NoteEvent({ noteId, content, onUpdate, onDelete }: {
  noteId: number;
  content: string;
  onUpdate: (noteId: number, content: string) => Promise<void>;
  onDelete: (noteId: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!editContent.trim() || saving) return;
    setSaving(true);
    try {
      await onUpdate(noteId, editContent.trim());
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="space-y-2">
        <textarea
          value={editContent}
          onChange={e => setEditContent(e.target.value)}
          rows={2}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1 bg-primary text-white rounded text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? 'Speichern…' : 'Speichern'}
          </button>
          <button
            onClick={() => { setEditing(false); setEditContent(content); }}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200"
          >
            Abbrechen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-sm flex items-start gap-2">
      <div className="flex-1">
        <span className="font-medium text-gray-900">Notiz:</span>{' '}
        <span className="text-gray-700">{content}</span>
      </div>
      <div className="flex gap-1 shrink-0">
        <button onClick={() => setEditing(true)} className="text-gray-400 hover:text-primary">
          <Pencil size={12} />
        </button>
        <button
          onClick={() => { if (confirm('Notiz wirklich löschen?')) onDelete(noteId); }}
          className="text-gray-400 hover:text-red-500"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
