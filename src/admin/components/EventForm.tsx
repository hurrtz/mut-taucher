import { useState } from 'react';
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Radio,
  Select,
  TimePicker,
  Typography,
} from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Event, EventCategory } from '../../lib/data';
import { DURATION_OPTIONS, CATEGORY_OPTIONS } from '../constants';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

const { Text } = Typography;

export default function EventForm({ onSave }: { onSave: (data: Omit<Event, 'id'>) => void }) {
  const [form, setForm] = useState({
    label: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '10:00',
    durationMinutes: 60,
    customDuration: '' as string | number,
    category: 'erstgespraech' as EventCategory,
    priceCents: null as number | null,
  });

  const handleSubmit = () => {
    const duration =
      form.durationMinutes === 0 ? Number(form.customDuration) || 60 : form.durationMinutes;
    onSave({
      label: form.label,
      date: form.date,
      time: form.time,
      durationMinutes: duration,
      category: form.category,
      priceCents: form.priceCents,
    });
    setForm({
      label: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '10:00',
      durationMinutes: 60,
      customDuration: '',
      category: 'erstgespraech',
      priceCents: null,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Form.Item label="Bezeichnung (optional)" style={{ marginBottom: 0 }}>
        <Input
          value={form.label}
          onChange={e => setForm({ ...form, label: e.target.value })}
          placeholder="z.B. Sondertermin"
        />
      </Form.Item>

      <Form.Item label="Kategorie" style={{ marginBottom: 0 }}>
        <Select
          value={form.category}
          onChange={(val: EventCategory) => setForm({ ...form, category: val })}
          options={CATEGORY_OPTIONS}
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item label="Preis (€)" style={{ marginBottom: 0 }}>
        <InputNumber
          min={0}
          step={0.5}
          value={form.priceCents != null ? form.priceCents / 100 : undefined}
          onChange={val => setForm({ ...form, priceCents: val != null ? Math.round(val * 100) : null })}
          placeholder="z.B. 95"
          style={{ width: '100%' }}
          addonAfter="€"
        />
      </Form.Item>

      <Form.Item label="Datum" style={{ marginBottom: 0 }} required>
        <DatePicker
          value={dayjs(form.date)}
          onChange={d => setForm({ ...form, date: d ? d.format('YYYY-MM-DD') : form.date })}
          format="DD.MM.YYYY"
          style={{ width: '100%' }}
          allowClear={false}
        />
      </Form.Item>

      <Form.Item label="Uhrzeit" style={{ marginBottom: 0 }} required>
        <TimePicker
          value={dayjs(form.time, 'HH:mm')}
          onChange={t => setForm({ ...form, time: t ? t.format('HH:mm') : form.time })}
          format="HH:mm"
          minuteStep={5}
          style={{ width: '100%' }}
          allowClear={false}
        />
      </Form.Item>

      <Form.Item label="Dauer" style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Radio.Group
            value={form.durationMinutes}
            onChange={e => setForm({ ...form, durationMinutes: e.target.value })}
            optionType="button"
            buttonStyle="solid"
          >
            {DURATION_OPTIONS.map(opt => (
              <Radio.Button key={opt.value} value={opt.value}>
                {opt.label}
              </Radio.Button>
            ))}
          </Radio.Group>
          {form.durationMinutes === 0 && (
            <InputNumber
              min={5}
              max={480}
              value={form.customDuration === '' ? undefined : Number(form.customDuration)}
              onChange={val => setForm({ ...form, customDuration: val ?? '' })}
              placeholder="Minuten"
              style={{ width: 128 }}
            />
          )}
        </div>
      </Form.Item>

      <Button type="primary" onClick={handleSubmit} block>
        Einzeltermin anlegen
      </Button>
    </div>
  );
}

export function EventList({
  events,
  onDelete,
}: {
  events: Event[];
  onDelete: (id: number) => void;
}) {
  if (events.length === 0) return null;

  const handleDelete = (event: Event) => {
    Modal.confirm({
      title: 'Einzeltermin löschen?',
      content: `Einzeltermin "${event.label || event.date}" wirklich löschen?`,
      okText: 'Löschen',
      okType: 'danger',
      cancelText: 'Abbrechen',
      onOk: () => onDelete(event.id),
    });
  };

  return (
    <div style={{ marginTop: 16 }}>
      <Text type="secondary" style={{ fontSize: 14, fontWeight: 500 }}>
        Angelegte Einzeltermine ({events.length})
      </Text>
      <List
        style={{ marginTop: 8 }}
        dataSource={events}
        renderItem={event => (
          <List.Item
            style={{ padding: '8px 12px', background: '#fafafa', borderRadius: 8, marginBottom: 8 }}
            actions={[
              <Button
                type="text"
                icon={<DeleteOutlined />}
                danger
                title="Löschen"
                onClick={() => handleDelete(event)}
              />,
            ]}
          >
            <List.Item.Meta
              title={
                <Text strong style={{ fontSize: 14 }}>
                  {event.label || 'Einzeltermin'}
                </Text>
              }
              description={
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {format(parseISO(event.date), 'd. MMM yyyy', { locale: de })} · {event.time} Uhr ·{' '}
                  {event.durationMinutes} Min.
                </Text>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
}
