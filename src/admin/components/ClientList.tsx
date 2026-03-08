import { useState } from 'react';
import type { Client } from '../../lib/data';
import { EditOutlined, InboxOutlined, UndoOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import { Card, Button, Tag, Space, Typography, Modal, Tooltip } from 'antd';

function ArchivedClientCard({ client, onEdit, onRestore, selectedId, onSelect }: {
  client: Client;
  onEdit: (id: number) => void;
  onRestore: (id: number) => void;
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const c = client;

  return (
    <Card
      key={c.id}
      size="default"
      hoverable
      onClick={() => onSelect(c.id)}
      style={{ borderColor: selectedId === c.id ? '#2dd4bf' : undefined, cursor: 'pointer' }}
      title={
        <Space
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
        >
          {expanded
            ? <DownOutlined style={{ fontSize: 10 }} />
            : <RightOutlined style={{ fontSize: 10 }} />
          }
          <span>{c.lastName}, {c.firstName}</span>
          <Tag>Archiviert</Tag>
        </Space>
      }
      extra={
        <Space size={0} onClick={e => e.stopPropagation()}>
          <Tooltip title="Bearbeiten">
            <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(c.id)} />
          </Tooltip>
          <Tooltip title="Wiederherstellen">
            <Button
              type="text"
              icon={<UndoOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: `Patient:in "${c.firstName} ${c.lastName}" wiederherstellen?`,
                  okText: 'Wiederherstellen',
                  cancelText: 'Abbrechen',
                  onOk: () => onRestore(c.id),
                });
              }}
            />
          </Tooltip>
        </Space>
      }
      styles={{ body: expanded ? undefined : { display: 'none' } }}
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
    </Card>
  );
}

export default function ClientList({ clients, onEdit, onArchive, onRestore, selectedId, onSelect }: {
  clients: Client[];
  onEdit: (id: number) => void;
  onArchive: (id: number) => void;
  onRestore: (id: number) => void;
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const [archivedExpanded, setArchivedExpanded] = useState(false);

  const activeClients = clients.filter(c => c.status === 'active');
  const archivedClients = clients.filter(c => c.status === 'archived');

  if (clients.length === 0) {
    return (
      <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>
        Noch keine Patient:innen angelegt.
      </Typography.Text>
    );
  }

  const renderActiveCard = (c: Client) => (
    <Card
      key={c.id}
      size="default"
      hoverable
      onClick={() => onSelect(c.id)}
      style={{ borderColor: selectedId === c.id ? '#2dd4bf' : undefined, cursor: 'pointer' }}
      title={<span>{c.lastName}, {c.firstName}</span>}
      extra={
        <Space size={0} onClick={e => e.stopPropagation()}>
          <Tooltip title="Bearbeiten">
            <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(c.id)} />
          </Tooltip>
          <Tooltip title="Archivieren">
            <Button
              type="text"
              icon={<InboxOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: `Patient:in "${c.firstName} ${c.lastName}" archivieren?`,
                  content: 'Archivierte Patient:innen können jederzeit wiederhergestellt werden.',
                  okText: 'Archivieren',
                  cancelText: 'Abbrechen',
                  onOk: () => onArchive(c.id),
                });
              }}
            />
          </Tooltip>
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
    </Card>
  );

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {activeClients.length > 0 && (
        <div>
          <Typography.Title level={5} style={{ marginBottom: 12 }}>
            Aktive Patienten ({activeClients.length})
          </Typography.Title>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {activeClients.map(renderActiveCard)}
          </Space>
        </div>
      )}

      {archivedClients.length > 0 && (
        <div>
          <Typography.Title
            level={5}
            style={{ marginBottom: 12, cursor: 'pointer', userSelect: 'none' }}
            onClick={() => setArchivedExpanded(!archivedExpanded)}
          >
            {archivedExpanded ? <DownOutlined style={{ fontSize: 12, marginRight: 8 }} /> : <RightOutlined style={{ fontSize: 12, marginRight: 8 }} />}
            Archivierte Patienten ({archivedClients.length})
          </Typography.Title>
          {archivedExpanded && (
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {archivedClients.map(c => (
                <ArchivedClientCard
                  key={c.id}
                  client={c}
                  onEdit={onEdit}
                  onRestore={onRestore}
                  selectedId={selectedId}
                  onSelect={onSelect}
                />
              ))}
            </Space>
          )}
        </div>
      )}
    </Space>
  );
}
