import { type ReactNode } from 'react';
import { Collapse } from 'antd';

export function InlineCollapsible({ title, count, children, defaultOpen = false }: {
  title: string;
  count?: number;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const label = `${title}${count != null ? ` (${count})` : ''}`;

  return (
    <Collapse
      ghost
      size="small"
      defaultActiveKey={defaultOpen ? ['1'] : []}
      items={[{ key: '1', label, children }]}
    />
  );
}

export function CollapsibleSection({ title, icon, children, defaultOpen = false }: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const label = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 15 }}>
      {icon}
      {title}
    </span>
  );

  return (
    <Collapse
      defaultActiveKey={defaultOpen ? ['1'] : []}
      items={[{ key: '1', label, children }]}
    />
  );
}
