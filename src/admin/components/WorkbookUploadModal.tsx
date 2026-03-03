import { useState, type FormEvent } from 'react';
import { Modal, Button, Input, AutoComplete, Form, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

export default function WorkbookUploadModal({
  open,
  onClose,
  onUpload,
  existingGroups,
}: {
  open: boolean;
  onClose: () => void;
  onUpload: (file: File, name: string, groupName?: string) => Promise<unknown>;
  existingGroups: string[];
}) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file || !name.trim()) return;
    setLoading(true);
    try {
      await onUpload(file, name.trim(), groupName.trim() || undefined);
      message.success('Material hochgeladen');
      setFile(null);
      setName('');
      setGroupName('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Neues Dokument hochladen"
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <form onSubmit={handleSubmit}>
        <Form.Item label="Datei" required>
          <Upload
            accept=".pdf,.jpg,.jpeg,.png"
            maxCount={1}
            beforeUpload={(f) => { setFile(f); return false; }}
            onRemove={() => setFile(null)}
            fileList={file ? [{ uid: '-1', name: file.name, status: 'done' }] : []}
          >
            <Button icon={<UploadOutlined />}>Datei auswählen</Button>
          </Upload>
        </Form.Item>
        <Form.Item label="Name" required>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="z.B. Achtsamkeitsübung"
            required
          />
        </Form.Item>
        <Form.Item label="Gruppe">
          <AutoComplete
            value={groupName}
            onChange={setGroupName}
            options={existingGroups.map(g => ({ value: g }))}
            placeholder="z.B. Emotionsregulation"
            style={{ width: '100%' }}
          />
        </Form.Item>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onClose}>Abbrechen</Button>
          <Button type="primary" htmlType="submit" loading={loading} disabled={!file || !name.trim()}>
            Hochladen
          </Button>
        </div>
      </form>
    </Modal>
  );
}
