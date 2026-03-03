import { ConfigProvider } from 'antd';
import deDE from 'antd/locale/de_DE';
import adminTheme from './theme';
import type { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider theme={adminTheme} locale={deDE}>
      {children}
    </ConfigProvider>
  );
}
