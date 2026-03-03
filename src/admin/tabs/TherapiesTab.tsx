import { useState, useEffect } from 'react';
import { useAdminTherapies } from '../../lib/useAdminTherapies';
import { useAdminClients } from '../../lib/useAdminClients';
import { useAdminStyles } from '../styles';
import TherapyForm from '../components/TherapyForm';
import TherapyList from '../components/TherapyList';
import type { Therapy } from '../../lib/data';
import { Typography, Button, Modal, Alert } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

export default function TherapiesTab() {
  const styles = useAdminStyles();
  const {
    therapies, archivedTherapies, sessionsByTherapy, error,
    fetchTherapies, fetchArchivedTherapies, addTherapy, updateTherapy, removeTherapy,
    fetchSessions, generateSessions, updateSession, removeSession, sendInvoice,
  } = useAdminTherapies();
  const { clients, fetchClients } = useAdminClients();

  const [showNewTherapy, setShowNewTherapy] = useState(false);
  const [editingTherapy, setEditingTherapy] = useState<Therapy | null>(null);
  const [newTherapyClientId, setNewTherapyClientId] = useState<number | undefined>();

  useEffect(() => {
    fetchTherapies();
    fetchArchivedTherapies();
    fetchClients();
  }, [fetchTherapies, fetchArchivedTherapies, fetchClients]);

  return (
    <div style={styles.pageContent}>
      <div style={styles.headerRow}>
        <Typography.Title style={{ margin: 0 }}>Einzeltherapie</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowNewTherapy(true)}>Neue Therapie</Button>
      </div>
      {error && <Alert message={error} type="error" showIcon closable style={{ marginBottom: styles.token.marginMD }} />}

      <Modal
        title={editingTherapy ? 'Therapie bearbeiten' : 'Neue Therapie'}
        open={showNewTherapy || !!editingTherapy}
        onCancel={() => { setShowNewTherapy(false); setNewTherapyClientId(undefined); setEditingTherapy(null); }}
        footer={null}
        destroyOnClose
        width={720}
      >
        <TherapyForm
          key={editingTherapy?.id ?? 'new'}
          clients={clients}
          initialClientId={newTherapyClientId}
          initial={editingTherapy ?? undefined}
          onSave={async (data) => {
            if (editingTherapy) await updateTherapy(editingTherapy.id, data);
            else await addTherapy(data);
            setShowNewTherapy(false);
            setNewTherapyClientId(undefined);
            setEditingTherapy(null);
          }}
          onCancel={() => { setShowNewTherapy(false); setNewTherapyClientId(undefined); setEditingTherapy(null); }}
        />
      </Modal>

      <TherapyList
        therapies={therapies}
        archivedTherapies={archivedTherapies}
        sessionsByTherapy={sessionsByTherapy}
        fetchSessions={fetchSessions}
        onEdit={(therapy) => setEditingTherapy(therapy)}
        onDelete={removeTherapy}
        onArchive={async (id) => { await updateTherapy(id, { status: 'archived' }); await fetchArchivedTherapies(); }}
        onGenerateSessions={generateSessions}
        onUpdateSession={updateSession}
        onDeleteSession={removeSession}
        onSendInvoice={sendInvoice}
        showNewForm={false}
        newForm={null}
      />
    </div>
  );
}
