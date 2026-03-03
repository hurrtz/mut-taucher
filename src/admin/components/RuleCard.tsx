import { useState } from 'react';
import { Card, Button, Tag, Space, Typography } from 'antd';
import { EditOutlined, DeleteOutlined, SyncOutlined, ClockCircleOutlined, CalendarOutlined, StopOutlined } from '@ant-design/icons';
import type { RecurringRule } from '../../lib/data';
import { DAY_LABELS_LONG } from '../constants';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

export default function RuleCard({ rule, onEdit, onDelete, onToggleException }: {
  rule: RecurringRule;
  onEdit: () => void;
  onDelete: () => void;
  onToggleException: (date: string) => void;
}) {
  const [showExceptions, setShowExceptions] = useState(false);

  const daysLabel = rule.days
    .map(d => `${DAY_LABELS_LONG[d.dayOfWeek]}${d.frequency === 'biweekly' ? ' (2-wöch.)' : ''}`)
    .join(', ');

  const formatDuration = (m: number) => {
    if (m < 60) return `${m} Min.`;
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r > 0 ? `${h} Std. ${r} Min.` : `${h} Std.`;
  };

  return (
    <Card
      extra={
        <Space size={0}>
          <Button type="text" icon={<EditOutlined />} onClick={onEdit} title="Bearbeiten" />
          <Button type="text" icon={<DeleteOutlined />} onClick={onDelete} title="Löschen" danger />
        </Space>
      }
      title={
        <Typography.Text strong ellipsis>
          {rule.label || 'Ohne Bezeichnung'}
        </Typography.Text>
      }
    >
      <Space direction="vertical" size={2}>
        <Space size={6}>
          <SyncOutlined style={{ color: '#9ca3af', fontSize: 13 }} />
          <Typography.Text type="secondary">{daysLabel}</Typography.Text>
        </Space>
        <Space size={6}>
          <ClockCircleOutlined style={{ color: '#9ca3af', fontSize: 13 }} />
          <Typography.Text type="secondary">
            {rule.time} Uhr · {formatDuration(rule.durationMinutes)}
          </Typography.Text>
        </Space>
        <Space size={6}>
          <CalendarOutlined style={{ color: '#9ca3af', fontSize: 13 }} />
          <Typography.Text type="secondary">
            Ab {format(parseISO(rule.startDate), 'd. MMM yyyy', { locale: de })}
            {rule.endDate
              ? ` bis ${format(parseISO(rule.endDate), 'd. MMM yyyy', { locale: de })}`
              : ' · unbegrenzt'}
          </Typography.Text>
        </Space>
      </Space>

      {rule.exceptions.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Button
            type="link"
            size="small"
            icon={<StopOutlined />}
            onClick={() => setShowExceptions(!showExceptions)}
            style={{ padding: 0, fontSize: 12 }}
          >
            {rule.exceptions.length} Ausnahme{rule.exceptions.length > 1 ? 'n' : ''}
          </Button>
          {showExceptions && (
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {rule.exceptions.sort().map(date => (
                <Tag
                  key={date}
                  color="error"
                  closable
                  onClose={() => onToggleException(date)}
                  title="Klicken um Ausnahme aufzuheben"
                  style={{ textDecoration: 'line-through' }}
                >
                  {format(parseISO(date), 'd. MMM', { locale: de })}
                </Tag>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
