import { useState, useEffect, useLayoutEffect, useCallback, type FormEvent } from 'react';
import AdminLayout from './AdminLayout';
import { useAdminBooking } from '../lib/useAdminBooking';
import { useAdminClients } from '../lib/useAdminClients';
import { useAdminTherapies } from '../lib/useAdminTherapies';
import { useAdminGroups } from '../lib/useAdminGroups';
import { useAdminTemplates } from '../lib/useAdminTemplates';
import TemplateEditor from '../components/TemplateEditor';
import { CollapsibleSection } from './components/CollapsibleSection';
import RuleForm from './components/RuleForm';
import RuleCard from './components/RuleCard';
import EventForm, { EventList } from './components/EventForm';
import CalendarPreview from './components/CalendarPreview';
import CancellationModal from './components/CancellationModal';
import BookingList from './components/BookingList';
import ClientForm from './components/ClientForm';
import ClientList from './components/ClientList';
import TherapyForm from './components/TherapyForm';
import TherapyList from './components/TherapyList';
import GroupForm from './components/GroupForm';
import GroupManager from './components/GroupManager';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Link } from 'react-router-dom';
import { Tabs, Card, Input, Button, Alert, Spin, Space, Typography, Row, Col, Badge } from 'antd';
import {
  CalendarOutlined, TeamOutlined, UserOutlined, FileTextOutlined,
  VideoCameraOutlined, SyncOutlined, LogoutOutlined,
  HomeOutlined, BarChartOutlined, LinkOutlined,
  PlusOutlined, EditOutlined, ScheduleOutlined, UserAddOutlined,
  SendOutlined,
} from '@ant-design/icons';

const { Title } = Typography;

type TabKey = 'rules' | 'erstgespraeche' | 'einzel' | 'kunden' | 'groups' | 'dokumente';

export default function AdminPage() {
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
    authenticated, rules, events, bookings, calendarSessions, blockedDays,
    pendingCancellations, loading, error,
    login, logout, fetchRules, addRule, updateRule, removeRule,
    toggleException, fetchEvents, addEvent, removeEvent,
    fetchBookings, updateBooking, sendEmail,
    fetchCalendarSessions, fetchBlockedDays, blockDay, unblockDay, cancelCalendarSession,
    sendCancellationEmails, clearPendingCancellations,
  } = useAdminBooking();

  const {
    clients, error: clientsError,
    fetchClients, addClient, updateClient, removeClient, migrateBookingToClient,
  } = useAdminClients();

  const {
    therapies, archivedTherapies, sessionsByTherapy, error: therapiesError,
    fetchTherapies, fetchArchivedTherapies, addTherapy, updateTherapy, removeTherapy,
    fetchSessions, generateSessions, updateSession, removeSession, sendInvoice,
  } = useAdminTherapies();

  const {
    groups, archivedGroups, groupSessionsByGroup, error: groupsError,
    fetchGroups, fetchArchivedGroups, addGroup, updateGroup, removeGroup,
    addParticipant, removeParticipant,
    fetchGroupSessions, generateGroupSessions,
    updateGroupSession, removeGroupSession,
    updatePayment, bulkPayGroupPayments, sendGroupInvoice,
  } = useAdminGroups();

  const {
    templates, activeTemplate, saving: templateSaving, previewing: templatePreviewing,
    error: templatesError,
    fetchTemplates, fetchTemplate, updateTemplate, previewTemplate, uploadImage,
  } = useAdminTemplates();

  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('rules');
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [editingClientId, setEditingClientId] = useState<number | null>(null);
  const [showNewClient, setShowNewClient] = useState(false);
  const [showNewTherapy, setShowNewTherapy] = useState(false);
  const [newTherapyClientId, setNewTherapyClientId] = useState<number | undefined>();
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  // Load data on auth
  useEffect(() => {
    if (authenticated) {
      fetchRules();
      fetchEvents();
      fetchBookings();
      fetchGroups();
      fetchArchivedGroups();
      fetchClients();
      fetchTherapies();
      fetchArchivedTherapies();
      fetchTemplates();
      fetchBlockedDays();
    }
  }, [authenticated, fetchRules, fetchEvents, fetchBookings, fetchGroups, fetchArchivedGroups, fetchClients, fetchTherapies, fetchArchivedTherapies, fetchTemplates, fetchBlockedDays]);

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

  // Cross-tab navigation: migrate booking → create client → switch to Patienten
  const handleMigrateToClient = useCallback(async (bookingId: number) => {
    const clientId = await migrateBookingToClient(bookingId);
    if (clientId) {
      setActiveTab('kunden');
    }
  }, [migrateBookingToClient]);

  // Cross-tab navigation: new therapy from Patienten → switch to Einzel
  const handleNewTherapyFromClient = useCallback((clientId: number) => {
    setNewTherapyClientId(clientId);
    setShowNewTherapy(true);
    setActiveTab('einzel');
  }, []);

  const combinedError = error || clientsError || therapiesError || groupsError || templatesError;

  if (!authenticated) {
    return (
      <AdminLayout>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
        <Card style={{ width: 380 }}>
          <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>Admin Login</Title>
          <form onSubmit={handleLogin}>
            <Input.Password
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passwort"
              size="large"
              style={{ marginBottom: 16 }}
            />
            {loginError && (
              <Alert message={loginError} type="error" showIcon style={{ marginBottom: 16 }} />
            )}
            <Button
              type="primary"
              htmlType="submit"
              loading={loginLoading}
              block
              size="large"
            >
              Login
            </Button>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Link to="/" style={{ color: '#8c8c8c', fontSize: 14 }}>Zurück zur Website</Link>
            </div>
          </form>
        </Card>
      </div>
      </AdminLayout>
    );
  }

  const editingRule = editingRuleId ? rules.find(r => r.id === editingRuleId) : undefined;
  const editingClient = editingClientId ? clients.find(c => c.id === editingClientId) : undefined;

  const tabItems = [
    {
      key: 'rules',
      label: <span><CalendarOutlined /> Kalender</span>,
    },
    {
      key: 'erstgespraeche',
      label: <span><CalendarOutlined /> Erstgespräche ({bookings.filter(b => b.status === 'confirmed').length})</span>,
    },
    {
      key: 'einzel',
      label: <span><VideoCameraOutlined /> Einzeltherapie ({therapies.length})</span>,
    },
    {
      key: 'groups',
      label: <span><TeamOutlined /> Gruppentherapie ({groups.length})</span>,
    },
    {
      key: 'kunden',
      label: <span><UserOutlined /> Patienten ({clients.length})</span>,
    },
    {
      key: 'dokumente',
      label: <span><FileTextOutlined /> Vorlagen ({templates.length})</span>,
    },
  ];

  return (
    <AdminLayout>
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '16px 16px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Space size="middle" align="center">
            <Title level={3} style={{ margin: 0 }}>Administration</Title>
            <Space size="small">
              <Link to="/">
                <Button type="text" icon={<HomeOutlined />}>Website</Button>
              </Link>
              <a href="https://app.eu.amplitude.com/analytics/mut-taucher-395196/home" target="_blank" rel="noopener noreferrer">
                <Button type="text" icon={<BarChartOutlined />}>Analytics <LinkOutlined style={{ fontSize: 10 }} /></Button>
              </a>
            </Space>
          </Space>
          <Button type="text" danger icon={<LogoutOutlined />} onClick={logout}>
            Logout
          </Button>
        </div>

        {combinedError && (
          <Alert message={combinedError} type="error" showIcon closable style={{ marginBottom: 16 }} />
        )}

        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as TabKey)}
          items={tabItems}
          style={{ marginBottom: 16 }}
        />

        {loading && rules.length === 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
            <Spin size="large" />
          </div>
        )}

        {activeTab === 'rules' && (
          <Row gutter={24}>
            {/* Left: Create / Edit Rule + Events */}
            <Col xs={24} lg={8}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {editingRule ? (
                  <Card size="small">
                    <Space style={{ marginBottom: 16 }}>
                      <EditOutlined style={{ fontSize: 20, color: '#2dd4bf' }} />
                      <Typography.Text strong style={{ fontSize: 16 }}>Regel bearbeiten</Typography.Text>
                    </Space>
                    <RuleForm
                      key={editingRuleId}
                      initial={editingRule}
                      onSave={data => {
                        updateRule(editingRuleId!, { ...data, exceptions: editingRule.exceptions });
                        setEditingRuleId(null);
                      }}
                      onCancel={() => setEditingRuleId(null)}
                    />
                  </Card>
                ) : (
                  <CollapsibleSection
                    title="Regeltermine anlegen"
                    icon={<ScheduleOutlined style={{ fontSize: 20, color: '#2dd4bf' }} />}
                  >
                    <RuleForm onSave={addRule} />
                  </CollapsibleSection>
                )}

                <CollapsibleSection
                  title="Einzeltermin anlegen"
                  icon={<ScheduleOutlined style={{ fontSize: 20, color: '#2dd4bf' }} />}
                >
                  <EventForm onSave={addEvent} />
                  <EventList events={events} onDelete={removeEvent} />
                </CollapsibleSection>

                {/* Active Rules */}
                <Card
                  size="default"
                  title={<span><SyncOutlined style={{ color: '#9ca3af', marginRight: 8 }} />Aktive Regeln ({rules.length})</span>}
                >
                  {rules.length === 0 && !loading ? (
                    <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>
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
                  )}
                </Card>
              </Space>
            </Col>

            {/* Right: Calendar Preview */}
            <Col xs={24} lg={16}>
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
            </Col>
          </Row>
        )}

        {activeTab === 'erstgespraeche' && (
          <div style={{ maxWidth: 768 }}>
            <BookingList
              bookings={bookings}
              onUpdate={updateBooking}
              onSendEmail={sendEmail}
              onMigrateToClient={handleMigrateToClient}
            />
          </div>
        )}

        {activeTab === 'einzel' && (
          <div style={{ maxWidth: 896 }}>
            <TherapyList
              therapies={therapies}
              archivedTherapies={archivedTherapies}
              sessionsByTherapy={sessionsByTherapy}
              fetchSessions={fetchSessions}
              onDelete={removeTherapy}
              onArchive={async (id) => { await updateTherapy(id, { status: 'archived' }); await fetchArchivedTherapies(); }}
              onGenerateSessions={async (tid, from, to) => { await generateSessions(tid, from, to); }}
              onUpdateSession={(id, updates) => updateSession(id, updates)}
              onDeleteSession={(id, tid) => removeSession(id, tid)}
              onSendInvoice={sendInvoice}
              showNewForm={showNewTherapy}
              onToggleNewForm={() => setShowNewTherapy(!showNewTherapy)}
              newForm={
                <Card size="small">
                  <Space style={{ marginBottom: 16 }}>
                    <PlusOutlined style={{ fontSize: 20, color: '#2dd4bf' }} />
                    <Typography.Text strong style={{ fontSize: 16 }}>Neue Therapie</Typography.Text>
                  </Space>
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
                </Card>
              }
            />
          </div>
        )}

        {activeTab === 'kunden' && (
          <div style={{ maxWidth: 768 }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {showNewClient || editingClient ? (
                <Card size="small">
                  <Space style={{ marginBottom: 16 }}>
                    {editingClient ? (
                      <><EditOutlined style={{ fontSize: 20, color: '#2dd4bf' }} /> <Typography.Text strong style={{ fontSize: 16 }}>Patient:in bearbeiten</Typography.Text></>
                    ) : (
                      <><UserAddOutlined style={{ fontSize: 20, color: '#2dd4bf' }} /> <Typography.Text strong style={{ fontSize: 16 }}>Neue:r Patient:in</Typography.Text></>
                    )}
                  </Space>
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
                </Card>
              ) : (
                <Button type="primary" icon={<UserAddOutlined />} onClick={() => setShowNewClient(true)}>
                  Neue:r Patient:in
                </Button>
              )}

              <div>
                <ClientList
                  clients={clients}
                  onEdit={(id) => { setEditingClientId(id); setShowNewClient(false); }}
                  onDelete={removeClient}
                  onNewTherapy={handleNewTherapyFromClient}
                />
              </div>
            </Space>
          </div>
        )}

        {activeTab === 'groups' && (
          <div style={{ maxWidth: 896 }}>
            <GroupManager
              groups={groups}
              archivedGroups={archivedGroups}
              clients={clients}
              groupSessionsByGroup={groupSessionsByGroup}
              fetchGroupSessions={fetchGroupSessions}
              onDelete={removeGroup}
              onArchive={async (id) => { await updateGroup(id, { status: 'archived' }); await fetchArchivedGroups(); }}
              onToggleHomepage={(id, current) => updateGroup(id, { showOnHomepage: !current })}
              onAddParticipant={addParticipant}
              onRemoveParticipant={removeParticipant}
              onGenerateSessions={async (gid, from, to) => { await generateGroupSessions(gid, from, to); }}
              onUpdateSession={(id, updates) => updateGroupSession(id, updates)}
              onDeleteSession={(id, gid) => removeGroupSession(id, gid)}
              onUpdatePayment={(pid, updates, gid) => updatePayment(pid, updates, gid)}
              onBulkPay={bulkPayGroupPayments}
              onSendInvoice={(pid, gid) => sendGroupInvoice(pid, gid)}
              showNewForm={showNewGroup}
              onToggleNewForm={() => setShowNewGroup(!showNewGroup)}
              newForm={
                <Card size="small">
                  <Space style={{ marginBottom: 16 }}>
                    <PlusOutlined style={{ fontSize: 20, color: '#2dd4bf' }} />
                    <Typography.Text strong style={{ fontSize: 16 }}>Neue Gruppe</Typography.Text>
                  </Space>
                  <GroupForm
                    onSave={async (data) => {
                      await addGroup(data);
                      setShowNewGroup(false);
                    }}
                    onCancel={() => setShowNewGroup(false)}
                  />
                </Card>
              }
            />
          </div>
        )}

        {activeTab === 'dokumente' && (
          <Row gutter={24}>
            {/* Sidebar: template list */}
            <Col xs={24} lg={6}>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Typography.Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, display: 'block' }}>
                  Vorlagen
                </Typography.Text>
                {templates.map(t => (
                  <Button
                    key={t.key}
                    type={activeTemplate?.key === t.key ? 'primary' : 'text'}
                    ghost={activeTemplate?.key === t.key}
                    block
                    style={{ textAlign: 'left' }}
                    onClick={() => fetchTemplate(t.key)}
                  >
                    {t.label}
                  </Button>
                ))}
              </Space>
            </Col>

            {/* Editor */}
            <Col xs={24} lg={18}>
              {activeTemplate ? (
                <Card size="small">
                  <Typography.Title level={5} style={{ marginBottom: 16 }}>{activeTemplate.label}</Typography.Title>
                  <TemplateEditor
                    key={activeTemplate.key}
                    htmlContent={activeTemplate.htmlContent}
                    placeholders={activeTemplate.placeholders}
                    saving={templateSaving}
                    previewing={templatePreviewing}
                    onSave={(html) => updateTemplate(activeTemplate.key, html)}
                    onPreview={(html) => previewTemplate(activeTemplate.key, html)}
                    onUploadImage={uploadImage}
                  />
                </Card>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256 }}>
                  <Typography.Text type="secondary">Vorlage aus der Liste auswählen</Typography.Text>
                </div>
              )}
            </Col>
          </Row>
        )}
      </div>
    </div>
    </AdminLayout>
  );
}
