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
  onUploadLogo: (file: File, variant?: 'default' | 'long' | 'tall') => Promise<void>;
}

const fontOptions = [
  { value: 'helvetica', label: 'Helvetica' },
  { value: 'times', label: 'Times' },
  { value: 'courier', label: 'Courier' },
  { value: 'dejavusans', label: 'DejaVu Sans' },
];

function LogoTabContent({
  logoUrl,
  description,
  saving,
  inputRef,
  onUpload,
}: {
  logoUrl: string | null;
  description: string;
  saving: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {logoUrl ? (
        <Image
          src={`${logoUrl}&token=${getToken()}`}
          alt="Logo"
          width={120}
          style={{ objectFit: 'contain', background: '#f5f5f5', borderRadius: 4, padding: 8 }}
          preview={false}
        />
      ) : (
        <Typography.Text type="secondary" style={{ fontStyle: 'italic' }}>
          Noch kein Logo hochgeladen
        </Typography.Text>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        style={{ display: 'none' }}
        onChange={onUpload}
      />
      <Button
        icon={<UploadOutlined />}
        loading={saving}
        onClick={() => inputRef.current?.click()}
      >
        Logo hochladen
      </Button>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {description} PNG, JPG oder SVG, max. 2 MB
      </Typography.Text>
    </Space>
  );
}

export default function BrandingForm({ settings, saving, error, onUpdate, onUploadLogo }: BrandingFormProps) {
  const [practiceName, setPracticeName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#2dd4bf');
  const [secondaryColor, setSecondaryColor] = useState('#94a3b8');
  const [fontFamily, setFontFamily] = useState('helvetica');
  const [fontSizeBody, setFontSizeBody] = useState(11);
  const [fontSizeHeading, setFontSizeHeading] = useState(16);
  const [logoTab, setLogoTab] = useState('default');
  const fileInputDefaultRef = useRef<HTMLInputElement>(null);
  const fileInputLongRef = useRef<HTMLInputElement>(null);
  const fileInputTallRef = useRef<HTMLInputElement>(null);

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

  const handleLogoUpload = (variant: 'default' | 'long' | 'tall') => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await onUploadLogo(file, variant);
    } catch {
      // error handled by parent
    }
    e.target.value = '';
  };

  if (!settings) return null;

  return (
    <div style={{ maxWidth: 640 }}>
      {error && <Alert message={error} type="error" showIcon closable style={{ marginBottom: 16 }} />}

      <Card
        title="Logo"
        size="small"
        style={{ marginBottom: 16 }}
        tabList={[
          { key: 'default', tab: 'Klein' },
          { key: 'long', tab: 'Lang' },
          { key: 'tall', tab: 'Hoch' },
        ]}
        activeTabKey={logoTab}
        onTabChange={setLogoTab}
        className="logo-tabs-card"
      >
          {logoTab === 'default' && (
            <LogoTabContent
              logoUrl={settings.logoUrl}
              description="Wird in PDFs und Dokumenten verwendet."
              saving={saving}
              inputRef={fileInputDefaultRef}
              onUpload={handleLogoUpload('default')}
            />
          )}
          {logoTab === 'long' && (
            <LogoTabContent
              logoUrl={settings.logoLongUrl}
              description="Wird im Header der Website verwendet (breit)."
              saving={saving}
              inputRef={fileInputLongRef}
              onUpload={handleLogoUpload('long')}
            />
          )}
          {logoTab === 'tall' && (
            <LogoTabContent
              logoUrl={settings.logoTallUrl}
              description="Wird im Header von E-Mails verwendet (hoch)."
              saving={saving}
              inputRef={fileInputTallRef}
              onUpload={handleLogoUpload('tall')}
            />
          )}
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
