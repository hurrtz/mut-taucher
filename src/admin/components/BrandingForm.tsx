import { useState, useEffect, useRef } from 'react';
import { Form, Input, Select, InputNumber, Button, Space, Alert, Card, Typography, Image } from 'antd';
import { UploadOutlined, SaveOutlined } from '@ant-design/icons';
import { ColorPicker } from 'antd';
import type { BrandSettings } from '../../lib/useAdminBranding';
import { getToken } from '../../lib/api';

interface BrandingFormProps {
  settings: BrandSettings | null;
  saving: boolean;
  error: string | null;
  onUpdate: (updates: Partial<BrandSettings>) => Promise<void>;
  onUploadLogo: (file: File) => Promise<void>;
}

const fontOptions = [
  { value: 'helvetica', label: 'Helvetica' },
  { value: 'times', label: 'Times' },
  { value: 'courier', label: 'Courier' },
  { value: 'dejavusans', label: 'DejaVu Sans' },
];

export default function BrandingForm({ settings, saving, error, onUpdate, onUploadLogo }: BrandingFormProps) {
  const [practiceName, setPracticeName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#2dd4bf');
  const [secondaryColor, setSecondaryColor] = useState('#94a3b8');
  const [fontFamily, setFontFamily] = useState('helvetica');
  const [fontSizeBody, setFontSizeBody] = useState(11);
  const [fontSizeHeading, setFontSizeHeading] = useState(16);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      setPracticeName(settings.practiceName);
      setSubtitle(settings.subtitle);
      setPrimaryColor(settings.primaryColor);
      setSecondaryColor(settings.secondaryColor);
      setFontFamily(settings.fontFamily);
      setFontSizeBody(settings.fontSizeBody);
      setFontSizeHeading(settings.fontSizeHeading);
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await onUpdate({
        practiceName,
        subtitle,
        primaryColor,
        secondaryColor,
        fontFamily,
        fontSizeBody,
        fontSizeHeading,
      });
    } catch {
      // error handled by parent
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await onUploadLogo(file);
    } catch {
      // error handled by parent
    }
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  if (!settings) return null;

  return (
    <div style={{ maxWidth: 640 }}>
      {error && <Alert message={error} type="error" showIcon closable style={{ marginBottom: 16 }} />}

      <Card title="Logo" size="small" style={{ marginBottom: 16 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {settings.logoUrl && (
            <Image
              src={`${settings.logoUrl}&token=${getToken()}`}
              alt="Logo"
              width={120}
              style={{ objectFit: 'contain', background: '#f5f5f5', borderRadius: 4, padding: 8 }}
              preview={false}
            />
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml"
            style={{ display: 'none' }}
            onChange={handleLogoUpload}
          />
          <Button
            icon={<UploadOutlined />}
            loading={saving}
            onClick={() => fileInputRef.current?.click()}
          >
            Logo hochladen
          </Button>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            PNG, JPG oder SVG, max. 2 MB
          </Typography.Text>
        </Space>
      </Card>

      <Card title="Allgemein" size="small" style={{ marginBottom: 16 }}>
        <Form layout="vertical">
          <Form.Item label="Praxisname">
            <Input
              value={practiceName}
              onChange={(e) => setPracticeName(e.target.value)}
            />
          </Form.Item>
          <Form.Item label="Untertitel" help="Erscheint unter dem Praxisnamen im PDF-Header. Leer lassen zum Ausblenden.">
            <Input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="z.B. Praxis für Psychotherapie"
            />
          </Form.Item>
        </Form>
      </Card>

      <Card title="Farben" size="small" style={{ marginBottom: 16 }}>
        <Form layout="vertical">
          <Space size="large">
            <Form.Item label="Primärfarbe" help="Überschriften, Akzentlinie, Tabellenköpfe">
              <ColorPicker
                value={primaryColor}
                onChange={(color) => setPrimaryColor(color.toHexString())}
                showText
              />
            </Form.Item>
            <Form.Item label="Sekundärfarbe" help="Untertitel-Text">
              <ColorPicker
                value={secondaryColor}
                onChange={(color) => setSecondaryColor(color.toHexString())}
                showText
              />
            </Form.Item>
          </Space>
        </Form>
      </Card>

      <Card title="Schrift" size="small" style={{ marginBottom: 16 }}>
        <Form layout="vertical">
          <Form.Item label="Schriftart">
            <Select
              value={fontFamily}
              onChange={setFontFamily}
              options={fontOptions}
              style={{ width: 200 }}
            />
          </Form.Item>
          <Space size="large">
            <Form.Item label="Fließtext (pt)">
              <InputNumber
                value={fontSizeBody}
                onChange={(v) => setFontSizeBody(v ?? 11)}
                min={8}
                max={20}
              />
            </Form.Item>
            <Form.Item label="Überschriften (pt)">
              <InputNumber
                value={fontSizeHeading}
                onChange={(v) => setFontSizeHeading(v ?? 16)}
                min={10}
                max={28}
              />
            </Form.Item>
          </Space>
        </Form>
      </Card>

      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={handleSave}
          size="large"
        >
          Speichern
        </Button>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Änderungen werden bei der nächsten PDF-Erstellung wirksam.
        </Typography.Text>
      </Space>
    </div>
  );
}
