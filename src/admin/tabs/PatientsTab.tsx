import { useState, useEffect } from 'react';
import { useAdminClients } from '../../lib/useAdminClients';
import { useAdminStyles } from '../styles';
import ClientForm from '../components/ClientForm';
import ClientList from '../components/ClientList';
import { ClientHistoryPanel } from '../../pages/ClientDetail';
import { Typography, Button, Modal, Row, Col, Alert } from 'antd';
import { UserAddOutlined } from '@ant-design/icons';

export default function PatientsTab() {
  const styles = useAdminStyles();
  const {
    clients, error,
    fetchClients, addClient, updateClient, archiveClient, restoreClient,
  } = useAdminClients();

  const [editingClientId, setEditingClientId] = useState<number | null>(null);
  const [showNewClient, setShowNewClient] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const editingClient = editingClientId ? clients.find(c => c.id === editingClientId) : undefined;

  return (
    <div style={styles.pageContent}>
      <div style={styles.headerRow}>
        <Typography.Title style={{ margin: 0 }}>Patienten</Typography.Title>
        <Button type="primary" icon={<UserAddOutlined />} onClick={() => setShowNewClient(true)}>
          Neue:r Patient:in
        </Button>
      </div>
      {error && <Alert message={error} type="error" showIcon closable style={{ marginBottom: styles.token.marginMD }} />}

      <Modal
        title={editingClient ? 'Patient:in bearbeiten' : 'Neue:r Patient:in'}
        open={showNewClient || !!editingClient}
        onCancel={() => { setEditingClientId(null); setShowNewClient(false); }}
        footer={null}
        destroyOnClose
        width={720}
      >
        <ClientForm
          key={editingClientId ?? 'new'}
          initial={editingClient ?? undefined}
          onSave={async (data) => {
            if (editingClient) {
              await updateClient(editingClientId!, data);
            } else {
              await addClient(data);
            }
            setEditingClientId(null);
            setShowNewClient(false);
          }}
          onCancel={() => { setEditingClientId(null); setShowNewClient(false); }}
        />
      </Modal>

      <Row gutter={24}>
        <Col xs={24} lg={12}>
          <ClientList
            clients={clients}
            onEdit={(id) => { setEditingClientId(id); setShowNewClient(false); }}
            onArchive={archiveClient}
            onRestore={restoreClient}
            selectedId={selectedClientId}
            onSelect={(id) => setSelectedClientId(prev => prev === id ? null : id)}
          />
        </Col>
        <Col xs={24} lg={12}>
          {selectedClientId ? (
            <ClientHistoryPanel key={selectedClientId} clientId={selectedClientId} />
          ) : (
            <div style={styles.emptyState}>
              <Typography.Text type="secondary">Patient:in auswählen, um den Verlauf zu sehen</Typography.Text>
            </div>
          )}
        </Col>
      </Row>
    </div>
  );
}
