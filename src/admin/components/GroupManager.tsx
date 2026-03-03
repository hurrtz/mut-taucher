import { useState, useEffect } from 'react';
import type { TherapyGroup, Client, GroupSession } from '../../lib/data';
import { DAY_LABELS } from '../constants';
import { DocumentCollapse } from './DocumentChecklist';
import { groupHasInteraction } from '../utils';
import { format, parseISO, addMonths } from 'date-fns';
import { de } from 'date-fns/locale';
import dayjs from 'dayjs';
import {
  SyncOutlined, CalendarOutlined, EuroCircleOutlined, VideoCameraOutlined,
  DeleteOutlined, HomeOutlined, CloseOutlined, CheckCircleOutlined, FileTextOutlined,
  ContainerOutlined,
} from '@ant-design/icons';
import {
  Card, Button, Tag, Space, Typography, Modal, Select, Statistic,
  Row, Col, DatePicker, Progress, Collapse, InputNumber, Switch, Dropdown,
} from 'antd';
import type { ReactNode } from 'react';

const { Text } = Typography;

// ─── Participant Panel ───────────────────────────────────────────

function ParticipantPanel({ group, clients, sessions, onAdd, onRemove, onBulkPay, onSendBundleInvoice }: {
  group: TherapyGroup;
  clients: Client[];
  sessions: GroupSession[];
  onAdd: (clientId: number) => void;
  onRemove: (clientId: number) => void;
  onBulkPay?: (groupId: number, clientId: number, count?: number | null) => void;
  onSendBundleInvoice?: (groupId: number, clientId: number, paymentMode: 'full' | 'half_first' | 'half_second') => void;
}) {
  const [selectedClientId, setSelectedClientId] = useState(0);
  const [bulkPayClient, setBulkPayClient] = useState<{ id: number; name: string; unpaid: number } | null>(null);
  const [bulkPayCount, setBulkPayCount] = useState(1);
  const [payAll, setPayAll] = useState(false);

  const activeParticipants = group.participants?.filter(p => p.status === 'active') ?? [];
  const participantIds = new Set(activeParticipants.map(p => p.clientId));
  const availableClients = clients.filter(c => !participantIds.has(c.id));
  const isFull = activeParticipants.length >= group.maxParticipants;
  const pct = group.maxParticipants > 0
    ? Math.round((activeParticipants.length / group.maxParticipants) * 100)
    : 0;

  const unpaidByClient = new Map<number, number>();
  for (const s of sessions) {
    for (const p of s.payments) {
      if (p.paymentStatus === 'due') {
        unpaidByClient.set(p.clientId, (unpaidByClient.get(p.clientId) ?? 0) + 1);
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text strong style={{ fontSize: 14 }}>
          Teilnehmer ({activeParticipants.length} / {group.maxParticipants})
        </Text>
      </div>

      <Progress percent={pct} />

      {activeParticipants.length === 0 ? (
        <Text type="secondary" style={{ textAlign: 'center', padding: '8px 0' }}>Noch keine Teilnehmer.</Text>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {activeParticipants.map(p => {
            const unpaidCount = unpaidByClient.get(p.clientId) ?? 0;
            const invoiceStatus = p.invoiceStatus ?? 'none';
            const invoiceStatusLabels: Record<string, { label: string; color: string }> = {
              none: { label: 'Keine Rechnung', color: 'default' },
              full_sent: { label: 'Gesamtrechnung', color: 'green' },
              half1_sent: { label: '1. Teilzahlung', color: 'blue' },
              half2_sent: { label: 'Voll berechnet', color: 'green' },
            };
            const canSendFull = invoiceStatus === 'none';
            const canSendHalf1 = invoiceStatus === 'none';
            const canSendHalf2 = invoiceStatus === 'half1_sent';
            const invoiceDone = invoiceStatus === 'full_sent' || invoiceStatus === 'half2_sent';

            const invoiceMenuItems = [
              { key: 'full', label: 'Gesamtrechnung', disabled: !canSendFull },
              { key: 'half_first', label: '1. Teilzahlung (50%)', disabled: !canSendHalf1 },
              { key: 'half_second', label: '2. Teilzahlung (50%)', disabled: !canSendHalf2 },
            ];

            return (
              <Card size="small" key={p.clientId} styles={{ body: { padding: '8px 12px' } }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text strong>{p.clientName}</Text>
                    <Text type="secondary">{p.clientEmail}</Text>
                    {unpaidCount > 0 && (
                      <Tag color="gold">{unpaidCount} offen</Tag>
                    )}
                    {invoiceStatus !== 'none' && (
                      <Tag color={invoiceStatusLabels[invoiceStatus].color}>
                        {invoiceStatusLabels[invoiceStatus].label}
                      </Tag>
                    )}
                  </div>
                  <Space size={0}>
                    {onBulkPay && unpaidCount > 0 && (
                      <Button
                        type="text"
                        icon={<EuroCircleOutlined />}
                        title="Sammelzahlung"
                        onClick={() => {
                          setBulkPayClient({ id: p.clientId, name: p.clientName, unpaid: unpaidCount });
                          setBulkPayCount(unpaidCount);
                          setPayAll(true);
                        }}
                      />
                    )}
                    {onSendBundleInvoice && !invoiceDone && (
                      <Dropdown
                        menu={{
                          items: invoiceMenuItems,
                          onClick: ({ key }) => {
                            const mode = key as 'full' | 'half_first' | 'half_second';
                            Modal.confirm({
                              title: 'Rechnung senden?',
                              content: `${invoiceMenuItems.find(i => i.key === key)?.label} an ${p.clientName} senden?`,
                              okText: 'Senden',
                              cancelText: 'Abbrechen',
                              onOk: () => onSendBundleInvoice(group.id, p.clientId, mode),
                            });
                          },
                        }}
                      >
                        <Button
                          type="text"
                          icon={<FileTextOutlined />}
                          title="Rechnung senden"
                        />
                      </Dropdown>
                    )}
                    {invoiceDone && (
                      <Button
                        type="text"
                        icon={<CheckCircleOutlined />}
                        style={{ color: '#52c41a' }}
                        title="Rechnung gesendet"
                        disabled
                      />
                    )}
                    <Button
                      type="text"
                      icon={<CloseOutlined />}
                      danger
                      onClick={() => {
                        Modal.confirm({
                          title: `${p.clientName} wirklich entfernen?`,
                          okText: 'Entfernen',
                          cancelText: 'Abbrechen',
                          okType: 'danger',
                          onOk: () => onRemove(p.clientId),
                        });
                      }}
                    />
                  </Space>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {!isFull && availableClients.length > 0 && (
        <Space.Compact style={{ width: '100%' }}>
          <Select
            showSearch
            value={selectedClientId || undefined}
            onChange={(val) => setSelectedClientId(val)}
            placeholder="Patient:in auswählen..."
            style={{ flex: 1 }}
            optionFilterProp="label"
            options={availableClients.map(c => ({
              value: c.id,
              label: `${c.lastName}, ${c.firstName} (${c.email})`,
            }))}
          />
          <Button
            type="primary"
            onClick={() => { if (selectedClientId) { onAdd(selectedClientId); setSelectedClientId(0); } }}
            disabled={!selectedClientId}
          >
            Hinzufügen
          </Button>
        </Space.Compact>
      )}
      {isFull && (
        <Text type="warning">Maximale Teilnehmerzahl erreicht.</Text>
      )}

      <Modal
        title={`Sammelzahlung: ${bulkPayClient?.name ?? ''}`}
        open={!!bulkPayClient}
        onCancel={() => setBulkPayClient(null)}
        onOk={() => {
          if (bulkPayClient && onBulkPay) {
            onBulkPay(group.id, bulkPayClient.id, payAll ? null : bulkPayCount);
            setBulkPayClient(null);
          }
        }}
        okText="Bezahlen"
        cancelText="Abbrechen"
      >
        {bulkPayClient && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Text>{bulkPayClient.unpaid} offene Zahlungen vorhanden.</Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text>Anzahl:</Text>
              <InputNumber
                min={1}
                max={bulkPayClient.unpaid}
                value={payAll ? bulkPayClient.unpaid : bulkPayCount}
                onChange={(val) => { if (val) { setBulkPayCount(val); setPayAll(false); } }}
                disabled={payAll}
                style={{ width: 80 }}
              />
              <Switch
                checked={payAll}
                onChange={(checked) => { setPayAll(checked); if (checked) setBulkPayCount(bulkPayClient.unpaid); }}
                checkedChildren="Alle"
                unCheckedChildren="Alle"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── Group Session Panel ─────────────────────────────────────────

function GroupSessionPanel({ group, sessions, onGenerate, onUpdateSession, onDeleteSession, onUpdatePayment }: {
  group: TherapyGroup;
  sessions: GroupSession[];
  onGenerate: (from: string, to: string) => void;
  onUpdateSession: (id: number, updates: Partial<GroupSession>) => void;
  onDeleteSession: (id: number) => void;
  onUpdatePayment: (paymentId: number, updates: { paymentStatus?: string; paymentPaidDate?: string | null; attendanceStatus?: string | null }) => void;
}) {
  const [genFrom, setGenFrom] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [genTo, setGenTo] = useState(format(addMonths(new Date(), 3), 'yyyy-MM-dd'));
  const [expandedSessionId, setExpandedSessionId] = useState<number | null>(null);

  const statusLabels: Record<string, string> = {
    scheduled: 'Geplant',
    completed: 'Abgeschlossen',
    cancelled: 'Abgesagt',
  };

  const statusTagColors: Record<string, string> = {
    scheduled: 'blue',
    completed: 'green',
    cancelled: 'default',
  };

  const allPayments = sessions.flatMap(s => s.payments);
  const totalDue = allPayments.filter(p => p.paymentStatus === 'due').length;
  const totalPaid = allPayments.filter(p => p.paymentStatus === 'paid').length;
  const amountDue = totalDue * group.sessionCostCents;
  const amountPaid = totalPaid * group.sessionCostCents;

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
            <Text type="secondary" style={{ fontSize: 12 }}>{totalDue} Zahlungen</Text>
          </Col>
          <Col span={8} style={{ textAlign: 'center' }}>
            <Statistic
              title="Bezahlt"
              value={(amountPaid / 100).toFixed(0)}
              suffix="€"
              valueStyle={{ color: '#52c41a' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>{totalPaid} Zahlungen</Text>
          </Col>
          <Col span={8} style={{ textAlign: 'center' }}>
            <Statistic
              title="Gesamt"
              value={((amountDue + amountPaid) / 100).toFixed(0)}
              suffix="€"
            />
            <Text type="secondary" style={{ fontSize: 12 }}>{sessions.length} Sitzungen</Text>
          </Col>
        </Row>
      </Card>

      {sessions.length === 0 ? (
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: '16px 0' }}>Noch keine Sitzungen.</Text>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sessions.map(s => {
            const isExpanded = expandedSessionId === s.id;
            const paidCount = s.payments.filter(p => p.paymentStatus === 'paid').length;
            const totalCount = s.payments.length;

            return (
              <Card size="small" key={s.id}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div
                    onClick={() => setExpandedSessionId(isExpanded ? null : s.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, cursor: 'pointer' }}
                  >
                    <Text strong>
                      {format(parseISO(s.sessionDate), 'd. MMM yyyy', { locale: de })}
                    </Text>
                    <Text type="secondary">{s.sessionTime} Uhr</Text>
                    <Tag color={statusTagColors[s.status]}>{statusLabels[s.status]}</Tag>
                    {totalCount > 0 && (
                      <Text type="secondary" style={{ fontSize: 12 }}>{paidCount}/{totalCount} bezahlt</Text>
                    )}
                  </div>
                  <Space size={8}>
                    <Select
                      value={s.status}
                      onChange={(val) => onUpdateSession(s.id, { status: val as GroupSession['status'] })}
                      style={{ width: 160 }}
                      options={[
                        { value: 'scheduled', label: 'Geplant' },
                        { value: 'completed', label: 'Abgeschlossen' },
                        { value: 'cancelled', label: 'Abgesagt' },
                      ]}
                    />
                    <Button
                      type="text"
                      icon={<DeleteOutlined />}
                      danger
                      onClick={() => {
                        Modal.confirm({
                          title: 'Sitzung löschen?',
                          okText: 'Löschen',
                          cancelText: 'Abbrechen',
                          okType: 'danger',
                          onOk: () => onDeleteSession(s.id),
                        });
                      }}
                    />
                  </Space>
                </div>
                {isExpanded && (
                  <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 8, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {s.payments.length === 0 ? (
                      <Text type="secondary" style={{ fontSize: 12 }}>Keine Zahlungen (keine Teilnehmer).</Text>
                    ) : (
                      s.payments.map(p => (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa', borderRadius: 4, padding: '4px 8px' }}>
                          <Text strong style={{ fontSize: 12 }}>{p.clientName}</Text>
                          <Space size={4}>
                            <Tag color={p.paymentStatus === 'paid' ? 'green' : 'gold'} style={{ marginInlineEnd: 0 }}>
                              {p.paymentStatus === 'paid' ? 'Bezahlt' : 'Offen'}
                            </Tag>
                            <Button
                              type="text"
                              icon={<EuroCircleOutlined />}
                              style={{ color: p.paymentStatus === 'paid' ? '#52c41a' : undefined }}
                              title={p.paymentStatus === 'paid' ? 'Als offen markieren' : 'Als bezahlt markieren'}
                              onClick={() => onUpdatePayment(p.id, {
                                paymentStatus: p.paymentStatus === 'paid' ? 'due' : 'paid',
                                paymentPaidDate: p.paymentStatus === 'paid' ? null : format(new Date(), 'yyyy-MM-dd'),
                              })}
                            />
                            <Select
                              value={p.attendanceStatus ?? undefined}
                              onChange={(val) => onUpdatePayment(p.id, { attendanceStatus: val ?? null })}
                              allowClear
                              placeholder="Anwesenheit"
                              style={{ width: 160 }}
                              size="small"
                              options={[
                                { value: 'attended', label: 'Erschienen' },
                                { value: 'no_show', label: 'Nicht erschienen' },
                                { value: 'cancelled', label: 'Abgesagt' },
                              ]}
                            />
                          </Space>
                        </div>
                      ))
                    )}
                  </div>
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
                <Text type="secondary" style={{ width: 28, display: 'inline-block' }}>Von</Text>
                <DatePicker
                  value={dayjs(genFrom)}
                  onChange={(d) => { if (d) setGenFrom(d.format('YYYY-MM-DD')); }}
                />
              </Space>
              <Space>
                <Text type="secondary" style={{ width: 28, display: 'inline-block' }}>Bis</Text>
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

// ─── Group Card ─────────────────────────────────────────────────

function GroupCard({ group, clients, sessions, fetchSessions, onDelete, onArchive,
  onToggleHomepage, onAddParticipant, onRemoveParticipant,
  onGenerateSessions, onUpdateSession, onDeleteSession,
  onUpdatePayment, onBulkPay, onSendBundleInvoice }: {
  group: TherapyGroup;
  clients: Client[];
  sessions: GroupSession[];
  fetchSessions: (groupId: number) => void;
  onDelete?: (id: number) => void;
  onArchive?: (id: number) => void;
  onToggleHomepage?: (id: number, current: boolean) => void;
  onAddParticipant: (groupId: number, clientId: number) => void;
  onRemoveParticipant: (groupId: number, clientId: number) => void;
  onGenerateSessions: (groupId: number, from: string, to: string) => void;
  onUpdateSession: (id: number, updates: Partial<GroupSession>) => void;
  onDeleteSession: (id: number, groupId: number) => void;
  onUpdatePayment: (paymentId: number, updates: { paymentStatus?: string; paymentPaidDate?: string | null; attendanceStatus?: string | null }, groupId: number) => void;
  onBulkPay?: (groupId: number, clientId: number, count?: number | null) => void;
  onSendBundleInvoice?: (groupId: number, clientId: number, paymentMode: 'full' | 'half_first' | 'half_second') => void;
}) {
  useEffect(() => { fetchSessions(group.id); }, [group.id, fetchSessions]);

  const pct = group.maxParticipants > 0
    ? Math.round((group.participantCount / group.maxParticipants) * 100)
    : 0;
  const spotsLeft = group.maxParticipants - group.participantCount;
  const scheduleLabel = group.schedule
    ?.map(s => `${DAY_LABELS[s.dayOfWeek]} ${s.time}${s.frequency === 'biweekly' ? ' (2-wöch.)' : ''}`)
    .join(', ');

  const hasInteraction = groupHasInteraction(sessions);

  return (
    <Card
      size="default"
      title={
        <Space>
          <span>{group.label || 'Ohne Bezeichnung'}</span>
          {group.showOnHomepage && <Tag color="magenta">Homepage</Tag>}
        </Space>
      }
      extra={
        (onDelete || onArchive || onToggleHomepage) ? (
          <Space size={0}>
            {onToggleHomepage && (
              <Button
                type="text"
                icon={<HomeOutlined />}
                onClick={() => onToggleHomepage(group.id, group.showOnHomepage)}
                title={group.showOnHomepage ? 'Von Homepage entfernen' : 'Auf Homepage anzeigen'}
                style={{ color: group.showOnHomepage ? '#f43f5e' : undefined }}
              />
            )}
            {hasInteraction ? (
              onArchive && <Button
                type="text"
                icon={<ContainerOutlined />}
                onClick={() => {
                  Modal.confirm({
                    title: `Gruppe "${group.label || 'Ohne Bezeichnung'}" archivieren?`,
                    content: 'Die Gruppe hat Sitzungen mit Interaktionen und kann nicht gelöscht werden.',
                    okText: 'Archivieren',
                    cancelText: 'Abbrechen',
                    onOk: () => onArchive(group.id),
                  });
                }}
                title="Archivieren"
              />
            ) : (
              onDelete && <Button
                type="text"
                icon={<DeleteOutlined />}
                danger
                onClick={() => {
                  Modal.confirm({
                    title: `Gruppe "${group.label || 'Ohne Bezeichnung'}" wirklich löschen?`,
                    okText: 'Löschen',
                    cancelText: 'Abbrechen',
                    okType: 'danger',
                    onOk: () => onDelete(group.id),
                  });
                }}
                title="Löschen"
              />
            )}
          </Space>
        ) : undefined
      }
    >
      <div style={{ fontSize: 12 }}>
        {scheduleLabel && (
          <Space size={4} style={{ display: 'flex', color: '#888' }}>
            <SyncOutlined /> <span>{scheduleLabel}</span>
          </Space>
        )}
        {group.startDate && (
          <Space size={4} style={{ display: 'flex', color: '#888' }}>
            <CalendarOutlined />
            <span>
              Ab {format(parseISO(group.startDate), 'd. MMM yyyy', { locale: de })}
              {group.endDate && ` bis ${format(parseISO(group.endDate), 'd. MMM yyyy', { locale: de })}`}
            </span>
          </Space>
        )}
        <Space size={4} style={{ display: 'flex', color: '#888' }}>
          <EuroCircleOutlined /> <span>{(group.sessionCostCents / 100).toFixed(0)} € · {group.sessionDurationMinutes} Min.</span>
        </Space>
        {group.videoLink && (
          <a href={group.videoLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12 }}>
            <Space size={4}>
              <VideoCameraOutlined /> <span>Video-Link</span>
            </Space>
          </a>
        )}
      </div>

      <div style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={{ fontSize: 13 }}>{group.participantCount} / {group.maxParticipants} Teilnehmer</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{spotsLeft > 0 ? `${spotsLeft} frei` : 'Voll'}</Text>
        </div>
        <Progress
          percent={Math.min(pct, 100)}
          showInfo={false}
          strokeColor={pct >= 100 ? '#f87171' : pct >= 70 ? '#fbbf24' : '#2dd4bf'}
          size="small"
        />
      </div>

      <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Collapse
          defaultActiveKey={[]}
          items={[{
            key: 'participants',
            label: `Teilnehmer (${group.participantCount})`,
            children: (
              <ParticipantPanel
                group={group}
                clients={clients}
                sessions={sessions}
                onAdd={(clientId) => onAddParticipant(group.id, clientId)}
                onRemove={(clientId) => onRemoveParticipant(group.id, clientId)}
                onBulkPay={onBulkPay}
                onSendBundleInvoice={onSendBundleInvoice}
              />
            ),
          }]}
        />

        <GroupSessionPanel
          group={group}
          sessions={sessions}
          onGenerate={(from, to) => onGenerateSessions(group.id, from, to)}
          onUpdateSession={onUpdateSession}
          onDeleteSession={(id) => onDeleteSession(id, group.id)}
          onUpdatePayment={(pid, updates) => onUpdatePayment(pid, updates, group.id)}
        />

        <DocumentCollapse contextType="group" contextId={group.id} />
      </div>
    </Card>
  );
}

// ─── Group Manager ───────────────────────────────────────────────

export default function GroupManager({ groups, archivedGroups, clients, groupSessionsByGroup, fetchGroupSessions,
  onDelete, onArchive, onToggleHomepage, onAddParticipant, onRemoveParticipant,
  onGenerateSessions, onUpdateSession, onDeleteSession,
  onUpdatePayment, onBulkPay, onSendBundleInvoice,
  showNewForm, newForm }: {
  groups: TherapyGroup[];
  archivedGroups: TherapyGroup[];
  clients: Client[];
  groupSessionsByGroup: Record<number, GroupSession[]>;
  fetchGroupSessions: (groupId: number) => void;
  onDelete: (id: number) => void;
  onArchive: (id: number) => void;
  onToggleHomepage: (id: number, current: boolean) => void;
  onAddParticipant: (groupId: number, clientId: number) => void;
  onRemoveParticipant: (groupId: number, clientId: number) => void;
  onGenerateSessions: (groupId: number, from: string, to: string) => void;
  onUpdateSession: (id: number, updates: Partial<GroupSession>) => void;
  onDeleteSession: (id: number, groupId: number) => void;
  onUpdatePayment: (paymentId: number, updates: { paymentStatus?: string; paymentPaidDate?: string | null; attendanceStatus?: string | null }, groupId: number) => void;
  onBulkPay?: (groupId: number, clientId: number, count?: number | null) => void;
  onSendBundleInvoice?: (groupId: number, clientId: number, paymentMode: 'full' | 'half_first' | 'half_second') => void;
  showNewForm: boolean;
  newForm: ReactNode;
}) {
  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div>
        <div style={{ marginBottom: 12 }}>
          <Text strong style={{ fontSize: 16 }}>Aktive Gruppen ({groups.length})</Text>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {showNewForm && newForm}
          {groups.length === 0 ? (
            <Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>
              Noch keine Gruppen angelegt.
            </Text>
          ) : (
            groups.map(group => (
              <GroupCard
                key={group.id}
                group={group}
                clients={clients}
                sessions={groupSessionsByGroup[group.id] ?? []}
                fetchSessions={fetchGroupSessions}
                onDelete={onDelete}
                onArchive={onArchive}
                onToggleHomepage={onToggleHomepage}
                onAddParticipant={onAddParticipant}
                onRemoveParticipant={onRemoveParticipant}
                onGenerateSessions={onGenerateSessions}
                onUpdateSession={onUpdateSession}
                onDeleteSession={onDeleteSession}
                onUpdatePayment={onUpdatePayment}
                onBulkPay={onBulkPay}

                onSendBundleInvoice={onSendBundleInvoice}
              />
            ))
          )}
        </div>
      </div>

      {archivedGroups.length > 0 && (
        <div>
          <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 12 }}>Archivierte Gruppen ({archivedGroups.length})</Text>
          <Collapse
            items={archivedGroups.map(group => ({
              key: String(group.id),
              label: (
                <Space>
                  <span>{group.label || 'Ohne Bezeichnung'}</span>
                </Space>
              ),
              children: (
                <GroupCard
                  group={group}
                  clients={clients}
                  sessions={groupSessionsByGroup[group.id] ?? []}
                  fetchSessions={fetchGroupSessions}
                  onAddParticipant={onAddParticipant}
                  onRemoveParticipant={onRemoveParticipant}
                  onGenerateSessions={onGenerateSessions}
                  onUpdateSession={onUpdateSession}
                  onDeleteSession={onDeleteSession}
                  onUpdatePayment={onUpdatePayment}
                  onBulkPay={onBulkPay}
  
                  onSendBundleInvoice={onSendBundleInvoice}
                />
              ),
            }))}
          />
        </div>
      )}
    </Space>
  );
}
