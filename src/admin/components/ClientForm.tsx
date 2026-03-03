import { useState, type FormEvent } from 'react';
import { Button, Col, Form, Input, Row, Select, Space } from 'antd';
import type { Client } from '../../lib/data';

export default function ClientForm({ initial, onSave, onCancel }: {
  initial?: Client;
  onSave: (data: { title?: string; firstName: string; lastName: string; suffix?: string; email: string; phone?: string; street?: string; zip?: string; city?: string; country?: string; notes?: string; status?: 'active' | 'archived' }) => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<{
    title: string; firstName: string; lastName: string; suffix: string; email: string; phone: string; street: string; zip: string; city: string; country: string; notes: string; status: 'active' | 'archived';
  }>({
    title: initial?.title ?? '',
    firstName: initial?.firstName ?? '',
    lastName: initial?.lastName ?? '',
    suffix: initial?.suffix ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    street: initial?.street ?? '',
    zip: initial?.zip ?? '',
    city: initial?.city ?? '',
    country: initial?.country ?? 'Deutschland',
    notes: initial?.notes ?? '',
    status: initial?.status ?? 'active',
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave({
      title: form.title || undefined,
      firstName: form.firstName,
      lastName: form.lastName,
      suffix: form.suffix || undefined,
      email: form.email,
      phone: form.phone || undefined,
      street: form.street || undefined,
      zip: form.zip || undefined,
      city: form.city || undefined,
      country: form.country || undefined,
      notes: form.notes || undefined,
      status: form.status,
    });
    if (!initial) setForm({ title: '', firstName: '', lastName: '', suffix: '', email: '', phone: '', street: '', zip: '', city: '', country: 'Deutschland', notes: '', status: 'active' });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item label="Anrede">
              <Select
                value={form.title || undefined}
                onChange={value => setForm({ ...form, title: value ?? '' })}
                allowClear
                placeholder="–"
                options={[
                  { value: 'Herr', label: 'Herr' },
                  { value: 'Frau', label: 'Frau' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Vorname" required>
              <Input
                value={form.firstName}
                onChange={e => setForm({ ...form, firstName: e.target.value })}
                required
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Nachname" required>
              <Input
                value={form.lastName}
                onChange={e => setForm({ ...form, lastName: e.target.value })}
                required
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Suffix">
              <Input
                value={form.suffix}
                onChange={e => setForm({ ...form, suffix: e.target.value })}
                placeholder="z.B. M.A."
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="E-Mail" required>
          <Input
            type="email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required
          />
        </Form.Item>
        <Form.Item label="Telefon">
          <Input
            type="tel"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
          />
        </Form.Item>
        <Form.Item label="Straße">
          <Input
            value={form.street}
            onChange={e => setForm({ ...form, street: e.target.value })}
          />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="PLZ">
              <Input
                value={form.zip}
                onChange={e => setForm({ ...form, zip: e.target.value })}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Ort">
              <Input
                value={form.city}
                onChange={e => setForm({ ...form, city: e.target.value })}
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="Land">
          <Input
            value={form.country}
            onChange={e => setForm({ ...form, country: e.target.value })}
          />
        </Form.Item>
        <Form.Item label="Notizen">
          <Input.TextArea
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            rows={3}
          />
        </Form.Item>
        {initial && (
          <Form.Item label="Status">
            <Select
              value={form.status}
              onChange={value => setForm({ ...form, status: value })}
              options={[
                { value: 'active', label: 'Aktiv' },
                { value: 'archived', label: 'Archiviert' },
              ]}
            />
          </Form.Item>
        )}
        <Space>
          <Button type="primary" htmlType="submit">
            {initial ? 'Speichern' : 'Klient:in anlegen'}
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
