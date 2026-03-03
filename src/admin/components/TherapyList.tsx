import { useState, useEffect } from 'react';
import type { Therapy, TherapySession } from '../../lib/data';
import { DAY_LABELS } from '../constants';
import { DocumentCollapse } from './DocumentChecklist';
import { therapyHasInteraction } from '../utils';
import { format, parseISO, addMonths } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  SyncOutlined, CalendarOutlined, EuroCircleOutlined,
  VideoCameraOutlined, DeleteOutlined, CheckCircleOutlined,
  FileTextOutlined, ContainerOutlined,
} from '@ant-design/icons';
import { Card, Button, Tag, Space, Typography, Modal, Select, Statistic, Row, Col, DatePicker, Collapse } from 'antd';
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

  const statusLabels: Record<string, string> = {
    scheduled: 'Geplant',
    completed: 'Abgeschlossen',
    cancelled: 'Abgesagt',
    no_show: 'Nicht erschienen',
  };

  const statusTagColors: Record<string, string> = {
    scheduled: 'blue',
    completed: 'green',
    cancelled: 'default',
    no_show: 'red',
  };

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
              valueStyle={{ color: '#1677ff' }}
            />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>{totalDue} Sitzungen</Typography.Text>
          </Col>
          <Col span={8} style={{ textAlign: 'center' }}>
            <Statistic
              title="Bezahlt"
              value={(amountPaid / 100).toFixed(0)}
              suffix="€"
              valueStyle={{ color: '#52c41a' }}
            />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>{totalPaid} Sitzungen</Typography.Text>
          </Col>
          <Col span={8} style={{ textAlign: 'center' }}>
            <Statistic
              title="Gesamt"
              value={((amountDue + amountPaid) / 100).toFixed(0)}
              suffix="€"
            />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>{sessions.length} Sitzungen</Typography.Text>
          </Col>
        </Row>
      </Card>

      {sessions.length === 0 ? (
        <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: '16px 0' }}>
          Noch keine Sitzungen.
        </Typography.Text>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sessions.map(s => (
            <Card key={s.id} size="small">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <Space>
                  <Typography.Text strong>
                    {format(parseISO(s.sessionDate), 'd. MMM yyyy', { locale: de })}
                  </Typography.Text>
                  <Typography.Text type="secondary">{s.sessionTime} Uhr</Typography.Text>
                  <Tag color={statusTagColors[s.status]}>{statusLabels[s.status]}</Tag>
                  <Tag color={s.paymentStatus === 'paid' ? 'green' : 'gold'}>
                    {s.paymentStatus === 'paid' ? 'Bezahlt' : 'Offen'}
                  </Tag>
                </Space>
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
                  <Button
                    type="text"
                    icon={<EuroCircleOutlined />}
                    onClick={() => onUpdateSession(s.id, {
                      paymentStatus: s.paymentStatus === 'paid' ? 'due' : 'paid',
                      paymentPaidDate: s.paymentStatus === 'paid' ? null : format(new Date(), 'yyyy-MM-dd'),
                    })}
                    title={s.paymentStatus === 'paid' ? 'Als offen markieren' : 'Als bezahlt markieren'}
                    style={{ color: s.paymentStatus === 'paid' ? '#52c41a' : undefined }}
                  />
                  <Button
                    type="text"
                    icon={s.invoiceSent ? <CheckCircleOutlined /> : <FileTextOutlined />}
                    onClick={() => onSendInvoice(s.id)}
                    disabled={s.invoiceSent}
                    title={s.invoiceSent ? 'Rechnung gesendet' : 'Rechnung senden'}
                    style={{ color: s.invoiceSent ? '#52c41a' : undefined }}
                  />
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
                </Space>
                </Space>
              </div>
              {s.notes && (
                <Typography.Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                  {s.notes}
                </Typography.Text>
              )}
            </Card>
          ))}
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

function TherapyCard({ therapy, sessions, fetchSessions, onDelete, onArchive, onGenerateSessions,
  onUpdateSession, onDeleteSession, onSendInvoice }: {
  therapy: Therapy;
  sessions: TherapySession[];
  fetchSessions: (therapyId: number) => void;
  onDelete?: (id: number) => void;
  onArchive?: (id: number) => void;
  onGenerateSessions: (therapyId: number, from: string, to: string) => void;
  onUpdateSession: (id: number, updates: Partial<TherapySession>) => void;
  onDeleteSession: (id: number, therapyId: number) => void;
  onSendInvoice: (id: number) => void;
}) {
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
        (onDelete || onArchive) ? (
          hasInteraction ? (
            onArchive && <Button
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
              title="Archivieren"
            />
          ) : (
            onDelete && <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: `Therapie "${therapy.label || 'Einzeltherapie'}" löschen?`,
                  onOk: () => onDelete(therapy.id),
                });
              }}
            />
          )
        ) : undefined
      }
    >
      <div style={{ fontSize: 12 }}>
        {scheduleLabel && (
          <Space size={4} style={{ display: 'flex', color: '#888' }}>
            <SyncOutlined /> <span>{scheduleLabel}</span>
          </Space>
        )}
        <Space size={4} style={{ display: 'flex', color: '#888' }}>
          <CalendarOutlined />
          <span>
            Ab {format(parseISO(therapy.startDate), 'd. MMM yyyy', { locale: de })}
            {therapy.endDate && ` bis ${format(parseISO(therapy.endDate), 'd. MMM yyyy', { locale: de })}`}
          </span>
        </Space>
        <Space size={4} style={{ display: 'flex', color: '#888' }}>
          <EuroCircleOutlined /> <span>{(therapy.sessionCostCents / 100).toFixed(0)} € · {therapy.sessionDurationMinutes} Min.</span>
        </Space>
        {therapy.videoLink && (
          <a
            href={therapy.videoLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12 }}
          >
            <Space size={4}>
              <VideoCameraOutlined /> <span>Video-Link</span>
            </Space>
          </a>
        )}
      </div>

      <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
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
  onDelete, onArchive, onGenerateSessions, onUpdateSession, onDeleteSession, onSendInvoice,
  showNewForm, newForm }: {
  therapies: Therapy[];
  archivedTherapies: Therapy[];
  sessionsByTherapy: Record<number, TherapySession[]>;
  fetchSessions: (therapyId: number) => void;
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
