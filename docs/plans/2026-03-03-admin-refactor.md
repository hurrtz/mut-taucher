# Admin Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Split the 886-line AdminPage god component into route-based tab components with proper nested routing and token-based styling.

**Architecture:** Replace conditional `{activeTab === 'x' && (...)}` rendering with React Router nested routes + `<Outlet>`. Each tab becomes a lazy-loaded route component that owns its own hooks and state. Inline styles are replaced with Ant Design `theme.useToken()` values and shared style utilities.

**Tech Stack:** React Router 7 (nested routes, `<Outlet>`), Ant Design 6 (`theme.useToken()`), existing `useAdmin*` hooks.

---

### Task 1: Add shared constants and style utilities

**Files:**
- Modify: `src/admin/constants.ts`
- Create: `src/admin/styles.ts`

**Step 1: Add shared status labels/colors to constants.ts**

These are currently duplicated in `TherapyList.tsx:34-46`, `GroupManager.tsx:261-271`, and `ClientDetail.tsx:18-23`.

Add to `src/admin/constants.ts`:

```ts
export const SESSION_STATUS_LABELS: Record<string, string> = {
  scheduled: 'Geplant',
  completed: 'Abgeschlossen',
  cancelled: 'Abgesagt',
  no_show: 'Nicht erschienen',
};

export const SESSION_STATUS_COLORS: Record<string, string> = {
  scheduled: 'blue',
  completed: 'green',
  cancelled: 'default',
  no_show: 'red',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  due: 'Offen',
  paid: 'Bezahlt',
};
```

**Step 2: Create shared token-based style utilities**

Create `src/admin/styles.ts`:

```ts
import { theme } from 'antd';

const { useToken } = theme;

/** Common style patterns used across admin components. Call inside a component. */
export function useAdminStyles() {
  const { token } = useToken();

  return {
    /** Flex center layout */
    centered: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    } as const,

    /** Empty state placeholder */
    emptyState: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: 256,
      color: token.colorTextQuaternary,
    } as const,

    /** Vertical flex with gap */
    stack: (gap?: number) => ({
      display: 'flex',
      flexDirection: 'column',
      gap: gap ?? token.marginSM,
    }) as const,

    /** Page content wrapper */
    pageContent: {
      maxWidth: 1280,
    } as const,

    /** Section divider (used inside cards) */
    sectionDivider: {
      borderTop: `1px solid ${token.colorBorderSecondary}`,
      paddingTop: token.paddingSM,
      marginTop: token.paddingSM,
    } as const,

    /** Muted metadata text (12px secondary) */
    metaText: {
      fontSize: token.fontSizeSM,
      color: token.colorTextSecondary,
    } as const,

    /** Header row: title left, actions right */
    headerRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: token.marginLG,
    } as const,

    token,
  };
}
```

**Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors related to new files.

**Step 4: Commit**

```bash
git add src/admin/constants.ts src/admin/styles.ts
git commit -m "refactor: add shared status constants and token-based style utilities"
```

---

### Task 2: Create the 404 page

**Files:**
- Create: `src/pages/NotFound.tsx`

**Step 1: Create a minimal 404 page**

```tsx
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 72, margin: 0, color: '#d1d5db' }}>404</h1>
        <p style={{ fontSize: 18, color: '#64748b', margin: '16px 0 24px' }}>Seite nicht gefunden</p>
        <Link to="/" style={{ color: '#2dd4bf', fontWeight: 500 }}>Zurück zur Startseite</Link>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/pages/NotFound.tsx
git commit -m "feat: add 404 page"
```

---

### Task 3: Refactor AdminLayout into a route layout with auth gate

**Files:**
- Modify: `src/admin/AdminLayout.tsx`

**Context:** Currently `AdminLayout` is a presentational wrapper. It needs to become a route layout that:
1. Handles auth state (login form vs content)
2. Renders `<Outlet />` for child routes
3. Owns the sidebar with navigation links (using `<NavLink>` instead of callback props)
4. Blocks indexing with the robots meta tag
5. Provides logout

The auth check comes from `useAdminBooking` — specifically `authenticated`, `login`, `logout`. The layout should call `useAdminBooking` for auth only (not for booking data).

**Step 1: Rewrite AdminLayout**

Replace the entire file. The new `AdminLayout`:
- Calls `useAdminBooking()` for `authenticated`, `login`, `logout`
- If not authenticated, renders login form (currently in AdminPage lines 229-263)
- If authenticated, renders sidebar + `<Outlet />`
- Uses `useNavigate` + sidebar Menu `onClick` for navigation
- Moves the `useLayoutEffect` robots meta block from AdminPage
- Removes the old props-based interface and `AdminShell` export

Keep `AdminShell` export since `ClientDetail.tsx` uses it (but update it — it just needs ConfigProvider wrapping).

**Important:** The menu items are now hardcoded in the layout (they were in AdminPage before). Badge counts are dropped for now — they required data from all hooks.

```tsx
import { useState, useLayoutEffect, type FormEvent } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { ConfigProvider, Layout, Menu, Typography, Button, FloatButton, Card, Input, Alert, Spin } from 'antd';
import {
  BarChartOutlined, LogoutOutlined,
  CalendarOutlined, TeamOutlined, UserOutlined, FileTextOutlined,
  VideoCameraOutlined, BookOutlined,
} from '@ant-design/icons';
import deDE from 'antd/locale/de_DE';
import adminTheme from './theme';
import { useAdminBooking } from '../lib/useAdminBooking';

const { Sider, Content } = Layout;

const MENU_ITEMS = [
  { key: 'kalender', icon: <CalendarOutlined />, label: 'Kalender' },
  { key: 'erstgespraeche', icon: <CalendarOutlined />, label: 'Erstgespräche' },
  { key: 'einzel', icon: <VideoCameraOutlined />, label: 'Einzeltherapie' },
  { key: 'gruppen', icon: <TeamOutlined />, label: 'Gruppentherapie' },
  { key: 'kunden', icon: <UserOutlined />, label: 'Patienten' },
  { key: 'dokumente', icon: <FileTextOutlined />, label: 'Vorlagen' },
  { key: 'arbeitsmappe', icon: <BookOutlined />, label: 'Arbeitsmappe' },
];

export default function AdminLayout() {
  const { authenticated, login, logout, loading } = useAdminBooking();
  const navigate = useNavigate();
  const location = useLocation();

  // Block indexing
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

  // Derive active key from URL
  const pathSegment = location.pathname.split('/')[2] || 'kalender';
  const activeKey = MENU_ITEMS.some(i => i.key === pathSegment) ? pathSegment : 'kalender';

  if (!authenticated) {
    return (
      <ConfigProvider theme={adminTheme} locale={deDE}>
        <LoginForm onLogin={login} loading={loading} />
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider theme={adminTheme} locale={deDE}>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider width={220} breakpoint="lg" collapsedWidth={0} style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '20px 24px 12px' }}>
              <Typography.Title level={4} style={{ margin: 0 }}>Administration</Typography.Title>
            </div>
            <Menu
              mode="inline"
              selectedKeys={[activeKey]}
              onClick={({ key }) => navigate(`/admin/${key}`)}
              items={MENU_ITEMS}
              style={{ flex: 1, borderRight: 'none' }}
            />
            <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0' }}>
              <Button type="text" danger icon={<LogoutOutlined />} onClick={logout} block style={{ textAlign: 'left' }}>
                Logout
              </Button>
            </div>
          </div>
        </Sider>
        <Content style={{ background: '#f8fafc', padding: 24 }}>
          <Outlet />
        </Content>
      </Layout>
      <FloatButton icon={<BarChartOutlined />} tooltip="Analytics" href="https://app.eu.amplitude.com/analytics/mut-taucher-395196/home" target="_blank" />
    </ConfigProvider>
  );
}

function LoginForm({ onLogin, loading: parentLoading }: { onLogin: (password: string) => Promise<boolean>; loading: boolean }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const success = await onLogin(password);
    if (!success) setError('Falsches Passwort');
    setSubmitting(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
      <Card style={{ width: 380 }}>
        <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>Admin Login</Typography.Title>
        <form onSubmit={handleSubmit}>
          <Input.Password value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Passwort" size="large" style={{ marginBottom: 16 }} />
          {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
          <Button type="primary" htmlType="submit" loading={submitting} block size="large">Login</Button>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link to="/" style={{ color: '#8c8c8c', fontSize: 14 }}>Zurück zur Website</Link>
          </div>
        </form>
      </Card>
    </div>
  );
}

/** Wrapper for screens outside the admin layout (e.g. standalone client detail) */
export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider theme={adminTheme} locale={deDE}>
      {children}
    </ConfigProvider>
  );
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: Errors about missing `AdminLayout` props from `AdminPage.tsx` — that's fine, we'll delete AdminPage next.

**Step 3: Commit**

```bash
git add src/admin/AdminLayout.tsx
git commit -m "refactor: convert AdminLayout to route layout with auth gate and Outlet"
```

---

### Task 4: Extract tab components from AdminPage

This is the largest task. Extract each `{activeTab === 'x' && (...)}` block from `AdminPage.tsx` into its own file. Each tab component:
- Calls its own `useAdmin*` hooks
- Owns its own `useState` for modals/editing
- Uses `useAdminStyles()` for common patterns
- Renders its own title + action buttons

**Files:**
- Create: `src/admin/tabs/CalendarTab.tsx`
- Create: `src/admin/tabs/BookingsTab.tsx`
- Create: `src/admin/tabs/TherapiesTab.tsx`
- Create: `src/admin/tabs/GroupsTab.tsx`
- Create: `src/admin/tabs/PatientsTab.tsx`
- Create: `src/admin/tabs/TemplatesTab.tsx`
- Create: `src/admin/tabs/WorkbookTab.tsx`
- Delete: `src/admin/AdminPage.tsx` (after all tabs are extracted)
- Modify: `src/pages/Admin.tsx` (no longer re-exports AdminPage)

**Step 1: Create CalendarTab.tsx**

Extract AdminPage lines 346-449 (the `activeTab === 'rules'` block). This tab uses `useAdminBooking` for rules, events, calendar sessions, blocked days, cancellations.

Local state needed: `editingRuleId`, `showCancellationModal`, `showRuleModal`, `showEventModal`, `calendarSubTab` (from search params).

```tsx
// src/admin/tabs/CalendarTab.tsx
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

      {/* Copy the exact Tabs + Modal JSX from AdminPage lines 348-449 here, replacing inline styles with styles.* where applicable */}
      {/* ... full JSX from the activeTab === 'rules' block ... */}
    </div>
  );
}
```

The actual implementation should copy the full JSX from AdminPage lines 346-449, not abbreviated. The pattern is the same for all tabs below.

**Step 2: Create BookingsTab.tsx**

Extract AdminPage lines 452-462. Uses `useAdminBooking` for bookings + `useAdminClients` for `migrateBookingToClient`.

```tsx
// src/admin/tabs/BookingsTab.tsx
import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminBooking } from '../../lib/useAdminBooking';
import { useAdminClients } from '../../lib/useAdminClients';
import { useAdminStyles } from '../styles';
import BookingList from '../components/BookingList';
import { Typography, Alert } from 'antd';

export default function BookingsTab() {
  const styles = useAdminStyles();
  const { bookings, error, fetchBookings, updateBooking, sendEmail, sendBookingInvoice } = useAdminBooking();
  const { migrateBookingToClient } = useAdminClients();
  const navigate = useNavigate();

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleMigrate = useCallback(async (bookingId: number) => {
    const clientId = await migrateBookingToClient(bookingId);
    if (clientId) navigate('/admin/kunden');
  }, [migrateBookingToClient, navigate]);

  return (
    <div style={styles.pageContent}>
      <div style={styles.headerRow}>
        <Typography.Title style={{ margin: 0 }}>Erstgespräche</Typography.Title>
      </div>
      {error && <Alert message={error} type="error" showIcon closable style={{ marginBottom: styles.token.marginMD }} />}
      <BookingList
        bookings={bookings}
        onUpdate={updateBooking}
        onSendEmail={sendEmail}
        onSendInvoice={sendBookingInvoice}
        onMigrateToClient={handleMigrate}
      />
    </div>
  );
}
```

**Step 3: Create TherapiesTab.tsx**

Extract AdminPage lines 464-508. Uses `useAdminTherapies` + `useAdminClients` (for client list in therapy form).

Local state: `showNewTherapy`, `editingTherapy`, `newTherapyClientId`.

```tsx
// src/admin/tabs/TherapiesTab.tsx
import { useState, useEffect } from 'react';
import { useAdminTherapies } from '../../lib/useAdminTherapies';
import { useAdminClients } from '../../lib/useAdminClients';
import { useAdminStyles } from '../styles';
import TherapyForm from '../components/TherapyForm';
import TherapyList from '../components/TherapyList';
import type { Therapy } from '../../lib/data';
import { Typography, Button, Modal, Alert } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

export default function TherapiesTab() {
  const styles = useAdminStyles();
  const {
    therapies, archivedTherapies, sessionsByTherapy, error,
    fetchTherapies, fetchArchivedTherapies, addTherapy, updateTherapy, removeTherapy,
    fetchSessions, generateSessions, updateSession, removeSession, sendInvoice,
  } = useAdminTherapies();
  const { clients, fetchClients } = useAdminClients();

  const [showNewTherapy, setShowNewTherapy] = useState(false);
  const [editingTherapy, setEditingTherapy] = useState<Therapy | null>(null);
  const [newTherapyClientId, setNewTherapyClientId] = useState<number | undefined>();

  useEffect(() => {
    fetchTherapies();
    fetchArchivedTherapies();
    fetchClients();
  }, [fetchTherapies, fetchArchivedTherapies, fetchClients]);

  return (
    <div style={styles.pageContent}>
      <div style={styles.headerRow}>
        <Typography.Title style={{ margin: 0 }}>Einzeltherapie</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowNewTherapy(true)}>Neue Therapie</Button>
      </div>
      {error && <Alert message={error} type="error" showIcon closable style={{ marginBottom: styles.token.marginMD }} />}

      <Modal
        title={editingTherapy ? 'Therapie bearbeiten' : 'Neue Therapie'}
        open={showNewTherapy || !!editingTherapy}
        onCancel={() => { setShowNewTherapy(false); setNewTherapyClientId(undefined); setEditingTherapy(null); }}
        footer={null}
        destroyOnClose
        width={720}
      >
        <TherapyForm
          key={editingTherapy?.id ?? 'new'}
          clients={clients}
          initialClientId={newTherapyClientId}
          initial={editingTherapy ?? undefined}
          onSave={async (data) => {
            if (editingTherapy) await updateTherapy(editingTherapy.id, data);
            else await addTherapy(data);
            setShowNewTherapy(false);
            setNewTherapyClientId(undefined);
            setEditingTherapy(null);
          }}
          onCancel={() => { setShowNewTherapy(false); setNewTherapyClientId(undefined); setEditingTherapy(null); }}
        />
      </Modal>

      <TherapyList
        therapies={therapies}
        archivedTherapies={archivedTherapies}
        sessionsByTherapy={sessionsByTherapy}
        fetchSessions={fetchSessions}
        onEdit={(therapy) => setEditingTherapy(therapy)}
        onDelete={removeTherapy}
        onArchive={async (id) => { await updateTherapy(id, { status: 'archived' }); await fetchArchivedTherapies(); }}
        onGenerateSessions={generateSessions}
        onUpdateSession={updateSession}
        onDeleteSession={removeSession}
        onSendInvoice={sendInvoice}
        showNewForm={false}
        newForm={null}
      />
    </div>
  );
}
```

**Step 4: Create GroupsTab.tsx**

Extract AdminPage lines 559-606. Uses `useAdminGroups` + `useAdminClients`.

Local state: `showNewGroup`, `editingGroup`.

Same pattern as TherapiesTab but with GroupForm + GroupManager.

**Step 5: Create PatientsTab.tsx**

Extract AdminPage lines 510-557. Uses `useAdminClients`.

Local state: `editingClientId`, `showNewClient`, `selectedClientId`.

**Step 6: Create TemplatesTab.tsx**

Extract AdminPage lines 608-759. Uses `useAdminTemplates` + `useAdminBranding`.

This is the most complex tab — contains the template sidebar, editor, create/mapping/group modals, branding sub-tab.

Local state: `showTemplateCreate`, `showMappingModal`, `showGroupModal`, `dokumenteSubTab`, `editorRef`.

Also move the `TemplateGroupModal` component (AdminPage lines 44-74) into this file as a local component.

**Step 7: Create WorkbookTab.tsx**

Extract AdminPage lines 761-882. Uses `useAdminWorkbook` + `useAdminTherapies` + `useAdminGroups` + `useAdminClients` (for share modal).

Local state: `selectedMaterialId`, `showWorkbookUpload`, `showWorkbookShare`.

**Step 8: Delete AdminPage.tsx and update Admin.tsx**

`src/pages/Admin.tsx` currently re-exports `AdminPage`. Since we're moving to nested routes, this file is no longer needed as an entry point. It can either be deleted (if routing is updated first) or kept temporarily.

**Step 9: Verify all tabs compile**

Run: `npx tsc --noEmit`

**Step 10: Commit**

```bash
git add src/admin/tabs/ src/pages/Admin.tsx
git rm src/admin/AdminPage.tsx
git commit -m "refactor: split AdminPage into per-tab route components"
```

---

### Task 5: Wire up nested routes in App.tsx

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/Admin.tsx`

**Step 1: Update App.tsx with nested routes**

Replace the flat admin routes with nested routes. Each tab is lazy-loaded.

```tsx
import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
// ... keep existing public imports ...

const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const CalendarTab = lazy(() => import('./admin/tabs/CalendarTab'));
const BookingsTab = lazy(() => import('./admin/tabs/BookingsTab'));
const TherapiesTab = lazy(() => import('./admin/tabs/TherapiesTab'));
const GroupsTab = lazy(() => import('./admin/tabs/GroupsTab'));
const PatientsTab = lazy(() => import('./admin/tabs/PatientsTab'));
const TemplatesTab = lazy(() => import('./admin/tabs/TemplatesTab'));
const WorkbookTab = lazy(() => import('./admin/tabs/WorkbookTab'));
const ClientDetail = lazy(() => import('./pages/ClientDetail'));
const NotFound = lazy(() => import('./pages/NotFound'));

// ... keep AdminSuspense, ScrollToTop, WipOverlay ...

function App() {
  return (
    <Router>
      <WipOverlay />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ueber-mich" element={<UeberMich />} />
        <Route path="/leistungen/:slug" element={<Service />} />
        <Route path="/wissen/:slug" element={<Article />} />
        <Route path="/datenschutz" element={<Datenschutz />} />
        <Route path="/impressum" element={<Impressum />} />
        <Route path="/agb" element={<AGB />} />

        <Route path="/admin" element={<AdminSuspense><AdminLayout /></AdminSuspense>}>
          <Route index element={<Navigate to="kalender" replace />} />
          <Route path="kalender" element={<CalendarTab />} />
          <Route path="erstgespraeche" element={<BookingsTab />} />
          <Route path="einzel" element={<TherapiesTab />} />
          <Route path="gruppen" element={<GroupsTab />} />
          <Route path="kunden" element={<PatientsTab />} />
          <Route path="dokumente" element={<TemplatesTab />} />
          <Route path="arbeitsmappe" element={<WorkbookTab />} />
          <Route path="client/:id" element={<ClientDetail />} />
        </Route>

        <Route path="*" element={<AdminSuspense><NotFound /></AdminSuspense>} />
      </Routes>
      <ConsentBanner />
    </Router>
  );
}
```

Note: `ClientDetail` moves inside the admin layout route so it gets the sidebar too.

**Step 2: Remove or update src/pages/Admin.tsx**

This file is no longer needed since `AdminLayout` is imported directly in `App.tsx`. Delete it or keep as empty redirect.

**Step 3: Update ClientDetail.tsx**

Remove the `<AdminShell>` wrapper from `ClientDetail` since it's now rendered inside `AdminLayout` which already provides `ConfigProvider`.

**Step 4: Verify**

Run: `npx tsc --noEmit`
Run: `npm run dev` — navigate to `/admin`, `/admin/kalender`, `/admin/kunden`, `/admin/client/1`, and `/nonexistent`.

**Step 5: Commit**

```bash
git add src/App.tsx src/pages/ClientDetail.tsx
git rm src/pages/Admin.tsx  # if deleted
git commit -m "feat: wire up nested admin routes with lazy-loaded tab components"
```

---

### Task 6: Replace inline styles with token-based styles in tab components

**Files:**
- Modify: all files in `src/admin/tabs/`
- Modify: `src/admin/components/TherapyList.tsx`
- Modify: `src/admin/components/GroupManager.tsx`
- Modify: `src/admin/AdminLayout.tsx`

**Step 1: Update TherapyList.tsx and GroupManager.tsx**

Replace duplicated status labels with imports from constants:

```ts
import { SESSION_STATUS_LABELS, SESSION_STATUS_COLORS } from '../constants';
```

Remove local `statusLabels` and `statusTagColors` definitions.

Replace raw hex colors in `valueStyle` and inline styles with token values:
- `'#1677ff'` → `token.colorPrimary`
- `'#52c41a'` → `token.colorSuccess`
- `'#888'` → `token.colorTextSecondary`
- `'#f0f0f0'` → `token.colorBorderSecondary`
- `fontSize: 12` → `fontSize: token.fontSizeSM`
- `gap: 12` → `gap: token.marginSM`

Add `useAdminStyles()` call at top of each component that needs it.

**Step 2: Update AdminLayout.tsx**

Replace hardcoded colors:
- `background: '#fff'` → `background: token.colorBgContainer`
- `borderRight: '1px solid #f0f0f0'` → `borderRight: \`1px solid ${token.colorBorderSecondary}\``
- `background: '#f8fafc'` → `background: token.colorBgLayout`
- `background: '#f5f5f5'` → `background: token.colorBgLayout`

**Step 3: Update all tab components**

In each tab file, replace inline style patterns:
- `style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}` → `style={styles.centered}`
- `style={{ display: 'flex', flexDirection: 'column', gap: N }}` → `style={styles.stack(N)}`
- `style={{ maxWidth: 1280 }}` → `style={styles.pageContent}`
- `style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}` → `style={styles.headerRow}`
- Empty state placeholders → `style={styles.emptyState}`

**Step 4: Verify**

Run: `npm run dev` — visually confirm admin still looks the same.
Run: `npx tsc --noEmit`

**Step 5: Commit**

```bash
git add -A
git commit -m "style: replace inline styles with Ant Design token-based utilities"
```

---

### Task 7: Final cleanup and verification

**Files:**
- Verify all old imports of `AdminPage` are removed
- Verify `useAdminBooking` hook works correctly when called from multiple components (layout + CalendarTab + BookingsTab)

**Step 1: Check for stale imports**

Search for any remaining references to `AdminPage`:
```bash
grep -r "AdminPage" src/
```
Should return nothing (or only the deleted file in git status).

**Step 2: Check for unused imports**

Run: `npm run lint`

**Step 3: Smoke test all admin routes**

Run: `npm run dev` and manually navigate:
- `/admin` → should redirect to `/admin/kalender`
- `/admin/kalender` → calendar with rules
- `/admin/erstgespraeche` → bookings list
- `/admin/einzel` → therapies
- `/admin/gruppen` → groups
- `/admin/kunden` → patients with history panel
- `/admin/dokumente` → templates + branding tabs
- `/admin/arbeitsmappe` → workbook materials
- `/admin/client/1` → client detail (if client exists)
- `/nonexistent` → 404 page
- Sidebar navigation highlights correct item
- Logout works
- Login works after logout

**Step 4: Build check**

Run: `npm run build`
Expected: Clean build with no errors.

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor: complete admin restructure — nested routes, per-tab components, token styles"
```

---

## Important Notes for Implementer

1. **`useAdminBooking` is called in multiple places** (AdminLayout for auth, CalendarTab for rules, BookingsTab for bookings). The hook uses `useState` internally, so each instance is independent — this is intentional. Auth state (token in sessionStorage) is shared via `api.ts`.

2. **The `TemplateGroupModal` component** (AdminPage lines 44-74) should move into `TemplatesTab.tsx` as a local component.

3. **`ClientHistoryPanel`** is currently exported from `src/pages/ClientDetail.tsx` and imported in `AdminPage.tsx` line 25 for the patients tab inline history. Move this import into `PatientsTab.tsx`.

4. **Badge counts on sidebar items** are dropped in this refactor. Each tab now fetches its own data, so the layout doesn't have counts. This is acceptable — adding badge counts back would require a lightweight context or API endpoint, which is out of scope.

5. **Don't refactor the internal structure of `TherapyList.tsx` or `GroupManager.tsx`** in this pass. The goal is to move them into their own route contexts, not to merge their session panels. That's a separate follow-up.
