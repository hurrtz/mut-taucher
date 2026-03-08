import { useState, useEffect, useLayoutEffect, type FormEvent } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { ConfigProvider, Layout, Menu, Typography, Button, FloatButton, Card, Input, Alert, Tag, theme } from 'antd';
import {
  BarChartOutlined, LogoutOutlined,
  CalendarOutlined, TeamOutlined, UserOutlined, FileTextOutlined,
  VideoCameraOutlined, BookOutlined,
} from '@ant-design/icons';
import deDE from 'antd/locale/de_DE';
import adminTheme from './theme';
import { useAdminBooking } from '../lib/useAdminBooking';
import { apiFetch } from '../lib/api';

const { Sider, Content } = Layout;

interface NavCounts {
  erstgespraeche: number;
  kunden: number;
  einzel: number;
  gruppen: number;
  dokumente: number;
}

function NavLabel({ text, count, color, style }: { text: string; count?: number; color?: string; style?: React.CSSProperties }) {
  return (
    <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      {text}
      {count != null && count > 0 && (
        <Tag color={color} style={{ marginLeft: 8, marginRight: 0, minWidth: 24, textAlign: 'center', ...style }}>{count}</Tag>
      )}
    </span>
  );
}

function buildMenuItems(counts: NavCounts | null) {
  return [
    { key: 'kalender', icon: <CalendarOutlined />, label: 'Kalender' },
    { key: 'erstgespraeche', icon: <CalendarOutlined />, label: <NavLabel text="Erstgespräche" count={counts?.erstgespraeche} color="#fff" style={{ background: '#2dd4bf', color: '#fff', fontWeight: 700, borderColor: '#2dd4bf', boxShadow: '0 0 6px rgba(45,212,191,0.5)' }} /> },
    { key: 'einzel', icon: <VideoCameraOutlined />, label: <NavLabel text="Einzeltherapie" count={counts?.einzel} /> },
    { key: 'gruppen', icon: <TeamOutlined />, label: <NavLabel text="Gruppentherapie" count={counts?.gruppen} /> },
    { key: 'kunden', icon: <UserOutlined />, label: <NavLabel text="Patienten" count={counts?.kunden} /> },
    { key: 'dokumente', icon: <FileTextOutlined />, label: <NavLabel text="Vorlagen" count={counts?.dokumente} /> },
    { key: 'arbeitsmappe', icon: <BookOutlined />, label: 'Arbeitsmappe' },
  ];
}

export default function AdminLayout() {
  const { token } = theme.useToken();
  const { authenticated, login, logout } = useAdminBooking();
  const [counts, setCounts] = useState<NavCounts | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (authenticated) {
      apiFetch<NavCounts>('/admin/counts').then(setCounts).catch(() => {});
    }
  }, [authenticated]);

  const MENU_ITEMS = buildMenuItems(counts);

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
        <LoginForm onLogin={login} />
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider theme={adminTheme} locale={deDE}>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider width={220} breakpoint="lg" collapsedWidth={0} style={{ background: token.colorBgContainer, borderRight: `1px solid ${token.colorBorderSecondary}` }}>
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
            <div style={{ padding: '12px 16px', borderTop: `1px solid ${token.colorBorderSecondary}` }}>
              <Button type="text" danger icon={<LogoutOutlined />} onClick={logout} block style={{ textAlign: 'left' }}>
                Logout
              </Button>
            </div>
          </div>
        </Sider>
        <Content style={{ background: token.colorBgLayout, padding: 24 }}>
          <Outlet />
        </Content>
      </Layout>
      <FloatButton icon={<BarChartOutlined />} tooltip="Analytics" href="https://app.eu.amplitude.com/analytics/mut-taucher-395196/home" target="_blank" />
    </ConfigProvider>
  );
}

function LoginForm({ onLogin }: { onLogin: (password: string) => Promise<boolean> }) {
  const { token } = theme.useToken();
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: token.colorBgLayout }}>
      <Card style={{ width: 380 }}>
        <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>Admin Login</Typography.Title>
        <form onSubmit={handleSubmit}>
          <Input.Password value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Passwort" size="large" style={{ marginBottom: 16 }} />
          {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
          <Button type="primary" htmlType="submit" loading={submitting} block size="large">Login</Button>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link to="/" style={{ color: token.colorTextSecondary, fontSize: 14 }}>Zurück zur Website</Link>
          </div>
        </form>
      </Card>
    </div>
  );
}