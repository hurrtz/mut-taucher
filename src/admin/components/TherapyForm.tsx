import { useState, type FormEvent } from 'react';
import type { Client, TherapyScheduleRule } from '../../lib/data';
import { DAY_LABELS_LONG } from '../constants';
import { format } from 'date-fns';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { Button, Col, DatePicker, Form, Input, InputNumber, Row, Select, Space, TimePicker } from 'antd';
import dayjs from 'dayjs';

export default function TherapyForm({ clients, initialClientId, onSave, onCancel }: {
  clients: Client[];
  initialClientId?: number;
  onSave: (data: {
    clientId: number; label: string; startDate: string; endDate?: string | null;
    sessionCostCents?: number; sessionDurationMinutes?: number; videoLink?: string;
    notes?: string; schedule: TherapyScheduleRule[];
  }) => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState({
    clientId: initialClientId ?? 0,
    label: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: '',
    sessionCostCents: 12000,
    sessionDurationMinutes: 60,
    videoLink: '',
    notes: '',
    schedule: [{ dayOfWeek: 1, frequency: 'weekly' as 'weekly' | 'biweekly', time: '10:00' }],
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.clientId) return;
    onSave({
      clientId: form.clientId,
      label: form.label,
      startDate: form.startDate,
      endDate: form.endDate || null,
      sessionCostCents: form.sessionCostCents,
      sessionDurationMinutes: form.sessionDurationMinutes,
      videoLink: form.videoLink || undefined,
      notes: form.notes || undefined,
      schedule: form.schedule.filter(s => s.time),
    });
  };

  const addScheduleRule = () => {
    setForm(f => ({
      ...f,
      schedule: [...f.schedule, { dayOfWeek: 1, frequency: 'weekly' as 'weekly' | 'biweekly', time: '10:00' }],
    }));
  };

  const removeScheduleRule = (idx: number) => {
    setForm(f => ({ ...f, schedule: f.schedule.filter((_, i) => i !== idx) }));
  };

  const updateScheduleRule = (idx: number, updates: Partial<TherapyScheduleRule>) => {
    setForm(f => ({
      ...f,
      schedule: f.schedule.map((s, i) => i === idx ? { ...s, ...updates } : s),
    }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Form.Item label="Klient:in">
          <Select
            value={form.clientId}
            onChange={(value) => setForm({ ...form, clientId: value })}
            options={[
              { value: 0, label: 'Bitte wählen...' },
              ...clients.map(c => ({
                value: c.id,
                label: `${c.lastName}, ${c.firstName} (${c.email})`,
              })),
            ]}
          />
        </Form.Item>

        <Form.Item label="Bezeichnung">
          <Input
            value={form.label}
            onChange={e => setForm({ ...form, label: e.target.value })}
            placeholder="z.B. Einzeltherapie"
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Startdatum">
              <DatePicker
                value={form.startDate ? dayjs(form.startDate) : null}
                onChange={(d) => setForm({ ...form, startDate: d ? d.format('YYYY-MM-DD') : '' })}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Enddatum (optional)">
              <DatePicker
                value={form.endDate ? dayjs(form.endDate) : null}
                onChange={(d) => setForm({ ...form, endDate: d ? d.format('YYYY-MM-DD') : '' })}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Kosten pro Sitzung (Cent)">
              <InputNumber
                value={form.sessionCostCents}
                onChange={(value) => setForm({ ...form, sessionCostCents: value ?? 0 })}
                style={{ width: '100%' }}
              />
              <span style={{ fontSize: 12, color: '#9ca3af' }}>{(form.sessionCostCents / 100).toFixed(2)} &euro;</span>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Sitzungsdauer (Min.)">
              <InputNumber
                value={form.sessionDurationMinutes}
                onChange={(value) => setForm({ ...form, sessionDurationMinutes: value ?? 0 })}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Video-Link">
          <Input
            value={form.videoLink}
            onChange={e => setForm({ ...form, videoLink: e.target.value })}
            placeholder="https://..."
          />
        </Form.Item>

        <Form.Item label="Zeitplan">
          {form.schedule.map((rule, idx) => (
            <Space key={idx} style={{ marginBottom: 8 }}>
              <Select
                value={rule.dayOfWeek}
                onChange={(value) => updateScheduleRule(idx, { dayOfWeek: value })}
                options={[1, 2, 3, 4, 5, 6, 7].map(d => ({
                  value: d,
                  label: DAY_LABELS_LONG[d],
                }))}
              />
              <Select
                value={rule.frequency}
                onChange={(value) => updateScheduleRule(idx, { frequency: value })}
                options={[
                  { value: 'weekly', label: 'Wöchentlich' },
                  { value: 'biweekly', label: '2-wöchentlich' },
                ]}
              />
              <TimePicker
                format="HH:mm"
                minuteStep={5}
                value={rule.time ? dayjs(rule.time, 'HH:mm') : null}
                onChange={(d) => updateScheduleRule(idx, { time: d ? d.format('HH:mm') : '' })}
              />
              {form.schedule.length > 1 && (
                <Button type="text" icon={<DeleteOutlined />} onClick={() => removeScheduleRule(idx)} danger />
              )}
            </Space>
          ))}
          <Button type="link" size="small" icon={<PlusOutlined />} onClick={addScheduleRule}>
            Weiteren Termin hinzufügen
          </Button>
        </Form.Item>

        <Form.Item label="Notizen">
          <Input.TextArea
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            rows={2}
          />
        </Form.Item>

        <Space>
          <Button type="primary" htmlType="submit" disabled={!form.clientId}>
            Therapie anlegen
          </Button>
          {onCancel && (
            <Button onClick={onCancel}>
              Abbrechen
            </Button>
          )}
        </Space>
      </Space>
    </form>
  );
}
