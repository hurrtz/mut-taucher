import { useState, useEffect } from 'react';
import { useAdminGroups } from '../../lib/useAdminGroups';
import { useAdminClients } from '../../lib/useAdminClients';
import { useAdminStyles } from '../styles';
import GroupForm from '../components/GroupForm';
import GroupManager from '../components/GroupManager';
import type { TherapyGroup } from '../../lib/data';
import { Typography, Button, Modal, Alert } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

export default function GroupsTab() {
  const styles = useAdminStyles();
  const {
    groups, archivedGroups, groupSessionsByGroup, error,
    fetchGroups, fetchArchivedGroups, addGroup, updateGroup, removeGroup,
    addParticipant, removeParticipant,
    fetchGroupSessions, generateGroupSessions,
    updateGroupSession, removeGroupSession,
    updatePayment, bulkPayGroupPayments, sendGroupBundleInvoice,
  } = useAdminGroups();
  const { clients, fetchClients } = useAdminClients();

  const [showNewGroup, setShowNewGroup] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TherapyGroup | null>(null);

  useEffect(() => {
    fetchGroups();
    fetchArchivedGroups();
    fetchClients();
  }, [fetchGroups, fetchArchivedGroups, fetchClients]);

  return (
    <div style={styles.pageContent}>
      <div style={styles.headerRow}>
        <Typography.Title style={{ margin: 0 }}>Gruppentherapie</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowNewGroup(true)}>Neue Gruppe</Button>
      </div>
      {error && <Alert message={error} type="error" showIcon closable style={{ marginBottom: styles.token.marginMD }} />}

      <Modal
        title={editingGroup ? 'Gruppe bearbeiten' : 'Neue Gruppe'}
        open={showNewGroup || !!editingGroup}
        onCancel={() => { setShowNewGroup(false); setEditingGroup(null); }}
        footer={null}
        destroyOnClose
        width={720}
      >
        <GroupForm
          key={editingGroup?.id ?? 'new'}
          initial={editingGroup ?? undefined}
          onSave={async (data) => {
            if (editingGroup) await updateGroup(editingGroup.id, data);
            else await addGroup(data);
            setShowNewGroup(false);
            setEditingGroup(null);
          }}
          onCancel={() => { setShowNewGroup(false); setEditingGroup(null); }}
        />
      </Modal>

      <GroupManager
        groups={groups}
        archivedGroups={archivedGroups}
        clients={clients}
        groupSessionsByGroup={groupSessionsByGroup}
        fetchGroupSessions={fetchGroupSessions}
        onEdit={(group) => setEditingGroup(group)}
        onDelete={removeGroup}
        onArchive={async (id) => { await updateGroup(id, { status: 'archived' }); await fetchArchivedGroups(); }}
        onToggleHomepage={(id, current) => updateGroup(id, { showOnHomepage: !current })}
        onAddParticipant={addParticipant}
        onRemoveParticipant={removeParticipant}
        onGenerateSessions={generateGroupSessions}
        onUpdateSession={updateGroupSession}
        onDeleteSession={removeGroupSession}
        onUpdatePayment={updatePayment}
        onBulkPay={bulkPayGroupPayments}
        onSendBundleInvoice={sendGroupBundleInvoice}
        showNewForm={false}
        newForm={null}
      />
    </div>
  );
}
