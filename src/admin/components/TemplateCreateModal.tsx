import { useState, type FormEvent } from 'react';
import { Modal, Button, Input, AutoComplete, Form, message } from 'antd';

export default function TemplateCreateModal({
  open,
  onClose,
  onCreate,
  existingGroups,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (key: string, label: string, groupName?: string) => Promise<unknown>;
  existingGroups: string[];
}) {
  const [label, setLabel] = useState('');
  const [key, setKey] = useState('');
  const [keyTouched, setKeyTouched] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);

  const generateKey = (text: string) =>
    text
      .toLowerCase()
      .replace(/[äÄ]/g, 'ae')
      .replace(/[öÖ]/g, 'oe')
      .replace(/[üÜ]/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');

  const handleLabelChange = (value: string) => {
    setLabel(value);
    if (!keyTouched) {
      setKey(generateKey(value));
    }
  };

  const keyValid = /^[a-z_]+$/.test(key);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !key || !keyValid) return;
    setLoading(true);
    try {
      await onCreate(key, label.trim(), groupName.trim() || undefined);
      message.success('Vorlage erstellt');
      setLabel('');
      setKey('');
      setKeyTouched(false);
      setGroupName('');
      onClose();
    } catch {
      // error handled by hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Neue Vorlage erstellen"
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <form onSubmit={handleSubmit}>
        <Form.Item label="Bezeichnung" required>
          <Input
            value={label}
            onChange={e => handleLabelChange(e.target.value)}
            placeholder="z.B. Rechnung Gruppentherapie"
            required
          />
        </Form.Item>
        <Form.Item
          label="Schlüssel"
          required
          validateStatus={key && !keyValid ? 'error' : undefined}
          help={key && !keyValid ? 'Nur Kleinbuchstaben und Unterstriche erlaubt' : undefined}
        >
          <Input
            value={key}
            onChange={e => { setKey(e.target.value); setKeyTouched(true); }}
            placeholder="z.B. rechnung_gruppe"
            required
          />
        </Form.Item>
        <Form.Item label="Gruppe">
          <AutoComplete
            value={groupName}
            onChange={setGroupName}
            options={existingGroups.map(g => ({ value: g }))}
            placeholder="z.B. Rechnungen"
            style={{ width: '100%' }}
          />
        </Form.Item>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onClose}>Abbrechen</Button>
          <Button type="primary" htmlType="submit" loading={loading} disabled={!label.trim() || !key || !keyValid}>
            Erstellen
          </Button>
        </div>
      </form>
    </Modal>
  );
}
