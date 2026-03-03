import { useState } from 'react';
import { Modal, Checkbox, Button, Tag, Typography, Space, message } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import type { CancelledItem } from '../../lib/useAdminBooking';
import { CATEGORY_COLORS } from '../constants';

const { Text } = Typography;

const TYPE_LABELS: Record<string, string> = {
  erstgespraech: 'Erstgespräch',
  einzeltherapie: 'Einzeltherapie',
  gruppentherapie: 'Gruppentherapie',
};

export default function CancellationModal({
  items,
  open,
  onClose,
  onSendEmails,
}: {
  items: CancelledItem[];
  open: boolean;
  onClose: () => void;
  onSendEmails: (selected: CancelledItem[]) => Promise<{ type: string; success: boolean }[]>;
}) {
  const [selected, setSelected] = useState<Set<number>>(() => new Set(items.map((_, i) => i)));
  const [sending, setSending] = useState(false);

  const toggleItem = (index: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((_, i) => i)));
    }
  };

  const handleSend = async () => {
    const selectedItems = items.filter((_, i) => selected.has(i));
    if (selectedItems.length === 0) return;
    setSending(true);
    try {
      const results = await onSendEmails(selectedItems);
      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;
      if (failCount === 0) {
        message.success(`${successCount} Absage-E-Mail(s) gesendet`);
      } else {
        message.warning(`${successCount} gesendet, ${failCount} fehlgeschlagen`);
      }
      onClose();
    } finally {
      setSending(false);
    }
  };

  // Check if any item has an email recipient
  const hasEmailRecipients = items.some(item =>
    item.clientEmail || (item.participants && item.participants.length > 0)
  );

  return (
    <Modal
      title="Absagen verwalten"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Schließen
        </Button>,
        hasEmailRecipients && (
          <Button
            key="send"
            type="primary"
            icon={<SendOutlined />}
            loading={sending}
            disabled={selected.size === 0}
            onClick={handleSend}
          >
            Absagen senden ({selected.size})
          </Button>
        ),
      ].filter(Boolean)}
      width={600}
    >
      {items.length === 0 ? (
        <Text type="secondary">Keine Absagen vorhanden.</Text>
      ) : (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Checkbox
            checked={selected.size === items.length}
            indeterminate={selected.size > 0 && selected.size < items.length}
            onChange={toggleAll}
          >
            Alle auswählen
          </Checkbox>

          {items.map((item, i) => {
            const recipientName = item.clientName
              || (item.participants && item.participants.length > 0
                ? `${item.participants.length} Teilnehmer:innen`
                : '—');
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  background: '#fafafa',
                  borderRadius: 8,
                }}
              >
                <Checkbox
                  checked={selected.has(i)}
                  onChange={() => toggleItem(i)}
                />
                <Tag color={CATEGORY_COLORS[item.type as keyof typeof CATEGORY_COLORS]} style={{ margin: 0 }}>
                  {TYPE_LABELS[item.type] ?? item.type}
                </Tag>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text strong style={{ fontSize: 13 }}>{item.label || recipientName}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {item.date} · {item.time} Uhr · {recipientName}
                  </Text>
                </div>
              </div>
            );
          })}
        </Space>
      )}
    </Modal>
  );
}
