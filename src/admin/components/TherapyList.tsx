import { useState } from 'react';
import type { Therapy, TherapySession } from '../../lib/data';
import { DAY_LABELS } from '../constants';
import { InlineCollapsible } from './CollapsibleSection';
import DocumentChecklist from './DocumentChecklist';
import { format, parseISO, addMonths } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  SyncOutlined, CalendarOutlined, EuroCircleOutlined,
  VideoCameraOutlined, DeleteOutlined, CheckCircleOutlined,
  FileTextOutlined, DownOutlined,
} from '@ant-design/icons';
import { Card, Button, Tag, Space, Typography, Modal, Select, Statistic, Row, Col, DatePicker } from 'antd';
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Row gutter={16}>
        <Col span={8}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic
              title="Offen"
              value={(amountDue / 100).toFixed(0)}
              suffix="€"
              valueStyle={{ color: '#1677ff' }}
            />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>{totalDue} Sitzungen</Typography.Text>
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic
              title="Bezahlt"
              value={(amountPaid / 100).toFixed(0)}
              suffix="€"
              valueStyle={{ color: '#52c41a' }}
            />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>{totalPaid} Sitzungen</Typography.Text>
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic
              title="Gesamt"
              value={((amountDue + amountPaid) / 100).toFixed(0)}
              suffix="€"
            />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>{sessions.length} Sitzungen</Typography.Text>
          </Card>
        </Col>
      </Row>

      <Card size="small" title="Sitzungen generieren">
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <div>
            <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Von</Typography.Text>
            <DatePicker
              value={dayjs(genFrom)}
              onChange={(d) => { if (d) setGenFrom(d.format('YYYY-MM-DD')); }}
              size="small"
            />
          </div>
          <div>
            <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Bis</Typography.Text>
            <DatePicker
              value={dayjs(genTo)}
              onChange={(d) => { if (d) setGenTo(d.format('YYYY-MM-DD')); }}
              size="small"
            />
          </div>
          <Button type="primary" onClick={() => onGenerate(genFrom, genTo)}>
            Generieren
          </Button>
        </div>
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
                <Space size={0}>
                  <Select
                    size="small"
                    value={s.status}
                    onChange={(value) => onUpdateSession(s.id, { status: value as TherapySession['status'] })}
                    style={{ width: 140 }}
                    options={[
                      { value: 'scheduled', label: 'Geplant' },
                      { value: 'completed', label: 'Abgeschlossen' },
                      { value: 'cancelled', label: 'Abgesagt' },
                      { value: 'no_show', label: 'Nicht erschienen' },
                    ]}
                  />
                  <Button
                    type="text"
                    size="small"
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
                    size="small"
                    icon={s.invoiceSent ? <CheckCircleOutlined /> : <FileTextOutlined />}
                    onClick={() => onSendInvoice(s.id)}
                    disabled={s.invoiceSent}
                    title={s.invoiceSent ? 'Rechnung gesendet' : 'Rechnung senden'}
                    style={{ color: s.invoiceSent ? '#52c41a' : undefined }}
                  />
                  <Button
                    type="text"
                    size="small"
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
    </div>
  );
}

// ─── Therapy List ────────────────────────────────────────────────

export default function TherapyList({ therapies, sessions, selectedTherapyId, onSelect, onDelete, onGenerateSessions,
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
      <Card>
        <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>
          Noch keine Therapien angelegt.
        </Typography.Text>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {therapies.map(t => {
        const isSelected = selectedTherapyId === t.id;
        const scheduleLabel = t.schedule
          .map(s => `${DAY_LABELS[s.dayOfWeek]} ${s.time}${s.frequency === 'biweekly' ? ' (2-wöch.)' : ''}`)
          .join(', ');

        return (
          <Card key={t.id} size="small" style={{ borderColor: isSelected ? '#2dd4bf' : undefined }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div
                onClick={() => onSelect(isSelected ? null : t.id)}
                style={{ textAlign: 'left', minWidth: 0, flex: 1, cursor: 'pointer' }}
              >
                <Space>
                  <DownOutlined
                    style={{
                      fontSize: 12,
                      color: '#999',
                      transition: 'transform 0.2s',
                      transform: isSelected ? 'rotate(180deg)' : undefined,
                    }}
                  />
                  <Typography.Text strong style={{ fontSize: 14 }}>{t.label || 'Einzeltherapie'}</Typography.Text>
                </Space>
                <div style={{ marginTop: 2 }}>
                  <Typography.Text type="secondary" style={{ fontSize: 13 }}>{t.clientName}</Typography.Text>
                </div>
                <div style={{ marginTop: 4, fontSize: 12 }}>
                  {scheduleLabel && (
                    <Space size={4} style={{ display: 'flex', color: '#888' }}>
                      <SyncOutlined /> <span>{scheduleLabel}</span>
                    </Space>
                  )}
                  <Space size={4} style={{ display: 'flex', color: '#888' }}>
                    <CalendarOutlined />
                    <span>
                      Ab {format(parseISO(t.startDate), 'd. MMM yyyy', { locale: de })}
                      {t.endDate && ` bis ${format(parseISO(t.endDate), 'd. MMM yyyy', { locale: de })}`}
                    </span>
                  </Space>
                  <Space size={4} style={{ display: 'flex', color: '#888' }}>
                    <EuroCircleOutlined /> <span>{(t.sessionCostCents / 100).toFixed(0)} € · {t.sessionDurationMinutes} Min.</span>
                  </Space>
                  {t.videoLink && (
                    <a
                      href={t.videoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{ fontSize: 12 }}
                    >
                      <Space size={4}>
                        <VideoCameraOutlined /> <span>Video-Link</span>
                      </Space>
                    </a>
                  )}
                </div>
              </div>
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => {
                  Modal.confirm({
                    title: `Therapie "${t.label || 'Einzeltherapie'}" löschen?`,
                    onOk: () => onDelete(t.id),
                  });
                }}
              />
            </div>
            {isSelected && (
              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <InlineCollapsible title="Dokumente">
                  <DocumentChecklist contextType="therapy" contextId={t.id} />
                </InlineCollapsible>

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
          </Card>
        );
      })}
    </div>
  );
}
