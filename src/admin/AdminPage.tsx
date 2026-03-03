import { useState, useEffect, useLayoutEffect, useCallback, type FormEvent } from 'react';
import AdminLayout, { AdminShell } from './AdminLayout';
import { useAdminBooking } from '../lib/useAdminBooking';
import { useAdminClients } from '../lib/useAdminClients';
import { useAdminTherapies } from '../lib/useAdminTherapies';
import { useAdminGroups } from '../lib/useAdminGroups';
import { useAdminTemplates } from '../lib/useAdminTemplates';
import { useAdminWorkbook } from '../lib/useAdminWorkbook';
import { getToken } from '../lib/api';
import TemplateEditor from '../components/TemplateEditor';
import WorkbookUploadModal from './components/WorkbookUploadModal';
import WorkbookShareModal from './components/WorkbookShareModal';
import RuleForm from './components/RuleForm';
import RuleCard from './components/RuleCard';
import EventForm, { EventList } from './components/EventForm';
import CalendarPreview from './components/CalendarPreview';
import CancellationModal from './components/CancellationModal';
import BookingList from './components/BookingList';
import ClientForm from './components/ClientForm';
import ClientList from './components/ClientList';
import { ClientHistoryPanel } from '../pages/ClientDetail';
import TherapyForm from './components/TherapyForm';
import TherapyList from './components/TherapyList';
import GroupForm from './components/GroupForm';
import GroupManager from './components/GroupManager';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Link } from 'react-router-dom';
import { Card, Input, Button, Alert, Spin, Space, Typography, Row, Col, Badge, Tabs, Modal } from 'antd';
import {
  CalendarOutlined, TeamOutlined, UserOutlined, FileTextOutlined,
  VideoCameraOutlined, BookOutlined,
  PlusOutlined, ScheduleOutlined, UserAddOutlined,
  SendOutlined, DeleteOutlined,
} from '@ant-design/icons';

const { Title } = Typography;

type TabKey = 'rules' | 'erstgespraeche' | 'einzel' | 'kunden' | 'groups' | 'dokumente' | 'arbeitsmappe';

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

  const {
    materials, error: workbookError,
    fetchMaterials, uploadMaterial, removeMaterial, sendMaterial,
  } = useAdminWorkbook();

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
  const [calendarSubTab, setCalendarSubTab] = useState<'calendar' | 'rules'>('calendar');
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);
  const [showWorkbookUpload, setShowWorkbookUpload] = useState(false);
  const [showWorkbookShare, setShowWorkbookShare] = useState(false);
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
      fetchMaterials();
    }
  }, [authenticated, fetchRules, fetchEvents, fetchBookings, fetchGroups, fetchArchivedGroups, fetchClients, fetchTherapies, fetchArchivedTherapies, fetchTemplates, fetchBlockedDays, fetchMaterials]);

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

  const combinedError = error || clientsError || therapiesError || groupsError || templatesError || workbookError;

  if (!authenticated) {
    return (
      <AdminShell>
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
      </AdminShell>
    );
  }

  const editingRule = editingRuleId ? rules.find(r => r.id === editingRuleId) : undefined;
  const editingClient = editingClientId ? clients.find(c => c.id === editingClientId) : undefined;

  const sidebarMenuItems = [
    { key: 'rules', icon: <CalendarOutlined />, label: 'Kalender' },
    { key: 'erstgespraeche', icon: <CalendarOutlined />, label: 'Erstgespräche', badge: bookings.filter(b => b.status === 'confirmed').length },
    { key: 'einzel', icon: <VideoCameraOutlined />, label: 'Einzeltherapie', badge: therapies.length },
    { key: 'groups', icon: <TeamOutlined />, label: 'Gruppentherapie', badge: groups.length },
    { key: 'kunden', icon: <UserOutlined />, label: 'Patienten', badge: clients.length },
    { key: 'dokumente', icon: <FileTextOutlined />, label: 'Vorlagen', badge: templates.length },
    { key: 'arbeitsmappe', icon: <BookOutlined />, label: 'Arbeitsmappe', badge: materials.length },
  ];

  const sectionTitles: Record<TabKey, string> = {
    rules: 'Kalender',
    erstgespraeche: 'Erstgespräche',
    einzel: 'Einzeltherapie',
    groups: 'Gruppentherapie',
    kunden: 'Patienten',
    dokumente: 'Vorlagen',
    arbeitsmappe: 'Arbeitsmappe',
  };

  return (
    <AdminLayout
      activeKey={activeTab}
      onNavigate={(key) => setActiveTab(key as TabKey)}
      menuItems={sidebarMenuItems}
      onLogout={logout}
    >
      <div style={{ maxWidth: 1280 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Title style={{ margin: 0 }}>{sectionTitles[activeTab]}</Title>
          {activeTab === 'rules' && (
            <Space>
              <Button type="primary" icon={<ScheduleOutlined />} onClick={() => setShowRuleModal(true)}>neuer Regeltermin</Button>
              <Button type="primary" icon={<ScheduleOutlined />} onClick={() => setShowEventModal(true)}>neuer Einzeltermin</Button>
            </Space>
          )}
          {activeTab === 'einzel' && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowNewTherapy(!showNewTherapy)}>
              Neue Therapie
            </Button>
          )}
          {activeTab === 'groups' && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowNewGroup(!showNewGroup)}>
              Neue Gruppe
            </Button>
          )}
          {activeTab === 'kunden' && (
            <Button type="primary" icon={<UserAddOutlined />} onClick={() => setShowNewClient(true)}>
              Neue:r Patient:in
            </Button>
          )}
          {activeTab === 'arbeitsmappe' && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowWorkbookUpload(true)}>
              Neues Dokument hochladen
            </Button>
          )}
        </div>

        {combinedError && (
          <Alert message={combinedError} type="error" showIcon closable style={{ marginBottom: 16 }} />
        )}

        {loading && rules.length === 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
            <Spin size="large" />
          </div>
        )}

        {activeTab === 'rules' && (
          <>
            <Tabs
              activeKey={calendarSubTab}
              onChange={(key) => setCalendarSubTab(key as 'calendar' | 'rules')}
              items={[
                {
                  key: 'calendar',
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
                  key: 'rules',
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
          </>
        )}

        {activeTab === 'erstgespraeche' && (
          <div>
            <BookingList
              bookings={bookings}
              onUpdate={updateBooking}
              onSendEmail={sendEmail}
              onMigrateToClient={handleMigrateToClient}
            />
          </div>
        )}

        {activeTab === 'einzel' && (
          <div>
            <Modal
              title="Neue Therapie"
              open={showNewTherapy}
              onCancel={() => { setShowNewTherapy(false); setNewTherapyClientId(undefined); }}
              footer={null}
              destroyOnClose
              width={720}
            >
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
            </Modal>
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
              showNewForm={false}
              newForm={null}
            />
          </div>
        )}

        {activeTab === 'kunden' && (
          <div>
            <Modal
              title={editingClient ? 'Patient:in bearbeiten' : 'Neue:r Patient:in'}
              open={showNewClient || !!editingClient}
              onCancel={() => { setEditingClientId(null); setShowNewClient(false); }}
              footer={null}
              destroyOnClose
              width={720}
            >
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
            </Modal>

            <Row gutter={24}>
              <Col xs={24} lg={12}>
                <ClientList
                  clients={clients}
                  onEdit={(id) => { setEditingClientId(id); setShowNewClient(false); }}
                  onDelete={removeClient}
                  selectedId={selectedClientId}
                  onSelect={(id) => setSelectedClientId(prev => prev === id ? null : id)}
                />
              </Col>
              <Col xs={24} lg={12}>
                {selectedClientId ? (
                  <ClientHistoryPanel key={selectedClientId} clientId={selectedClientId} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256, color: 'rgba(0,0,0,0.25)' }}>
                    <Typography.Text type="secondary">Patient:in auswählen, um den Verlauf zu sehen</Typography.Text>
                  </div>
                )}
              </Col>
            </Row>
          </div>
        )}

        {activeTab === 'groups' && (
          <div>
            <Modal
              title="Neue Gruppe"
              open={showNewGroup}
              onCancel={() => setShowNewGroup(false)}
              footer={null}
              destroyOnClose
              width={720}
            >
              <GroupForm
                onSave={async (data) => {
                  await addGroup(data);
                  setShowNewGroup(false);
                }}
                onCancel={() => setShowNewGroup(false)}
              />
            </Modal>
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
              showNewForm={false}
              newForm={null}
            />
          </div>
        )}

        {activeTab === 'dokumente' && (
          <Row gutter={24}>
            {/* Sidebar: template list */}
            <Col xs={24} lg={6}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {templates.map(t => (
                  <Button
                    key={t.key}
                    type={activeTemplate?.key === t.key ? 'primary' : 'text'}
                    ghost={activeTemplate?.key === t.key}
                    block
                    style={{ justifyContent: 'flex-start', textAlign: 'left', whiteSpace: 'normal', height: 'auto', padding: '8px 16px' }}
                    onClick={() => fetchTemplate(t.key)}
                  >
                    {t.label}
                  </Button>
                ))}
              </div>
            </Col>

            {/* Editor */}
            <Col xs={24} lg={18}>
              {activeTemplate ? (
                <Card title={activeTemplate.label}>
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

        {activeTab === 'arbeitsmappe' && (() => {
          const selectedMaterial = materials.find(m => m.id === selectedMaterialId);
          const existingGroups = [...new Set(materials.map(m => m.groupName).filter((g): g is string => !!g))];
          const grouped = materials.reduce<Record<string, typeof materials>>((acc, m) => {
            const key = m.groupName || '';
            (acc[key] ??= []).push(m);
            return acc;
          }, {});
          const ungrouped = grouped[''] || [];
          const groupNames = Object.keys(grouped).filter(k => k !== '').sort((a, b) => a.localeCompare(b, 'de'));

          return (
            <>
              <Row gutter={24}>
                <Col xs={24} lg={6}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {ungrouped.map(m => (
                      <Button
                        key={m.id}
                        type={selectedMaterialId === m.id ? 'primary' : 'text'}
                        ghost={selectedMaterialId === m.id}
                        block
                        style={{ justifyContent: 'flex-start', whiteSpace: 'normal', height: 'auto', padding: '8px 16px' }}
                        onClick={() => setSelectedMaterialId(prev => prev === m.id ? null : m.id)}
                      >
                        {m.name}
                      </Button>
                    ))}
                    {groupNames.map(g => (
                      <div key={g}>
                        <Typography.Text type="secondary" style={{ display: 'block', padding: '12px 16px 4px', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                          {g}
                        </Typography.Text>
                        {grouped[g].map(m => (
                          <Button
                            key={m.id}
                            type={selectedMaterialId === m.id ? 'primary' : 'text'}
                            ghost={selectedMaterialId === m.id}
                            block
                            style={{ justifyContent: 'flex-start', whiteSpace: 'normal', height: 'auto', padding: '8px 16px' }}
                            onClick={() => setSelectedMaterialId(prev => prev === m.id ? null : m.id)}
                          >
                            {m.name}
                          </Button>
                        ))}
                      </div>
                    ))}
                    {materials.length === 0 && (
                      <Typography.Text type="secondary" style={{ padding: 16 }}>
                        Noch keine Materialien hochgeladen.
                      </Typography.Text>
                    )}
                  </div>
                </Col>

                <Col xs={24} lg={18}>
                  {selectedMaterial ? (
                    <Card
                      title={selectedMaterial.name}
                      extra={
                        <Space>
                          <Button icon={<SendOutlined />} onClick={() => setShowWorkbookShare(true)}>
                            Versenden
                          </Button>
                          <Button
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => {
                              if (confirm(`"${selectedMaterial.name}" wirklich löschen?`)) {
                                removeMaterial(selectedMaterial.id);
                                setSelectedMaterialId(null);
                              }
                            }}
                          />
                        </Space>
                      }
                    >
                      {selectedMaterial.mimeType === 'application/pdf' ? (
                        <iframe
                          src={`/api/admin/workbook/${selectedMaterial.id}/download?token=${getToken()}`}
                          style={{ width: '100%', height: 600, border: 'none' }}
                          title={selectedMaterial.name}
                        />
                      ) : (
                        <img
                          src={`/api/admin/workbook/${selectedMaterial.id}/download?token=${getToken()}`}
                          alt={selectedMaterial.name}
                          style={{ maxWidth: '100%', height: 'auto' }}
                        />
                      )}
                    </Card>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256 }}>
                      <Typography.Text type="secondary">Material aus der Liste auswählen</Typography.Text>
                    </div>
                  )}
                </Col>
              </Row>

              <WorkbookUploadModal
                open={showWorkbookUpload}
                onClose={() => setShowWorkbookUpload(false)}
                onUpload={uploadMaterial}
                existingGroups={existingGroups}
              />

              {selectedMaterial && (
                <WorkbookShareModal
                  open={showWorkbookShare}
                  onClose={() => setShowWorkbookShare(false)}
                  materialName={selectedMaterial.name}
                  onSend={(clientIds) => sendMaterial(selectedMaterial.id, clientIds)}
                  therapies={therapies}
                  groups={groups}
                  clients={clients}
                />
              )}
            </>
          );
        })()}
      </div>
    </AdminLayout>
  );
}
