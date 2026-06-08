import { useState } from 'react';
import { Card, Form, Input, Button, Typography, Alert } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { useAdminStyles } from '../styles';
import { apiFetch, ApiError } from '../../lib/api';

interface EmailForm {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
}

export default function EmailTab() {
  const styles = useAdminStyles();
  const [form] = Form.useForm<EmailForm>();
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (values: EmailForm) => {
    setSending(true);
    setSuccess(null);
    setError(null);
    try {
      await apiFetch('/admin/email', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      setSuccess('E-Mail wurde gesendet.');
      form.resetFields();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'E-Mail konnte nicht gesendet werden.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={styles.pageContent}>
      <div style={styles.headerRow}>
        <Typography.Title style={{ margin: 0 }}>E-Mail</Typography.Title>
      </div>

      {success && <Alert message={success} type="success" showIcon closable onClose={() => setSuccess(null)} style={{ marginBottom: styles.token.marginMD }} />}
      {error && <Alert message={error} type="error" showIcon closable onClose={() => setError(null)} style={{ marginBottom: styles.token.marginMD }} />}

      <Card style={{ maxWidth: 720 }}>
        <Form form={form} layout="vertical" onFinish={handleSend} requiredMark={false}>
          <Form.Item
            label="An"
            name="to"
            rules={[{ required: true, message: 'Mindestens ein Empfänger ist erforderlich' }]}
            extra="Mehrere Adressen mit Komma trennen"
          >
            <Input placeholder="empfaenger@beispiel.de" autoComplete="off" />
          </Form.Item>

          <Form.Item label="Cc" name="cc">
            <Input placeholder="optional" autoComplete="off" />
          </Form.Item>

          <Form.Item label="Bcc" name="bcc">
            <Input placeholder="optional" autoComplete="off" />
          </Form.Item>

          <Form.Item
            label="Betreff"
            name="subject"
            rules={[{ required: true, message: 'Betreff ist erforderlich' }]}
          >
            <Input autoComplete="off" />
          </Form.Item>

          <Form.Item
            label="Nachricht"
            name="body"
            rules={[{ required: true, message: 'Nachricht ist erforderlich' }]}
          >
            <Input.TextArea rows={12} placeholder="Text der E-Mail …" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={sending}>
              Senden
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
