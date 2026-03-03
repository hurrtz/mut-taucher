import type { AdminBooking } from '../../lib/useAdminBooking';
import { DocumentCollapse } from './DocumentChecklist';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Card, Button, Tag, Space, Typography, Tooltip, Modal,
} from 'antd';
import {
  MailOutlined, CheckCircleOutlined, ClockCircleOutlined, UserAddOutlined,
  CloseOutlined, CalendarOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

export default function BookingList({ bookings, onUpdate, onSendEmail, onMigrateToClient }: {
  bookings: AdminBooking[];
  onUpdate: (id: number, updates: Partial<AdminBooking>) => void;
  onSendEmail: (id: number, type: 'intro' | 'reminder') => void;
  onMigrateToClient: (bookingId: number) => void;
}) {
  if (bookings.length === 0) {
    return (
      <Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: '24px 0' }}>
        Keine Buchungen im gewählten Zeitraum.
      </Text>
    );
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="small">
      {bookings.map(b => (
        <Card
          key={b.id}
          size="small"
          title={<Typography.Text strong ellipsis>{b.clientName}</Typography.Text>}
          style={{
            opacity: b.status === 'cancelled' ? 0.6 : 1,
            borderColor: b.status === 'cancelled' ? '#fca5a5' : undefined,
          }}
          extra={
            b.status === 'confirmed' ? (
              <Space size={0}>
                <Tooltip title={b.introEmailSent ? 'Intro-E-Mail gesendet' : 'Intro-E-Mail senden'}>
                  <Button
                    type="text"
                    icon={b.introEmailSent
                      ? <CheckCircleOutlined style={{ color: '#4ade80' }} />
                      : <MailOutlined />}
                    disabled={b.introEmailSent}
                    onClick={() => onSendEmail(b.id, 'intro')}
                  />
                </Tooltip>
                <Tooltip title={b.reminderSent ? 'Erinnerung gesendet' : 'Erinnerung senden'}>
                  <Button
                    type="text"
                    icon={b.reminderSent
                      ? <CheckCircleOutlined style={{ color: '#4ade80' }} />
                      : <ClockCircleOutlined />}
                    disabled={b.reminderSent}
                    onClick={() => onSendEmail(b.id, 'reminder')}
                  />
                </Tooltip>
                <Tooltip title="Klient:in anlegen">
                  <Button
                    type="text"
                    icon={<UserAddOutlined />}
                    onClick={() => onMigrateToClient(b.id)}
                  />
                </Tooltip>
                <Tooltip title="Stornieren">
                  <Button
                    type="text"
                    danger
                    icon={<CloseOutlined />}
                    onClick={() => {
                      Modal.confirm({
                        title: 'Buchung stornieren',
                        content: `Buchung von ${b.clientName} wirklich stornieren?`,
                        okText: 'Stornieren',
                        okType: 'danger',
                        cancelText: 'Abbrechen',
                        onOk: () => onUpdate(b.id, { status: 'cancelled' }),
                      });
                    }}
                  />
                </Tooltip>
              </Space>
            ) : (
              <Tag color="red">Storniert</Tag>
            )
          }
        >
          <Space direction="vertical" size={2} style={{ width: '100%' }}>
            <a href={`mailto:${b.clientEmail}`} style={{ fontSize: 13 }}>{b.clientEmail}</a>
            <Space size={4} style={{ marginTop: 4 }}>
              <CalendarOutlined style={{ fontSize: 13, color: '#9ca3af' }} />
              <Text type="secondary" style={{ fontSize: 13 }}>
                {format(parseISO(b.date), 'd. MMMM yyyy', { locale: de })} · {b.time} Uhr · {b.durationMinutes} Min.
              </Text>
            </Space>
            {b.ruleLabel && (
              <Text type="secondary" style={{ fontSize: 12 }}>Regel: {b.ruleLabel}</Text>
            )}
          </Space>

          {b.status === 'confirmed' && (
            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12, marginTop: 12 }}>
              <DocumentCollapse contextType="erstgespraech" contextId={b.id} />
            </div>
          )}
        </Card>
      ))}
    </Space>
  );
}
