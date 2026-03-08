import type { AdminBooking } from '../../lib/useAdminBooking';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Card, Button, Tag, Space, Typography, Tooltip, Modal,
} from 'antd';
import {
  CheckCircleOutlined, EuroCircleOutlined,
  CloseOutlined, CalendarOutlined, CreditCardOutlined, BankOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

export default function BookingList({ bookings, onUpdate }: {
  bookings: AdminBooking[];
  onUpdate: (id: number, updates: Partial<AdminBooking>) => void;
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
          size="default"
          title={<span>{b.clientName}{b.status === 'pending_payment' && <Tag color="orange" style={{ marginLeft: 8 }}>Zahlung ausstehend</Tag>}</span>}
          style={{
            opacity: b.status === 'cancelled' || b.status === 'completed' ? 0.6 : 1,
            borderColor: b.status === 'cancelled' ? '#fca5a5' : b.status === 'completed' ? '#b7eb8f' : b.status === 'pending_payment' ? '#fbbf24' : undefined,
          }}
          extra={
            b.status === 'pending_payment' ? (
              <Space size={0}>
                <Tooltip title={b.paymentMethod === 'stripe' ? 'Kreditkarte' : 'Überweisung'}>
                  {b.paymentMethod === 'stripe' ? <CreditCardOutlined style={{ color: '#6366f1', marginRight: 8 }} /> : <BankOutlined style={{ color: '#6366f1', marginRight: 8 }} />}
                </Tooltip>
                <Tooltip title="Zahlung bestätigen">
                  <Button
                    type="text"
                    icon={<EuroCircleOutlined />}
                    onClick={() => {
                      Modal.confirm({
                        title: 'Zahlung bestätigen',
                        content: `Zahlung von ${b.clientName} als eingegangen bestätigen?`,
                        okText: 'Bestätigen',
                        cancelText: 'Abbrechen',
                        onOk: () => onUpdate(b.id, { status: 'confirmed' }),
                      });
                    }}
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
            ) : b.status === 'confirmed' ? (
              <Space size={0}>
                <Tooltip title={b.paymentMethod === 'stripe' ? 'Kreditkarte' : b.paymentMethod === 'wire_transfer' ? 'Überweisung' : ''}>
                  {b.paymentMethod === 'stripe' ? <CreditCardOutlined style={{ color: '#6366f1', marginRight: 4 }} /> : b.paymentMethod === 'wire_transfer' ? <BankOutlined style={{ color: '#6366f1', marginRight: 4 }} /> : null}
                </Tooltip>
                <Tooltip title="Als erledigt markieren">
                  <Button
                    type="text"
                    icon={<CheckCircleOutlined />}
                    onClick={() => onUpdate(b.id, { status: 'completed' })}
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
            ) : b.status === 'completed' ? (
              <Tag color="green">Erledigt</Tag>
            ) : (
              <Tag color="red">Storniert</Tag>
            )
          }
        >
          <div style={{ display: 'flex', gap: 0 }}>
            <Space direction="vertical" size={2} style={{ flex: 1 }}>
              <Space size={4}>
                <a href={`mailto:${b.clientEmail}`} style={{ fontSize: 13 }}>{b.clientEmail}</a>
                {b.clientPhone && (
                  <Text type="secondary" style={{ fontSize: 13 }}>· {b.clientPhone}</Text>
                )}
              </Space>
              {(b.clientStreet || b.clientCity) && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {[b.clientStreet, [b.clientZip, b.clientCity].filter(Boolean).join(' ')].filter(Boolean).join(', ')}
                </Text>
              )}
              <Space size={4}>
                <CalendarOutlined style={{ fontSize: 13, color: '#9ca3af' }} />
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {format(parseISO(b.date), 'd. MMMM yyyy', { locale: de })} · {b.time} Uhr · {b.durationMinutes} Min.
                </Text>
              </Space>
            </Space>
            <div style={{ width: '0.5px', background: '#d1d5db', margin: '0 12px', flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 12, color: 'rgba(0,0,0,0.45)', background: '#fafafa', borderRadius: 4, padding: 8 }}>
              {b.clientMessage || <Text type="secondary" italic style={{ fontSize: 12 }}>Keine Nachricht</Text>}
            </div>
          </div>

        </Card>
      ))}
    </Space>
  );
}
