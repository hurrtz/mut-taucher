import { useState, type FormEvent } from 'react';
import type { TherapyGroup, TherapyScheduleRule } from '../../lib/data';
import { DAY_LABELS_LONG } from '../constants';
import { format } from 'date-fns';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import { Button, Checkbox, Col, DatePicker, Form, Input, InputNumber, Row, Segmented, Select, Space, TimePicker } from 'antd';
import dayjs from 'dayjs';

type ScheduleMode = 'specific' | 'recurring';

export default function GroupForm({ initial, onSave, onCancel }: {
  initial?: TherapyGroup;
  onSave: (data: {
    label: string; maxParticipants: number; showOnHomepage: boolean;
    startDate?: string | null; endDate?: string | null;
    sessionCostCents?: number; sessionDurationMinutes?: number;
    videoLink?: string; notes?: string;
    schedule: TherapyScheduleRule[];
    nextAppointment?: { date: string; time: string };
  }) => void;
  onCancel?: () => void;
}) {
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>(
    initial?.schedule?.length ? 'recurring' : 'specific'
  );
  const [nextAppointment, setNextAppointment] = useState({ date: '', time: '16:30' });
  const [form, setForm] = useState({
    label: initial?.label ?? '',
    maxParticipants: initial?.maxParticipants ?? 7,
    showOnHomepage: initial?.showOnHomepage ?? false,
    startDate: initial?.startDate ?? format(new Date(), 'yyyy-MM-dd'),
    endDate: initial?.endDate ?? '',
    sessionCostCents: initial?.sessionCostCents ?? 9500,
    sessionDurationMinutes: initial?.sessionDurationMinutes ?? 90,
    videoLink: initial?.videoLink ?? '',
    notes: initial?.notes ?? '',
    schedule: initial?.schedule?.length ? initial.schedule : [{ dayOfWeek: 1, frequency: 'weekly' as 'weekly' | 'biweekly', time: '16:30' }],
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const data: Parameters<typeof onSave>[0] = {
      label: form.label,
      maxParticipants: form.maxParticipants,
      showOnHomepage: form.showOnHomepage,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      sessionCostCents: form.sessionCostCents,
      sessionDurationMinutes: form.sessionDurationMinutes,
      videoLink: form.videoLink || undefined,
      notes: form.notes || undefined,
      schedule: scheduleMode === 'recurring' ? form.schedule.filter(s => s.time) : [],
    };
    if (scheduleMode === 'specific' && nextAppointment.date && nextAppointment.time) {
      data.nextAppointment = nextAppointment;
    }
    onSave(data);
  };

  const addScheduleRule = () => {
    setForm(f => ({
      ...f,
      schedule: [...f.schedule, { dayOfWeek: 1, frequency: 'weekly' as 'weekly' | 'biweekly', time: '16:30' }],
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
        <Form.Item label="Bezeichnung">
          <Input
            value={form.label}
            onChange={e => setForm({ ...form, label: e.target.value })}
            placeholder="z.B. Emotionsregulation Frühjahr 2026"
            required
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Max. Teilnehmer">
              <InputNumber
                min={1}
                max={50}
                value={form.maxParticipants}
                onChange={val => setForm({ ...form, maxParticipants: val ?? 1 })}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Sitzungsdauer (Min.)">
              <InputNumber
                value={form.sessionDurationMinutes}
                onChange={val => setForm({ ...form, sessionDurationMinutes: val ?? 90 })}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Startdatum">
              <DatePicker
                value={form.startDate ? dayjs(form.startDate) : null}
                onChange={(_date, dateString) => setForm({ ...form, startDate: dateString as string })}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Enddatum (optional)">
              <DatePicker
                value={form.endDate ? dayjs(form.endDate) : null}
                onChange={(_date, dateString) => setForm({ ...form, endDate: dateString as string })}
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
                onChange={val => setForm({ ...form, sessionCostCents: val ?? 0 })}
                style={{ width: '100%' }}
              />
              <span style={{ fontSize: 12, color: '#9ca3af' }}>{(form.sessionCostCents / 100).toFixed(2)} €</span>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Video-Link">
              <Input
                value={form.videoLink}
                onChange={e => setForm({ ...form, videoLink: e.target.value })}
                placeholder="https://..."
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Terminplanung">
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Segmented
              value={scheduleMode}
              onChange={(value) => setScheduleMode(value as ScheduleMode)}
              options={[
                { value: 'specific', label: 'Nächster Termin' },
                { value: 'recurring', label: 'Wiederkehrend' },
              ]}
            />
            {scheduleMode === 'specific' ? (
              <Space>
                <DatePicker
                  value={nextAppointment.date ? dayjs(nextAppointment.date) : null}
                  onChange={(d) => setNextAppointment(a => ({ ...a, date: d ? d.format('YYYY-MM-DD') : '' }))}
                  placeholder="Datum"
                />
                <TimePicker
                  format="HH:mm"
                  minuteStep={5}
                  value={nextAppointment.time ? dayjs(nextAppointment.time, 'HH:mm') : null}
                  onChange={(d) => setNextAppointment(a => ({ ...a, time: d ? d.format('HH:mm') : '' }))}
                  placeholder="Uhrzeit"
                />
              </Space>
            ) : (
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                {form.schedule.map((rule, idx) => (
                  <Space key={idx}>
                    <Select
                      value={rule.dayOfWeek}
                      onChange={val => updateScheduleRule(idx, { dayOfWeek: val })}
                      style={{ width: 140 }}
                      options={[1, 2, 3, 4, 5, 6, 7].map(d => ({ value: d, label: DAY_LABELS_LONG[d] }))}
                    />
                    <Select
                      value={rule.frequency}
                      onChange={val => updateScheduleRule(idx, { frequency: val })}
                      style={{ width: 150 }}
                      options={[
                        { value: 'weekly', label: 'Wöchentlich' },
                        { value: 'biweekly', label: '2-wöchentlich' },
                      ]}
                    />
                    <TimePicker
                      value={rule.time ? dayjs(rule.time, 'HH:mm') : null}
                      onChange={(_time, timeString) => updateScheduleRule(idx, { time: timeString as string })}
                      format="HH:mm"
                      minuteStep={5}
                    />
                    {form.schedule.length > 1 && (
                      <Button
                        type="text"
                        icon={<CloseOutlined />}
                        size="small"
                        onClick={() => removeScheduleRule(idx)}
                      />
                    )}
                  </Space>
                ))}
                <Button type="link" size="small" icon={<PlusOutlined />} onClick={addScheduleRule}>
                  Weiteren Termin hinzufügen
                </Button>
              </Space>
            )}
          </Space>
        </Form.Item>

        <Checkbox
          checked={form.showOnHomepage}
          onChange={e => setForm({ ...form, showOnHomepage: e.target.checked })}
        >
          Auf Homepage anzeigen
        </Checkbox>

        <Form.Item label="Notizen">
          <Input.TextArea
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            rows={2}
          />
        </Form.Item>

        <Space>
          <Button type="primary" htmlType="submit" style={{ flex: 1 }}>
            {initial ? 'Speichern' : 'Gruppe anlegen'}
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
