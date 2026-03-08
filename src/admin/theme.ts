import type { ThemeConfig } from 'antd';

const adminTheme: ThemeConfig = {
  token: {
    colorPrimary: '#2dd4bf',
    colorError: '#f43f5e',
    colorWarning: '#f59e0b',
    colorText: '#334155',
    colorBgLayout: '#f8fafc',
    fontFamily: "'Inter', sans-serif",
    borderRadius: 8,
  },
  components: {
    Menu: {
      itemSelectedBg: '#ccfbf1',
      itemSelectedColor: '#134e4a',
      itemHoverBg: '#f0fdfa',
    },
  },
};

export default adminTheme;
