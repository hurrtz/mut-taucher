import { useState, type FormEvent } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import {
  Button,
  Checkbox,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Space,
  TimePicker,
} from 'antd';
import type { RecurringRule, DayConfig } from '../../lib/data';
import { DAY_LABELS, DURATION_OPTIONS } from '../constants';

export interface RuleFormData {
  label: string;
  time: string;
  durationMinutes: number;
  customDuration: string;
  days: Record<number, { enabled: boolean; frequency: 'weekly' | 'biweekly' }>;
  startDate: string;
  endDate: string;
  indefinite: boolean;
}

import { format } from 'date-fns';

export const emptyForm = (): RuleFormData => ({
  label: '',
  time: '10:00',
  durationMinutes: 50,
  customDuration: '',
  days: Object.fromEntries(
    [1, 2, 3, 4, 5, 6, 7].map(d => [d, { enabled: false, frequency: 'weekly' as const }])
  ),
  startDate: format(new Date(), 'yyyy-MM-dd'),
  endDate: '',
  indefinite: true,
});

export function ruleToForm(rule: RecurringRule): RuleFormData {
  const days: RuleFormData['days'] = {};
  for (let d = 1; d <= 7; d++) {
    const match = rule.days.find(dc => dc.dayOfWeek === d);
    days[d] = { enabled: !!match, frequency: match?.frequency ?? 'weekly' };
  }
  const isPreset = DURATION_OPTIONS.some(o => o.value === rule.durationMinutes);
  return {
    label: rule.label,
    time: rule.time,
    durationMinutes: isPreset ? rule.durationMinutes : 0,
    customDuration: isPreset ? '' : String(rule.durationMinutes),
    days,
    startDate: rule.startDate,
    endDate: rule.endDate ?? '',
    indefinite: !rule.endDate,
  };
}

export function formToDayConfigs(days: RuleFormData['days']): DayConfig[] {
  return Object.entries(days)
    .filter(([, v]) => v.enabled)
    .map(([k, v]) => ({ dayOfWeek: Number(k), frequency: v.frequency }));
}

export default function RuleForm({ initial, onSave, onCancel }: {
  initial?: RecurringRule;
  onSave: (data: Omit<RecurringRule, 'id' | 'exceptions'>) => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<RuleFormData>(initial ? ruleToForm(initial) : emptyForm());

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const dayConfigs = formToDayConfigs(form.days);
    if (dayConfigs.length === 0) return;

    const duration = form.durationMinutes === 0 ? Number(form.customDuration) || 50 : form.durationMinutes;
    onSave({
      label: form.label || dayConfigs.map(d => DAY_LABELS[d.dayOfWeek]).join(', '),
      time: form.time,
      durationMinutes: duration,
      days: dayConfigs,
      startDate: form.startDate,
      endDate: form.indefinite ? null : (form.endDate || null),
    });
    if (!initial) setForm(emptyForm());
  };

  const toggleDay = (day: number) => {
    setForm(f => ({
      ...f,
      days: { ...f.days, [day]: { ...f.days[day], enabled: !f.days[day].enabled } },
    }));
  };

  const setFrequency = (day: number, freq: 'weekly' | 'biweekly') => {
    setForm(f => ({
      ...f,
      days: { ...f.days, [day]: { ...f.days[day], frequency: freq } },
    }));
  };

  const selectedDayCount = Object.values(form.days).filter(d => d.enabled).length;

  return (
    <form onSubmit={handleSubmit}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>

        {/* Bezeichnung */}
        <Form.Item label="Bezeichnung (optional)" colon={false}>
          <Input
            value={form.label}
            onChange={e => setForm({ ...form, label: e.target.value })}
            placeholder="z.B. Montags Vormittag"
          />
        </Form.Item>

        {/* Tage */}
        <Form.Item label="Tage" colon={false}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {[1, 2, 3, 4, 5, 6, 7].map(day => (
              <Space key={day} size="small" align="center">
                <Button
                  type={form.days[day].enabled ? 'primary' : 'default'}
                  onClick={() => toggleDay(day)}
                  style={{ width: 40, padding: 0 }}
                >
                  {DAY_LABELS[day]}
                </Button>
                {form.days[day].enabled && (
                  <Select
                    value={form.days[day].frequency}
                    onChange={(val: 'weekly' | 'biweekly') => setFrequency(day, val)}
                    style={{ width: 160 }}
                    options={[
                      { value: 'weekly', label: 'Jede Woche' },
                      { value: 'biweekly', label: 'Jede 2. Woche' },
                    ]}
                  />
                )}
              </Space>
            ))}
          </Space>
        </Form.Item>

        {/* Uhrzeit */}
        <Form.Item label="Uhrzeit" colon={false}>
          <TimePicker
            format="HH:mm"
            value={form.time ? dayjs(form.time, 'HH:mm') : null}
            onChange={(val: Dayjs | null) => setForm({ ...form, time: val ? val.format('HH:mm') : '' })}
            minuteStep={5}
            style={{ width: '100%' }}
          />
        </Form.Item>

        {/* Dauer */}
        <Form.Item label="Dauer" colon={false}>
          <Space direction="vertical" size="small">
            <Radio.Group
              value={form.durationMinutes}
              onChange={e => setForm({ ...form, durationMinutes: e.target.value })}
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
                value={form.customDuration ? Number(form.customDuration) : undefined}
                onChange={val => setForm({ ...form, customDuration: val != null ? String(val) : '' })}
                placeholder="Minuten"
                style={{ width: 120 }}
              />
            )}
          </Space>
        </Form.Item>

        {/* Datum */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Startdatum" colon={false}>
              <DatePicker
                format="YYYY-MM-DD"
                value={form.startDate ? dayjs(form.startDate, 'YYYY-MM-DD') : null}
                onChange={(val: Dayjs | null) => setForm({ ...form, startDate: val ? val.format('YYYY-MM-DD') : '' })}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Enddatum" colon={false}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Checkbox
                  checked={form.indefinite}
                  onChange={e => setForm({ ...form, indefinite: e.target.checked })}
                >
                  Unbegrenzt
                </Checkbox>
                {!form.indefinite && (
                  <DatePicker
                    format="YYYY-MM-DD"
                    value={form.endDate ? dayjs(form.endDate, 'YYYY-MM-DD') : null}
                    onChange={(val: Dayjs | null) => setForm({ ...form, endDate: val ? val.format('YYYY-MM-DD') : '' })}
                    style={{ width: '100%' }}
                  />
                )}
              </Space>
            </Form.Item>
          </Col>
        </Row>

        {/* Actions */}
        <Space>
          <Button
            type="primary"
            htmlType="submit"
            disabled={selectedDayCount === 0}
            style={{ flex: 1 }}
          >
            {initial ? 'Speichern' : 'Regel anlegen'}
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
