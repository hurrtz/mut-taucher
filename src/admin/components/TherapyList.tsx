import { useState, useEffect } from 'react';
import type { Therapy, TherapySession } from '../../lib/data';
import { DAY_LABELS, SESSION_STATUS_LABELS, SESSION_STATUS_COLORS } from '../constants';
import { useAdminStyles } from '../styles';
import { DocumentCollapse } from './DocumentChecklist';
import { therapyHasInteraction } from '../utils';
import { format, parseISO, addMonths } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  SyncOutlined, CalendarOutlined, EuroCircleOutlined,
  VideoCameraOutlined, DeleteOutlined, CheckCircleOutlined,
  FileTextOutlined, ContainerOutlined, EditOutlined,
} from '@ant-design/icons';
import { Card, Button, Tag, Space, Typography, Modal, Select, Statistic, Row, Col, DatePicker, Collapse, TimePicker, InputNumber, Tooltip } from 'antd';
import type { ReactNode } from 'react';
import dayjs from 'dayjs';

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
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editDuration, setEditDuration] = useState(60);
  const styles = useAdminStyles();

  const totalDue = sessions.filter(s => s.paymentStatus === 'due' && s.status !== 'cancelled').length;
  const totalPaid = sessions.filter(s => s.paymentStatus === 'paid').length;
  const amountDue = totalDue * therapy.sessionCostCents;
  const amountPaid = totalPaid * therapy.sessionCostCents;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Card size="small" type="inner" title="Finanzieller Status">
        <Row gutter={16}>
          <Col span={8} style={{ textAlign: 'center' }}>
            <Statistic
              title="Offen"
              value={(amountDue / 100).toFixed(0)}
              suffix="€"
              valueStyle={{ color: styles.token.colorPrimary }}
            />
            <Typography.Text type="secondary" style={{ fontSize: styles.token.fontSizeSM }}>{totalDue} Sitzungen</Typography.Text>
          </Col>
          <Col span={8} style={{ textAlign: 'center' }}>
            <Statistic
              title="Bezahlt"
              value={(amountPaid / 100).toFixed(0)}
              suffix="€"
              valueStyle={{ color: styles.token.colorSuccess }}
            />
            <Typography.Text type="secondary" style={{ fontSize: styles.token.fontSizeSM }}>{totalPaid} Sitzungen</Typography.Text>
          </Col>
          <Col span={8} style={{ textAlign: 'center' }}>
            <Statistic
              title="Gesamt"
              value={((amountDue + amountPaid) / 100).toFixed(0)}
              suffix="€"
            />
            <Typography.Text type="secondary" style={{ fontSize: styles.token.fontSizeSM }}>{sessions.length} Sitzungen</Typography.Text>
          </Col>
        </Row>
      </Card>

      {sessions.length === 0 ? (
        <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: '16px 0' }}>
          Noch keine Sitzungen.
        </Typography.Text>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sessions.map(s => {
            const isEditing = editingSessionId === s.id;
            return (
            <Card key={s.id} size="small">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                {isEditing ? (
                  <Space>
                    <DatePicker
                      value={dayjs(editDate)}
                      onChange={(d) => { if (d) setEditDate(d.format('YYYY-MM-DD')); }}
                      size="small"
                    />
                    <TimePicker
                      value={dayjs(editTime, 'HH:mm')}
                      onChange={(t) => { if (t) setEditTime(t.format('HH:mm')); }}
                      format="HH:mm"
                      minuteStep={5}
                      size="small"
                    />
                    <InputNumber
                      value={editDuration}
                      onChange={(v) => { if (v) setEditDuration(v); }}
                      min={15}
                      max={240}
                      size="small"
                      style={{ width: 70 }}
                      suffix="Min."
                    />
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => {
                        onUpdateSession(s.id, {
                          sessionDate: editDate,
                          sessionTime: editTime,
                          durationMinutes: editDuration,
                        } as Partial<TherapySession>);
                        setEditingSessionId(null);
                      }}
                    >
                      OK
                    </Button>
                    <Button size="small" onClick={() => setEditingSessionId(null)}>
                      Abbrechen
                    </Button>
                  </Space>
                ) : (
                  <Space>
                    <Typography.Text strong>
                      {format(parseISO(s.sessionDate), 'd. MMM yyyy', { locale: de })}
                    </Typography.Text>
                    <Typography.Text type="secondary">{s.sessionTime} Uhr</Typography.Text>
                    <Tag color={SESSION_STATUS_COLORS[s.status]}>{SESSION_STATUS_LABELS[s.status]}</Tag>
                    <Tag color={s.paymentStatus === 'paid' ? 'green' : 'gold'}>
                      {s.paymentStatus === 'paid' ? 'Bezahlt' : 'Offen'}
                    </Tag>
                  </Space>
                )}
                <Space size={8}>
                  <Select
                    value={s.status}
                    onChange={(value) => onUpdateSession(s.id, { status: value as TherapySession['status'] })}
                    style={{ width: 160 }}
                    options={[
                      { value: 'scheduled', label: 'Geplant' },
                      { value: 'completed', label: 'Abgeschlossen' },
                      { value: 'cancelled', label: 'Abgesagt' },
                      { value: 'no_show', label: 'Nicht erschienen' },
                    ]}
                  />
                  <Space size={0}>
                  <Tooltip title="Termin ändern">
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => {
                        setEditingSessionId(s.id);
                        setEditDate(s.sessionDate);
                        setEditTime(s.sessionTime);
                        setEditDuration(s.durationMinutes ?? therapy.sessionDurationMinutes);
                      }}
                    />
                  </Tooltip>
                  <Tooltip title={s.paymentStatus === 'paid' ? 'Als offen markieren' : 'Als bezahlt markieren'}>
                    <Button
                      type="text"
                      icon={<EuroCircleOutlined />}
                      onClick={() => onUpdateSession(s.id, {
                        paymentStatus: s.paymentStatus === 'paid' ? 'due' : 'paid',
                        paymentPaidDate: s.paymentStatus === 'paid' ? null : format(new Date(), 'yyyy-MM-dd'),
                      })}
                      style={{ color: s.paymentStatus === 'paid' ? styles.token.colorSuccess : undefined }}
                    />
                  </Tooltip>
                  <Tooltip title={s.invoiceSent ? 'Rechnung gesendet' : 'Rechnung senden'}>
                    <Button
                      type="text"
                      icon={s.invoiceSent ? <CheckCircleOutlined /> : <FileTextOutlined />}
                      onClick={() => onSendInvoice(s.id)}
                      disabled={s.invoiceSent}
                      style={{ color: s.invoiceSent ? styles.token.colorSuccess : undefined }}
                    />
                  </Tooltip>
                  <Tooltip title="Sitzung löschen">
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        Modal.confirm({
                          title: 'Sitzung löschen?',
                          onOk: () => onDeleteSession(s.id),
                        });
                      }}
                    />
                  </Tooltip>
                </Space>
                </Space>
              </div>
              {s.notes && (
                <Typography.Text type="secondary" style={{ fontSize: styles.token.fontSizeSM, marginTop: 4, display: 'block' }}>
                  {s.notes}
                </Typography.Text>
              )}
            </Card>
          );
          })}
        </div>
      )}

      <Collapse
        items={[{
          key: 'gen',
          label: 'Sitzungen generieren',
          children: (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space>
                <Typography.Text type="secondary" style={{ width: 28, display: 'inline-block' }}>Von</Typography.Text>
                <DatePicker
                  value={dayjs(genFrom)}
                  onChange={(d) => { if (d) setGenFrom(d.format('YYYY-MM-DD')); }}
                />
              </Space>
              <Space>
                <Typography.Text type="secondary" style={{ width: 28, display: 'inline-block' }}>Bis</Typography.Text>
                <DatePicker
                  value={dayjs(genTo)}
                  onChange={(d) => { if (d) setGenTo(d.format('YYYY-MM-DD')); }}
                />
              </Space>
              <Button type="primary" onClick={() => onGenerate(genFrom, genTo)} block>
                Generieren
              </Button>
            </Space>
          ),
        }]}
      />
    </div>
  );
}

// ─── Therapy Card ────────────────────────────────────────────────

function TherapyCard({ therapy, sessions, fetchSessions, onEdit, onDelete, onArchive, onGenerateSessions,
  onUpdateSession, onDeleteSession, onSendInvoice }: {
  therapy: Therapy;
  sessions: TherapySession[];
  fetchSessions: (therapyId: number) => void;
  onEdit?: (therapy: Therapy) => void;
  onDelete?: (id: number) => void;
  onArchive?: (id: number) => void;
  onGenerateSessions: (therapyId: number, from: string, to: string) => void;
  onUpdateSession: (id: number, updates: Partial<TherapySession>) => void;
  onDeleteSession: (id: number, therapyId: number) => void;
  onSendInvoice: (id: number) => void;
}) {
  const styles = useAdminStyles();

  useEffect(() => {
    fetchSessions(therapy.id);
  }, [therapy.id, fetchSessions]);

  const scheduleLabel = therapy.schedule
    .map(s => `${DAY_LABELS[s.dayOfWeek]} ${s.time}${s.frequency === 'biweekly' ? ' (2-wöch.)' : ''}`)
    .join(', ');

  const hasInteraction = therapyHasInteraction(sessions);

  return (
    <Card
      size="default"
      title={
        <Space>
          <span>{therapy.label || 'Einzeltherapie'}</span>
          <Typography.Text type="secondary" style={{ fontWeight: 'normal' }}>— {therapy.clientName}</Typography.Text>
        </Space>
      }
      extra={
        (onEdit || onDelete || onArchive) ? (
          <Space size={0}>
          {onEdit && (
            <Tooltip title="Bearbeiten">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => onEdit(therapy)}
              />
            </Tooltip>
          )}
          {hasInteraction ? (
            onArchive && <Tooltip title="Archivieren"><Button
              type="text"
              icon={<ContainerOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: `Therapie "${therapy.label || 'Einzeltherapie'}" archivieren?`,
                  content: 'Die Therapie hat Sitzungen mit Interaktionen und kann nicht gelöscht werden.',
                  okText: 'Archivieren',
                  cancelText: 'Abbrechen',
                  onOk: () => onArchive(therapy.id),
                });
              }}
            /></Tooltip>
          ) : (
            onDelete && <Tooltip title="Löschen"><Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: `Therapie "${therapy.label || 'Einzeltherapie'}" löschen?`,
                  onOk: () => onDelete(therapy.id),
                });
              }}
            /></Tooltip>
          )}
          </Space>
        ) : undefined
      }
    >
      <div style={{ fontSize: styles.token.fontSizeSM }}>
        {scheduleLabel && (
          <Space size={4} style={{ display: 'flex', color: styles.token.colorTextSecondary }}>
            <SyncOutlined /> <span>{scheduleLabel}</span>
          </Space>
        )}
        <Space size={4} style={{ display: 'flex', color: styles.token.colorTextSecondary }}>
          <CalendarOutlined />
          <span>
            Ab {format(parseISO(therapy.startDate), 'd. MMM yyyy', { locale: de })}
            {therapy.endDate && ` bis ${format(parseISO(therapy.endDate), 'd. MMM yyyy', { locale: de })}`}
          </span>
        </Space>
        <Space size={4} style={{ display: 'flex', color: styles.token.colorTextSecondary }}>
          <EuroCircleOutlined /> <span>{(therapy.sessionCostCents / 100).toFixed(0)} € · {therapy.sessionDurationMinutes} Min.</span>
        </Space>
        {therapy.videoLink && (
          <a
            href={therapy.videoLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: styles.token.fontSizeSM }}
          >
            <Space size={4}>
              <VideoCameraOutlined /> <span>Video-Link</span>
            </Space>
          </a>
        )}
      </div>

      <div style={{ borderTop: `1px solid ${styles.token.colorBorderSecondary}`, paddingTop: 12, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SessionPanel
          therapy={therapy}
          sessions={sessions}
          onGenerate={(from, to) => onGenerateSessions(therapy.id, from, to)}
          onUpdateSession={onUpdateSession}
          onDeleteSession={(id) => onDeleteSession(id, therapy.id)}
          onSendInvoice={onSendInvoice}
        />

        <DocumentCollapse contextType="therapy" contextId={therapy.id} />
      </div>
    </Card>
  );
}

// ─── Therapy List ────────────────────────────────────────────────

export default function TherapyList({ therapies, archivedTherapies, sessionsByTherapy, fetchSessions,
  onEdit, onDelete, onArchive, onGenerateSessions, onUpdateSession, onDeleteSession, onSendInvoice,
  showNewForm, newForm }: {
  therapies: Therapy[];
  archivedTherapies: Therapy[];
  sessionsByTherapy: Record<number, TherapySession[]>;
  fetchSessions: (therapyId: number) => void;
  onEdit?: (therapy: Therapy) => void;
  onDelete: (id: number) => void;
  onArchive: (id: number) => void;
  onGenerateSessions: (therapyId: number, from: string, to: string) => void;
  onUpdateSession: (id: number, updates: Partial<TherapySession>) => void;
  onDeleteSession: (id: number, therapyId: number) => void;
  onSendInvoice: (id: number) => void;
  showNewForm: boolean;
  newForm: ReactNode;
}) {
  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div>
        <div style={{ marginBottom: 12 }}>
          <Typography.Title level={5} style={{ margin: 0 }}>Aktive Therapien ({therapies.length})</Typography.Title>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {showNewForm && newForm}
          {therapies.length === 0 ? (
            <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>
              Noch keine Therapien angelegt.
            </Typography.Text>
          ) : (
            therapies.map(t => (
              <TherapyCard
                key={t.id}
                therapy={t}
                sessions={sessionsByTherapy[t.id] || []}
                fetchSessions={fetchSessions}
                onEdit={onEdit}
                onDelete={onDelete}
                onArchive={onArchive}
                onGenerateSessions={onGenerateSessions}
                onUpdateSession={onUpdateSession}
                onDeleteSession={onDeleteSession}
                onSendInvoice={onSendInvoice}
              />
            ))
          )}
        </div>
      </div>

      {archivedTherapies.length > 0 && (
        <div>
          <Typography.Title level={5} style={{ marginBottom: 12 }}>Archivierte Therapien ({archivedTherapies.length})</Typography.Title>
          <Collapse
            items={archivedTherapies.map(t => ({
              key: String(t.id),
              label: (
                <Space>
                  <span>{t.label || 'Einzeltherapie'}</span>
                  <Typography.Text type="secondary" style={{ fontWeight: 'normal' }}>— {t.clientName}</Typography.Text>
                </Space>
              ),
              children: (
                <TherapyCard
                  therapy={t}
                  sessions={sessionsByTherapy[t.id] || []}
                  fetchSessions={fetchSessions}
                  onGenerateSessions={onGenerateSessions}
                  onUpdateSession={onUpdateSession}
                  onDeleteSession={onDeleteSession}
                  onSendInvoice={onSendInvoice}
                />
              ),
            }))}
          />
        </div>
      )}
    </Space>
  );
}
