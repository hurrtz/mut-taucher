import { useState } from 'react';
import type { Client } from '../../lib/data';
import DocumentChecklist from './DocumentChecklist';
import { Link } from 'react-router-dom';
import { PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined, HistoryOutlined } from '@ant-design/icons';
import { Card, Button, Tag, Space, Typography, Modal, Collapse } from 'antd';

export default function ClientList({ clients, onEdit, onDelete, onNewTherapy }: {
  clients: Client[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onNewTherapy: (clientId: number) => void;
}) {
  const [expandedDocId, setExpandedDocId] = useState<number | null>(null);

  if (clients.length === 0) {
    return (
      <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>
        Noch keine Klient:innen angelegt.
      </Typography.Text>
    );
  }

  return (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      {clients.map(c => (
        <Card key={c.id} size="small">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 600, color: 'rgba(0,0,0,0.88)' }}>{c.lastName}, {c.firstName}</span>
                {c.status === 'archived' && (
                  <Tag>Archiviert</Tag>
                )}
              </div>
              <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.65)' }}>{c.email}</div>
              {c.phone && <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)' }}>{c.phone}</div>}
              <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(0,0,0,0.35)' }}>
                {c.therapyCount > 0 && <>{c.therapyCount} Einzeltherapie{c.therapyCount !== 1 ? 'n' : ''}</>}
                {c.therapyCount > 0 && c.groupCount > 0 && ' · '}
                {c.groupCount > 0 && <>{c.groupCount} Gruppe{c.groupCount !== 1 ? 'n' : ''}</>}
                {c.therapyCount === 0 && c.groupCount === 0 && 'Keine Therapien'}
                {c.bookingId && ' · aus Erstgespräch'}
              </div>
            </div>
            <Space size={0} style={{ flexShrink: 0 }}>
              <Link to={`/admin/client/${c.id}`} title="Verlauf">
                <Button type="text" icon={<HistoryOutlined />} />
              </Link>
              <Button
                type="text"
                icon={<PlusOutlined />}
                onClick={() => onNewTherapy(c.id)}
                title="Neue Therapie"
              />
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => onEdit(c.id)}
                title="Bearbeiten"
              />
              <Button
                type="text"
                icon={<DeleteOutlined />}
                onClick={() => {
                  Modal.confirm({
                    title: `Klient:in "${c.firstName} ${c.lastName}" wirklich löschen?`,
                    okText: 'Löschen',
                    cancelText: 'Abbrechen',
                    okType: 'danger',
                    onOk: () => onDelete(c.id),
                  });
                }}
                title="Löschen"
              />
            </Space>
          </div>
          {c.notes && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(0,0,0,0.45)', background: '#fafafa', borderRadius: 4, padding: 8 }}>
              {c.notes}
            </div>
          )}
          <Collapse
            ghost
            activeKey={expandedDocId === c.id ? [`doc-${c.id}`] : []}
            onChange={() => setExpandedDocId(expandedDocId === c.id ? null : c.id)}
            style={{ marginTop: 8 }}
            items={[
              {
                key: `doc-${c.id}`,
                label: (
                  <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                    <FileTextOutlined style={{ marginRight: 4 }} />
                    Dokumente
                  </span>
                ),
                children: (
                  <DocumentChecklist contextType="client" contextId={c.id} />
                ),
              },
            ]}
          />
        </Card>
      ))}
    </Space>
  );
}
