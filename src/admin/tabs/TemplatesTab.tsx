import { useState, useEffect, useRef } from 'react';
import { useAdminTemplates } from '../../lib/useAdminTemplates';
import { useAdminBranding } from '../../lib/useAdminBranding';
import { useAdminStyles } from '../styles';
import TemplateEditor, { type TemplateEditorHandle } from '../../components/TemplateEditor';
import TemplateCreateModal from '../components/TemplateCreateModal';
import TemplateMappingModal from '../components/TemplateMappingModal';
import BrandingForm from '../components/BrandingForm';
import { Tabs, Row, Col, Card, Button, Space, Typography, Modal, AutoComplete, Form, Alert, Tooltip } from 'antd';
import { PlusOutlined, SettingOutlined, FolderOutlined, EyeOutlined, SaveOutlined, DeleteOutlined } from '@ant-design/icons';

function TemplateGroupModal({ open, onClose, templateKey, groupName, existingGroups, onUpdate }: {
  open: boolean;
  onClose: () => void;
  templateKey: string;
  groupName: string | null;
  existingGroups: string[];
  onUpdate: (key: string, groupName: string | null) => void;
}) {
  const [value, setValue] = useState(groupName || '');
  useEffect(() => { setValue(groupName || ''); }, [groupName]);
  const handleSave = () => {
    const trimmed = value.trim() || null;
    if (trimmed !== groupName) onUpdate(templateKey, trimmed);
    onClose();
  };
  return (
    <Modal title="Gruppe zuweisen" open={open} onCancel={onClose} onOk={handleSave} okText="Speichern" cancelText="Abbrechen" width={400} destroyOnClose>
      <Form.Item label="Gruppe" style={{ marginBottom: 0, marginTop: 16 }}>
        <AutoComplete
          value={value}
          onChange={setValue}
          options={existingGroups.map(g => ({ value: g }))}
          placeholder="Keine Gruppe"
          style={{ width: '100%' }}
          allowClear
          autoFocus
        />
      </Form.Item>
    </Modal>
  );
}

export default function TemplatesTab() {
  const styles = useAdminStyles();
  const {
    templates, activeTemplate, mappings, saving: templateSaving, previewing: templatePreviewing,
    error: templatesError,
    fetchTemplates, fetchTemplate, createTemplate, removeTemplate, updateTemplate,
    updateTemplateGroup, previewTemplate, uploadImage,
    fetchMappings, updateMapping,
  } = useAdminTemplates();

  const {
    settings: brandSettings, saving: brandingSaving, error: brandingError,
    fetchBranding, updateBranding, uploadLogo,
  } = useAdminBranding();

  const [showTemplateCreate, setShowTemplateCreate] = useState(false);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [dokumenteSubTab, setDokumenteSubTab] = useState<'vorlagen' | 'branding'>('vorlagen');
  const editorRef = useRef<TemplateEditorHandle>(null);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  useEffect(() => {
    if (dokumenteSubTab === 'branding' && !brandSettings) {
      fetchBranding();
    }
  }, [dokumenteSubTab, brandSettings, fetchBranding]);

  const existingGroups = [...new Set(templates.map(t => t.groupName).filter((g): g is string => !!g))];
  const grouped = templates.reduce<Record<string, typeof templates>>((acc, t) => {
    const key = t.groupName || '';
    (acc[key] ??= []).push(t);
    return acc;
  }, {});
  const ungrouped = grouped[''] || [];
  const groupNames = Object.keys(grouped).filter(k => k !== '').sort((a, b) => a.localeCompare(b, 'de'));

  return (
    <div style={styles.pageContent}>
      <div style={styles.headerRow}>
        <Typography.Title style={{ margin: 0 }}>Vorlagen</Typography.Title>
        {dokumenteSubTab === 'vorlagen' && (
          <Space>
            <Button icon={<SettingOutlined />} onClick={() => setShowMappingModal(true)}>
              Zuordnungen
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowTemplateCreate(true)}>
              Neue Vorlage
            </Button>
          </Space>
        )}
      </div>

      {templatesError && <Alert message={templatesError} type="error" showIcon closable style={{ marginBottom: styles.token.marginMD }} />}

      <Tabs
        activeKey={dokumenteSubTab}
        onChange={(key) => setDokumenteSubTab(key as 'vorlagen' | 'branding')}
        items={[
          {
            key: 'vorlagen',
            label: 'Vorlagen',
            children: (
              <>
                <Row gutter={24}>
                  <Col xs={24} lg={6}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {ungrouped.map(t => (
                        <Button
                          key={t.key}
                          type={activeTemplate?.key === t.key ? 'primary' : 'text'}
                          ghost={activeTemplate?.key === t.key}
                          block
                          style={{ justifyContent: 'flex-start', textAlign: 'left', whiteSpace: 'normal', height: 'auto', padding: '8px 16px' }}
                          onClick={() => fetchTemplate(t.key)}
                        >
                          {t.label}
                        </Button>
                      ))}
                      {groupNames.map(g => (
                        <div key={g}>
                          <Typography.Text type="secondary" style={{ display: 'block', padding: '12px 16px 4px', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                            {g}
                          </Typography.Text>
                          {grouped[g].map(t => (
                            <Button
                              key={t.key}
                              type={activeTemplate?.key === t.key ? 'primary' : 'text'}
                              ghost={activeTemplate?.key === t.key}
                              block
                              style={{ justifyContent: 'flex-start', textAlign: 'left', whiteSpace: 'normal', height: 'auto', padding: '8px 16px' }}
                              onClick={() => fetchTemplate(t.key)}
                            >
                              {t.label}
                            </Button>
                          ))}
                        </div>
                      ))}
                      {templates.length === 0 && (
                        <Typography.Text type="secondary" style={{ padding: 16 }}>
                          Noch keine Vorlagen vorhanden.
                        </Typography.Text>
                      )}
                    </div>
                  </Col>

                  <Col xs={24} lg={18}>
                    {activeTemplate ? (
                      <Card
                        title={activeTemplate.label}
                        extra={
                          <Space>
                            <Tooltip title="Gruppe">
                              <Button icon={<FolderOutlined />} onClick={() => setShowGroupModal(true)} />
                            </Tooltip>
                            <Tooltip title="Vorschau">
                              <Button icon={<EyeOutlined />} loading={templatePreviewing} onClick={() => { const html = editorRef.current?.getHTML(); if (html) previewTemplate(activeTemplate.key, html); }} />
                            </Tooltip>
                            <Tooltip title="Speichern">
                              <Button type="primary" icon={<SaveOutlined />} loading={templateSaving} onClick={() => { const html = editorRef.current?.getHTML(); if (html) updateTemplate(activeTemplate.key, html); }} />
                            </Tooltip>
                            <Tooltip title="Löschen">
                              <Button danger icon={<DeleteOutlined />} onClick={() => { if (confirm(`"${activeTemplate.label}" wirklich löschen?`)) removeTemplate(activeTemplate.key); }} />
                            </Tooltip>
                          </Space>
                        }
                      >
                        <TemplateEditor
                          ref={editorRef}
                          key={activeTemplate.key}
                          htmlContent={activeTemplate.htmlContent}
                          placeholders={activeTemplate.placeholders}
                          saving={templateSaving}
                          previewing={templatePreviewing}
                          onSave={(html) => updateTemplate(activeTemplate.key, html)}
                          onPreview={(html) => previewTemplate(activeTemplate.key, html)}
                          onUploadImage={uploadImage}
                          hideActions
                        />
                      </Card>
                    ) : (
                      <div style={styles.emptyState}>
                        <Typography.Text type="secondary">Vorlage aus der Liste auswählen</Typography.Text>
                      </div>
                    )}
                  </Col>
                </Row>

                <TemplateCreateModal
                  open={showTemplateCreate}
                  onClose={() => setShowTemplateCreate(false)}
                  onCreate={createTemplate}
                  existingGroups={existingGroups}
                />

                <TemplateMappingModal
                  open={showMappingModal}
                  onClose={() => setShowMappingModal(false)}
                  mappings={mappings}
                  templates={templates}
                  onUpdate={updateMapping}
                  onLoad={fetchMappings}
                />

                {activeTemplate && (
                  <TemplateGroupModal
                    open={showGroupModal}
                    onClose={() => setShowGroupModal(false)}
                    templateKey={activeTemplate.key}
                    groupName={activeTemplate.groupName}
                    existingGroups={existingGroups}
                    onUpdate={updateTemplateGroup}
                  />
                )}
              </>
            ),
          },
          {
            key: 'branding',
            label: 'Branding',
            children: (
              <BrandingForm
                settings={brandSettings}
                saving={brandingSaving}
                error={brandingError}
                onUpdate={updateBranding}
                onUploadLogo={uploadLogo}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
