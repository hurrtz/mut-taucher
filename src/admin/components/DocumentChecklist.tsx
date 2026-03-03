import { useEffect, useMemo } from 'react';
import { useDocumentSends, DOCUMENT_DEFINITIONS, CATEGORY_LABELS } from '../../lib/useDocumentSends';
import type { DocumentDefinition } from '../../lib/data';
import { format } from 'date-fns';
import { List, Button, Spin, Typography } from 'antd';
import {
  CheckCircleFilled,
  MinusCircleOutlined,
  SendOutlined,
  CheckOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

export default function DocumentChecklist({ contextType, contextId }: {
  contextType: 'client' | 'erstgespraech' | 'therapy' | 'group';
  contextId: number;
}) {
  const { sending, fetchStatus, sendDocument, isSent, getSentAt } = useDocumentSends();

  useEffect(() => {
    if (contextId) fetchStatus(contextType, contextId);
  }, [contextType, contextId, fetchStatus]);

  const grouped = useMemo(() => {
    const defs = DOCUMENT_DEFINITIONS[contextType] ?? [];
    const groups: Record<string, DocumentDefinition[]> = {};
    for (const doc of defs) {
      if (!groups[doc.category]) groups[doc.category] = [];
      groups[doc.category].push(doc);
    }
    return groups;
  }, [contextType]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {Object.entries(grouped).map(([category, docs]) => (
        <div key={category}>
          <Text
            type="secondary"
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'block',
              marginBottom: 6,
            }}
          >
            {CATEGORY_LABELS[category] ?? category}
          </Text>
          <List
            size="small"
            dataSource={docs}
            renderItem={(doc: DocumentDefinition) => {
              const sent = isSent(doc.key);
              const sentAt = getSentAt(doc.key);
              const isSending = sending === doc.key;
              const hasTemplate = !!doc.template;
              const hasSigStep = !!doc.signedCounterpart;
              const signed = hasSigStep ? isSent(doc.signedCounterpart!) : false;
              const signedAt = hasSigStep ? getSentAt(doc.signedCounterpart!) : null;
              const isSigningSending = hasSigStep ? sending === doc.signedCounterpart : false;

              const sentIcon = <CheckCircleFilled style={{ color: '#52c41a', fontSize: 14 }} />;
              const unsentIcon = <MinusCircleOutlined style={{ color: '#d9d9d9', fontSize: 14 }} />;

              return (
                <List.Item
                  style={{ padding: '4px 8px' }}
                  actions={[
                    hasTemplate ? (
                      <Button
                        key="send"
                        size="small"
                        icon={isSending ? <Spin size="small" /> : <SendOutlined />}
                        disabled={isSending}
                        onClick={() => sendDocument(contextType, contextId, doc.key)}
                        title={sent ? 'Erneut senden' : 'PDF senden'}
                        style={
                          sent
                            ? { borderColor: '#b7eb8f', color: '#52c41a', backgroundColor: '#f6ffed' }
                            : undefined
                        }
                      >
                        {sent ? 'Erneut' : 'Senden'}
                      </Button>
                    ) : (
                      <Button
                        key="mark"
                        size="small"
                        icon={isSending ? <Spin size="small" /> : sent ? <CheckOutlined /> : <FileTextOutlined />}
                        disabled={sent || isSending}
                        onClick={() => sendDocument(contextType, contextId, doc.key)}
                        title={sent ? 'Vermerkt' : 'Als erledigt markieren'}
                        style={
                          sent
                            ? { borderColor: '#b7eb8f', color: '#52c41a', backgroundColor: '#f6ffed' }
                            : undefined
                        }
                      />
                    ),
                    hasSigStep ? (
                      <Button
                        key="sign"
                        size="small"
                        icon={isSigningSending ? <Spin size="small" /> : <SafetyCertificateOutlined />}
                        disabled={!sent || isSigningSending}
                        onClick={() => sendDocument(contextType, contextId, doc.signedCounterpart!)}
                        title={
                          signed
                            ? 'Erneut als unterschrieben markieren'
                            : !sent
                              ? 'Erst senden'
                              : 'Als unterschrieben markieren'
                        }
                        style={
                          signed
                            ? { borderColor: '#b7eb8f', color: '#52c41a', backgroundColor: '#f6ffed' }
                            : !sent
                              ? { borderColor: '#f0f0f0', color: '#bfbfbf' }
                              : undefined
                        }
                      >
                        {signed ? 'Signiert' : 'Unterschrieben'}
                      </Button>
                    ) : null,
                  ].filter(Boolean)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                    {hasSigStep ? (
                      <>
                        <span title="Gesendet" style={{ flexShrink: 0 }}>
                          {sent ? sentIcon : unsentIcon}
                        </span>
                        <span title="Unterschrieben" style={{ flexShrink: 0 }}>
                          {signed ? sentIcon : unsentIcon}
                        </span>
                      </>
                    ) : (
                      <span style={{ flexShrink: 0 }}>
                        {sent ? sentIcon : unsentIcon}
                      </span>
                    )}
                    <Text
                      style={{
                        fontSize: 13,
                        color: hasSigStep ? (signed ? '#8c8c8c' : '#262626') : (sent ? '#8c8c8c' : '#262626'),
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {doc.label}
                    </Text>
                    {sent && sentAt && (
                      <Text
                        type="secondary"
                        style={{ fontSize: 10, flexShrink: 0 }}
                      >
                        {format(new Date(sentAt), 'd.M.yy')}
                      </Text>
                    )}
                    {signed && signedAt && (
                      <Text
                        type="secondary"
                        style={{ fontSize: 10, flexShrink: 0 }}
                      >
                        ✓ {format(new Date(signedAt), 'd.M.yy')}
                      </Text>
                    )}
                  </div>
                </List.Item>
              );
            }}
          />
        </div>
      ))}
    </div>
  );
}
