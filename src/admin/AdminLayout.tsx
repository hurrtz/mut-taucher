import { ConfigProvider, Layout, Menu, Typography, Button, FloatButton } from 'antd';
import {
  BarChartOutlined, LogoutOutlined,
} from '@ant-design/icons';
import deDE from 'antd/locale/de_DE';
import adminTheme from './theme';
import type { ReactNode } from 'react';
import type { MenuProps } from 'antd';

const { Sider, Content } = Layout;

interface MenuItem {
  key: string;
  icon: ReactNode;
  label: string;
  badge?: number;
}

interface AdminLayoutProps {
  activeKey: string;
  onNavigate: (key: string) => void;
  menuItems: MenuItem[];
  onLogout: () => void;
  children: ReactNode;
}

export default function AdminLayout({ activeKey, onNavigate, menuItems, onLogout, children }: AdminLayoutProps) {
  const antMenuItems: MenuProps['items'] = menuItems.map(item => ({
    key: item.key,
    icon: item.icon,
    label: item.badge != null ? `${item.label} (${item.badge})` : item.label,
  }));

  return (
    <ConfigProvider theme={adminTheme} locale={deDE}>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          width={220}
          breakpoint="lg"
          collapsedWidth={0}
          style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '20px 24px 12px' }}>
              <Typography.Title level={4} style={{ margin: 0 }}>Administration</Typography.Title>
            </div>

            <Menu
              mode="inline"
              selectedKeys={[activeKey]}
              onClick={({ key }) => onNavigate(key)}
              items={antMenuItems}
              style={{ flex: 1, borderRight: 'none' }}
            />

            <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0' }}>
              <Button type="text" danger icon={<LogoutOutlined />} onClick={onLogout} block style={{ textAlign: 'left' }}>
                Logout
              </Button>
            </div>
          </div>
        </Sider>

        <Content style={{ background: '#f8fafc', padding: 24 }}>
          {children}
        </Content>
      </Layout>
      <FloatButton
        icon={<BarChartOutlined />}
        tooltip="Analytics"
        href="https://app.eu.amplitude.com/analytics/mut-taucher-395196/home"
        target="_blank"
      />
    </ConfigProvider>
  );
}

// Wrapper for unauthenticated screens (login)
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider theme={adminTheme} locale={deDE}>
      {children}
    </ConfigProvider>
  );
}
