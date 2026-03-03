import { useState, useMemo } from 'react';
import { Modal, Button, Checkbox, Typography, message, Space } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import type { Therapy, TherapyGroup, Client } from '../../lib/data';

const { Text } = Typography;

export default function WorkbookShareModal({
  open,
  onClose,
  materialName,
  onSend,
  therapies,
  groups,
  clients,
}: {
  open: boolean;
  onClose: () => void;
  materialName: string;
  onSend: (clientIds: number[]) => Promise<{ clientId: number; success: boolean; error?: string }[] | null>;
  therapies: Therapy[];
  groups: TherapyGroup[];
  clients: Client[];
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [sending, setSending] = useState(false);

  // Compute active recipients: clients with active therapy or active group participation
  const recipients = useMemo(() => {
    const activeClientIds = new Set<number>();

    // Clients in non-archived therapies
    for (const t of therapies) {
      if (t.status !== 'archived') {
        activeClientIds.add(t.clientId);
      }
    }

    // Active participants in non-archived groups
    for (const g of groups) {
      if (g.status !== 'archived' && g.participants) {
        for (const p of g.participants) {
          if (p.status === 'active') {
            activeClientIds.add(p.clientId);
          }
        }
      }
    }

    return clients
      .filter(c => activeClientIds.has(c.id))
      .sort((a, b) => a.name.localeCompare(b.name, 'de'));
  }, [therapies, groups, clients]);

  const toggleAll = () => {
    if (selected.size === recipients.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(recipients.map(r => r.id)));
    }
  };

  const toggle = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSend = async () => {
    if (selected.size === 0) return;
    setSending(true);
    try {
      const results = await onSend(Array.from(selected));
      if (results) {
        const ok = results.filter(r => r.success).length;
        const fail = results.filter(r => !r.success).length;
        if (fail === 0) {
          message.success(`An ${ok} Empfänger:in(nen) gesendet`);
        } else {
          message.warning(`${ok} gesendet, ${fail} fehlgeschlagen`);
        }
        onClose();
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      title={`"${materialName}" versenden`}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>Abbrechen</Button>,
        <Button
          key="send"
          type="primary"
          icon={<SendOutlined />}
          loading={sending}
          disabled={selected.size === 0}
          onClick={handleSend}
        >
          Senden ({selected.size})
        </Button>,
      ]}
      destroyOnClose
    >
      {recipients.length === 0 ? (
        <Text type="secondary">Keine aktiven Patient:innen gefunden.</Text>
      ) : (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Checkbox
            checked={selected.size === recipients.length}
            indeterminate={selected.size > 0 && selected.size < recipients.length}
            onChange={toggleAll}
          >
            <Text strong>Alle auswählen</Text>
          </Checkbox>
          <div style={{ maxHeight: 300, overflowY: 'auto', paddingLeft: 8 }}>
            {recipients.map(r => (
              <div key={r.id} style={{ padding: '4px 0' }}>
                <Checkbox checked={selected.has(r.id)} onChange={() => toggle(r.id)}>
                  {r.name} <Text type="secondary">({r.email})</Text>
                </Checkbox>
              </div>
            ))}
          </div>
        </Space>
      )}
    </Modal>
  );
}
