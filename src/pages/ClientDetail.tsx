import { useState, useEffect, useRef, type FormEvent, type ReactNode } from 'react';

import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useClientHistory, type TimelineEvent } from '../lib/useClientHistory';
import type { Client } from '../lib/data';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  ArrowLeftOutlined, CalendarOutlined, DollarOutlined, FileTextOutlined,
  UploadOutlined, FormOutlined, DownloadOutlined, EditOutlined,
  DeleteOutlined, LoadingOutlined, TeamOutlined,
} from '@ant-design/icons';
import { Card, Button, Tag, Space, Typography, Spin, Input, Modal, Alert } from 'antd';

const { Text, Title } = Typography;

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Geplant',
  completed: 'Abgeschlossen',
  cancelled: 'Abgesagt',
  no_show: 'Nicht erschienen',
};

const EVENT_ICONS: Record<string, ReactNode> = {
  session: <CalendarOutlined />,
  group_session: <TeamOutlined />,
  payment: <DollarOutlined />,
  document_sent: <FileTextOutlined />,
  document_received: <UploadOutlined />,
  note: <FormOutlined />,
};

const EVENT_COLORS: Record<string, { color: string; background: string }> = {
  session: { color: '#2563eb', background: '#eff6ff' },
  group_session: { color: '#9333ea', background: '#faf5ff' },
  payment: { color: '#16a34a', background: '#f0fdf4' },
  document_sent: { color: '#ea580c', background: '#fff7ed' },
  document_received: { color: '#0d9488', background: '#f0fdfa' },
  note: { color: '#a16207', background: '#fefce8' },
};

function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'dd.MM.yyyy', { locale: de });
}

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 }) + ' €';
}

export function ClientHistoryPanel({ clientId }: { clientId: number }) {
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 64 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!client) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 64 }}>
        <Text type="secondary">Patient:in nicht gefunden.</Text>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Contact info card */}
      <Card size="small">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 14 }}>
          <div>
            <Text type="secondary">E-Mail: </Text>
            <a href={`mailto:${client.email}`}>{client.email}</a>
          </div>
          {client.phone && (
            <div>
              <Text type="secondary">Telefon: </Text>
              <Text>{client.phone}</Text>
            </div>
          )}
          {(client.street || client.city) && (
            <div style={{ gridColumn: '1 / -1' }}>
              <Text type="secondary">Adresse: </Text>
              <Text>
                {[client.street, [client.zip, client.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')}
              </Text>
            </div>
          )}
        </div>
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0', fontSize: 12, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {client.therapyCount > 0 && <Text type="secondary">{client.therapyCount} Einzeltherapie{client.therapyCount !== 1 ? 'n' : ''}</Text>}
          {client.groupCount > 0 && <Text type="secondary">{client.groupCount} Gruppe{client.groupCount !== 1 ? 'n' : ''}</Text>}
          <Text type="secondary">Seit {formatDate(client.createdAt)}</Text>
        </div>
      </Card>

      {/* Add note */}
      <NoteForm onSubmit={addNote} />

      {/* Upload document */}
      <DocumentUploadForm onUpload={uploadDocument} />

      {/* Timeline */}
      <Card size="small" title="Verlauf">
        {error && (
          <Alert message={error} type="error" style={{ marginBottom: 16 }} />
        )}

        {events.length === 0 && !loading && (
          <Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: 16 }}>
            Noch keine Einträge vorhanden.
          </Text>
        )}

        <Timeline
          events={events}
          onUpdateNote={updateNote}
          onDeleteNote={deleteNote}
          onDeleteDocument={deleteDocument}
        />

        {events.length < total && (
          <div style={{ padding: 16, borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
            <Button
              type="link"
              onClick={() => fetchTimeline(50, events.length, true)}
              disabled={loading}
            >
              {loading ? 'Laden…' : 'Mehr laden…'}
            </Button>
          </div>
        )}

        {loading && events.length === 0 && (
          <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
          </div>
        )}
      </Card>
    </div>
  );
}

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const clientId = Number(id);

  const [client, setClient] = useState<Client | null>(null);
  const [clientLoading, setClientLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    setClientLoading(true);
    apiFetch<Client>(`/admin/clients/${clientId}`)
      .then(setClient)
      .catch(() => setClient(null))
      .finally(() => setClientLoading(false));
  }, [clientId]);

  if (clientLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 64 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!client) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 64, gap: 16 }}>
        <Text type="secondary">Patient:in nicht gefunden.</Text>
        <Link to="/admin/kunden">
          <Button type="link" icon={<ArrowLeftOutlined />}>Zurück zur Übersicht</Button>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 768, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <Space align="center">
        <Link to="/admin/kunden">
          <Button type="text" icon={<ArrowLeftOutlined />} />
        </Link>
        <Title level={4} style={{ margin: 0 }}>
          {client.name}
        </Title>
        {client.status === 'archived' && (
          <Tag>Archiviert</Tag>
        )}
      </Space>

      <ClientHistoryPanel clientId={clientId} />
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
    <Card size="small">
      <form onSubmit={handleSubmit}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>Notiz hinzufügen</Text>
        <div style={{ display: 'flex', gap: 8 }}>
          <Input.TextArea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Notiz eingeben…"
            rows={2}
            style={{ flex: 1 }}
          />
          <Button
            type="primary"
            htmlType="submit"
            disabled={!content.trim()}
            loading={submitting}
            style={{ alignSelf: 'flex-end' }}
          >
            Speichern
          </Button>
        </div>
      </form>
    </Card>
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
    <Card size="small">
      <form onSubmit={handleSubmit}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>Dokument hochladen</Text>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end' }}>
          <input
            ref={fileRef}
            type="file"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
            style={{ fontSize: 14 }}
          />
          <Input
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Bezeichnung"
            style={{ width: 200 }}
          />
          <Button
            type="primary"
            htmlType="submit"
            disabled={!file || !label.trim()}
            loading={submitting}
          >
            Hochladen
          </Button>
        </div>
      </form>
    </Card>
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
    <div>
      {Object.entries(grouped).map(([date, dayEvents]) => (
        <div key={date} style={{ padding: 16, borderBottom: '1px solid #f0f0f0' }}>
          <Text type="secondary" style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 12 }}>
            {formatDate(date)}
          </Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
  const icon = EVENT_ICONS[event.type] ?? <CalendarOutlined />;
  const colors = EVENT_COLORS[event.type] ?? { color: '#6b7280', background: '#f9fafb' };

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{
        padding: 6,
        borderRadius: 8,
        flexShrink: 0,
        color: colors.color,
        background: colors.background,
        fontSize: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
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
      <div style={{ fontSize: 14 }}>
        <Text strong>Sitzung:</Text>{' '}
        <Text>{data.therapyLabel as string}</Text>
        {event.time !== '00:00' && <Text type="secondary"> {event.time}</Text>}
        <Text type="secondary"> — {status}</Text>
        {data.notes ? <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{String(data.notes)}</p> : null}
      </div>
    );
  }

  if (type === 'group_session') {
    const status = STATUS_LABELS[data.status as string] ?? data.status;
    return (
      <div style={{ fontSize: 14 }}>
        <Text strong>Gruppensitzung:</Text>{' '}
        <Text>{data.groupLabel as string}</Text>
        {event.time !== '00:00' && <Text type="secondary"> {event.time}</Text>}
        <Text type="secondary"> — {status}</Text>
      </div>
    );
  }

  if (type === 'payment') {
    const amount = formatCents(data.amountCents as number);
    const label = (data.therapyLabel ?? data.groupLabel ?? 'Sitzung') as string;
    return (
      <div style={{ fontSize: 14 }}>
        <Text strong style={{ color: '#15803d' }}>Zahlung:</Text>{' '}
        <Text>{amount}</Text>
        <Text type="secondary"> — {label}</Text>
      </div>
    );
  }

  if (type === 'document_sent' || type === 'document_received') {
    const docId = data.id as number;
    const isSent = type === 'document_sent';
    return (
      <div style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Text strong>
          {isSent ? 'Dokument gesendet:' : 'Dokument empfangen:'}
        </Text>
        <Text>{data.label as string}</Text>
        <a
          href={`/api/admin/client-documents/${docId}/download`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <DownloadOutlined />
        </a>
        {!isSent && (
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => {
              Modal.confirm({
                title: 'Dokument löschen',
                content: 'Dokument wirklich löschen?',
                okText: 'Löschen',
                okType: 'danger',
                cancelText: 'Abbrechen',
                onOk: () => onDeleteDocument(docId),
              });
            }}
          />
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

  return <Text type="secondary" style={{ fontSize: 14 }}>Unbekannter Eintrag</Text>;
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Input.TextArea
          value={editContent}
          onChange={e => setEditContent(e.target.value)}
          rows={2}
        />
        <Space>
          <Button
            type="primary"
            size="small"
            onClick={handleSave}
            loading={saving}
          >
            Speichern
          </Button>
          <Button
            size="small"
            onClick={() => { setEditing(false); setEditContent(content); }}
          >
            Abbrechen
          </Button>
        </Space>
      </div>
    );
  }

  return (
    <div style={{ fontSize: 14, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <div style={{ flex: 1 }}>
        <Text strong>Notiz:</Text>{' '}
        <Text>{content}</Text>
      </div>
      <Space size={4} style={{ flexShrink: 0 }}>
        <Button type="text" icon={<EditOutlined />} size="small" onClick={() => setEditing(true)} />
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          size="small"
          onClick={() => {
            Modal.confirm({
              title: 'Notiz löschen',
              content: 'Notiz wirklich löschen?',
              okText: 'Löschen',
              okType: 'danger',
              cancelText: 'Abbrechen',
              onOk: () => onDelete(noteId),
            });
          }}
        />
      </Space>
    </div>
  );
}
