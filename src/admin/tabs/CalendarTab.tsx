import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAdminBooking } from '../../lib/useAdminBooking';
import { useAdminStyles } from '../styles';
import RuleForm from '../components/RuleForm';
import RuleCard from '../components/RuleCard';
import EventForm, { EventList } from '../components/EventForm';
import CalendarPreview from '../components/CalendarPreview';
import CancellationModal from '../components/CancellationModal';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Tabs, Space, Typography, Modal, Button, Badge, Spin, Alert } from 'antd';
import { ScheduleOutlined, SendOutlined } from '@ant-design/icons';

export default function CalendarTab() {
  const styles = useAdminStyles();
  const {
    rules, events, calendarSessions, blockedDays,
    pendingCancellations, loading, error,
    fetchRules, addRule, updateRule, removeRule,
    toggleException, fetchEvents, addEvent, removeEvent,
    fetchCalendarSessions, fetchBlockedDays, blockDay, unblockDay, cancelCalendarSession,
    sendCancellationEmails, clearPendingCancellations,
  } = useAdminBooking();

  const [searchParams, setSearchParams] = useSearchParams();
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);

  const calendarSubTab = (['kalender', 'regeln'].includes(searchParams.get('tab') ?? '') ? searchParams.get('tab') as string : 'kalender') as 'kalender' | 'regeln';

  useEffect(() => {
    fetchRules();
    fetchEvents();
    fetchBlockedDays();
  }, [fetchRules, fetchEvents, fetchBlockedDays]);

  const editingRule = editingRuleId ? rules.find(r => r.id === editingRuleId) : undefined;

  return (
    <div style={styles.pageContent}>
      <div style={styles.headerRow}>
        <Typography.Title style={{ margin: 0 }}>Kalender</Typography.Title>
        <Space>
          <Button type="primary" icon={<ScheduleOutlined />} onClick={() => setShowRuleModal(true)}>neuer Regeltermin</Button>
          <Button type="primary" icon={<ScheduleOutlined />} onClick={() => setShowEventModal(true)}>neuer Einzeltermin</Button>
        </Space>
      </div>

      {error && <Alert message={error} type="error" showIcon closable style={{ marginBottom: styles.token.marginMD }} />}
      {loading && rules.length === 0 && (
        <div style={{ ...styles.centered, padding: '64px 0' }}><Spin size="large" /></div>
      )}

      <Tabs
        activeKey={calendarSubTab}
        onChange={(key) => setSearchParams({ tab: key }, { replace: true })}
        items={[
          {
            key: 'kalender',
            label: 'Kalender',
            children: (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <CalendarPreview
                  rules={rules}
                  events={events}
                  onToggleException={toggleException}
                  calendarSessions={calendarSessions}
                  blockedDays={blockedDays}
                  onBlockDay={async (date) => { await blockDay(date); await fetchCalendarSessions(format(startOfMonth(new Date()), 'yyyy-MM-dd'), format(endOfMonth(new Date()), 'yyyy-MM-dd')); }}
                  onUnblockDay={async (date) => { await unblockDay(date); }}
                  onCancelSession={async (type, sessionId) => { await cancelCalendarSession(type, sessionId); }}
                  onMonthChange={(from, to) => fetchCalendarSessions(from, to)}
                />
                {pendingCancellations.length > 0 && (
                  <Badge count={pendingCancellations.length}>
                    <Button
                      icon={<SendOutlined />}
                      onClick={() => setShowCancellationModal(true)}
                    >
                      Absagen verwalten
                    </Button>
                  </Badge>
                )}
                <CancellationModal
                  items={pendingCancellations}
                  open={showCancellationModal}
                  onClose={() => { setShowCancellationModal(false); clearPendingCancellations(); }}
                  onSendEmails={sendCancellationEmails}
                />
              </Space>
            ),
          },
          {
            key: 'regeln',
            label: `Aktive Regeln (${rules.length})`,
            children: rules.length === 0 && !loading ? (
              <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: '32px 0' }}>
                Noch keine Regeln angelegt.
              </Typography.Text>
            ) : (
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
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
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={editingRule ? 'Regel bearbeiten' : 'Regeltermin anlegen'}
        open={showRuleModal || !!editingRuleId}
        onCancel={() => { setShowRuleModal(false); setEditingRuleId(null); }}
        footer={null}
        destroyOnClose
      >
        <RuleForm
          key={editingRuleId ?? 'new'}
          initial={editingRule}
          onSave={data => {
            if (editingRule) {
              updateRule(editingRuleId!, { ...data, exceptions: editingRule.exceptions });
            } else {
              addRule(data);
            }
            setShowRuleModal(false);
            setEditingRuleId(null);
          }}
          onCancel={() => { setShowRuleModal(false); setEditingRuleId(null); }}
        />
      </Modal>

      <Modal
        title="Einzeltermin anlegen"
        open={showEventModal}
        onCancel={() => setShowEventModal(false)}
        footer={null}
        destroyOnClose
      >
        <EventForm onSave={(data) => { addEvent(data); setShowEventModal(false); }} />
        <EventList events={events} onDelete={removeEvent} />
      </Modal>
    </div>
  );
}
