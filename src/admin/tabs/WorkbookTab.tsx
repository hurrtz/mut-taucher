import { useState, useEffect } from 'react';
import { useAdminWorkbook } from '../../lib/useAdminWorkbook';
import { useAdminTherapies } from '../../lib/useAdminTherapies';
import { useAdminGroups } from '../../lib/useAdminGroups';
import { useAdminClients } from '../../lib/useAdminClients';
import { useAdminStyles } from '../styles';
import { getToken } from '../../lib/api';
import WorkbookUploadModal from '../components/WorkbookUploadModal';
import WorkbookShareModal from '../components/WorkbookShareModal';
import { Row, Col, Card, Button, Space, Typography, Alert, Tooltip } from 'antd';
import { PlusOutlined, SendOutlined, DeleteOutlined } from '@ant-design/icons';

export default function WorkbookTab() {
  const styles = useAdminStyles();
  const {
    materials, error: workbookError,
    fetchMaterials, uploadMaterial, removeMaterial, sendMaterial,
  } = useAdminWorkbook();
  const { therapies, fetchTherapies } = useAdminTherapies();
  const { groups, fetchGroups } = useAdminGroups();
  const { clients, fetchClients } = useAdminClients();

  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);
  const [showWorkbookUpload, setShowWorkbookUpload] = useState(false);
  const [showWorkbookShare, setShowWorkbookShare] = useState(false);

  useEffect(() => {
    fetchMaterials();
    fetchTherapies();
    fetchGroups();
    fetchClients();
  }, [fetchMaterials, fetchTherapies, fetchGroups, fetchClients]);

  const selectedMaterial = materials.find(m => m.id === selectedMaterialId);
  const existingGroups = [...new Set(materials.map(m => m.groupName).filter((g): g is string => !!g))];
  const grouped = materials.reduce<Record<string, typeof materials>>((acc, m) => {
    const key = m.groupName || '';
    (acc[key] ??= []).push(m);
    return acc;
  }, {});
  const ungrouped = grouped[''] || [];
  const groupNames = Object.keys(grouped).filter(k => k !== '').sort((a, b) => a.localeCompare(b, 'de'));

  return (
    <div style={styles.pageContent}>
      <div style={styles.headerRow}>
        <Typography.Title style={{ margin: 0 }}>Arbeitsmappe</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowWorkbookUpload(true)}>
          Neues Dokument hochladen
        </Button>
      </div>

      {workbookError && <Alert message={workbookError} type="error" showIcon closable style={{ marginBottom: styles.token.marginMD }} />}

      <Row gutter={24}>
        <Col xs={24} lg={6}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {ungrouped.map(m => (
              <Button
                key={m.id}
                type={selectedMaterialId === m.id ? 'primary' : 'text'}
                ghost={selectedMaterialId === m.id}
                block
                style={{ justifyContent: 'flex-start', whiteSpace: 'normal', height: 'auto', padding: '8px 16px' }}
                onClick={() => setSelectedMaterialId(prev => prev === m.id ? null : m.id)}
              >
                {m.name}
              </Button>
            ))}
            {groupNames.map(g => (
              <div key={g}>
                <Typography.Text type="secondary" style={{ display: 'block', padding: '12px 16px 4px', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                  {g}
                </Typography.Text>
                {grouped[g].map(m => (
                  <Button
                    key={m.id}
                    type={selectedMaterialId === m.id ? 'primary' : 'text'}
                    ghost={selectedMaterialId === m.id}
                    block
                    style={{ justifyContent: 'flex-start', whiteSpace: 'normal', height: 'auto', padding: '8px 16px' }}
                    onClick={() => setSelectedMaterialId(prev => prev === m.id ? null : m.id)}
                  >
                    {m.name}
                  </Button>
                ))}
              </div>
            ))}
            {materials.length === 0 && (
              <Typography.Text type="secondary" style={{ padding: 16 }}>
                Noch keine Materialien hochgeladen.
              </Typography.Text>
            )}
          </div>
        </Col>

        <Col xs={24} lg={18}>
          {selectedMaterial ? (
            <Card
              title={selectedMaterial.name}
              extra={
                <Space>
                  <Button icon={<SendOutlined />} onClick={() => setShowWorkbookShare(true)}>
                    Versenden
                  </Button>
                  <Tooltip title="Löschen">
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        if (confirm(`"${selectedMaterial.name}" wirklich löschen?`)) {
                          removeMaterial(selectedMaterial.id);
                          setSelectedMaterialId(null);
                        }
                      }}
                    />
                  </Tooltip>
                </Space>
              }
            >
              {selectedMaterial.mimeType === 'application/pdf' ? (
                <iframe
                  src={`/api/admin/workbook/${selectedMaterial.id}/download?token=${getToken()}`}
                  style={{ width: '100%', height: 600, border: 'none' }}
                  title={selectedMaterial.name}
                />
              ) : (
                <img
                  src={`/api/admin/workbook/${selectedMaterial.id}/download?token=${getToken()}`}
                  alt={selectedMaterial.name}
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              )}
            </Card>
          ) : (
            <div style={styles.emptyState}>
              <Typography.Text type="secondary">Material aus der Liste auswählen</Typography.Text>
            </div>
          )}
        </Col>
      </Row>

      <WorkbookUploadModal
        open={showWorkbookUpload}
        onClose={() => setShowWorkbookUpload(false)}
        onUpload={uploadMaterial}
        existingGroups={existingGroups}
      />

      {selectedMaterial && (
        <WorkbookShareModal
          open={showWorkbookShare}
          onClose={() => setShowWorkbookShare(false)}
          materialName={selectedMaterial.name}
          onSend={(clientIds) => sendMaterial(selectedMaterial.id, clientIds)}
          therapies={therapies}
          groups={groups}
          clients={clients}
        />
      )}
    </div>
  );
}
