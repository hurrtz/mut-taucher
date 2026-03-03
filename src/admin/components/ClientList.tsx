import type { Client } from '../../lib/data';
import { DocumentCollapse } from './DocumentChecklist';
import { Link } from 'react-router-dom';
import { PlusOutlined, EditOutlined, DeleteOutlined, HistoryOutlined } from '@ant-design/icons';
import { Card, Button, Tag, Space, Typography, Modal } from 'antd';

export default function ClientList({ clients, onEdit, onDelete, onNewTherapy }: {
  clients: Client[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onNewTherapy: (clientId: number) => void;
}) {


  if (clients.length === 0) {
    return (
      <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>
        Noch keine Patient:innen angelegt.
      </Typography.Text>
    );
  }

  return (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      {clients.map(c => (
        <Card
          key={c.id}
          size="small"
          title={
            <Space>
              <span>{c.lastName}, {c.firstName}</span>
              {c.status === 'archived' && <Tag>Archiviert</Tag>}
            </Space>
          }
          extra={
            <Space size={0}>
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
                    title: `Patient:in "${c.firstName} ${c.lastName}" wirklich löschen?`,
                    okText: 'Löschen',
                    cancelText: 'Abbrechen',
                    okType: 'danger',
                    onOk: () => onDelete(c.id),
                  });
                }}
                title="Löschen"
              />
            </Space>
          }
        >
          <div style={{ fontSize: 13 }}>
            <div style={{ color: 'rgba(0,0,0,0.65)' }}>{c.email}</div>
            {c.phone && <div style={{ color: 'rgba(0,0,0,0.45)' }}>{c.phone}</div>}
            <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(0,0,0,0.35)' }}>
              {c.therapyCount > 0 && <>{c.therapyCount} Einzeltherapie{c.therapyCount !== 1 ? 'n' : ''}</>}
              {c.therapyCount > 0 && c.groupCount > 0 && ' · '}
              {c.groupCount > 0 && <>{c.groupCount} Gruppe{c.groupCount !== 1 ? 'n' : ''}</>}
              {c.therapyCount === 0 && c.groupCount === 0 && 'Keine Therapien'}
              {c.bookingId && ' · aus Erstgespräch'}
            </div>
          </div>
          {c.notes && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(0,0,0,0.45)', background: '#fafafa', borderRadius: 4, padding: 8 }}>
              {c.notes}
            </div>
          )}
          <div style={{ marginTop: 8 }}>
            <DocumentCollapse contextType="client" contextId={c.id} />
          </div>
        </Card>
      ))}
    </Space>
  );
}
