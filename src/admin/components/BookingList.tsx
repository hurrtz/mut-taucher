import type { AdminBooking } from '../../lib/useAdminBooking';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Card, Button, Tag, Space, Typography, Tooltip, Modal,
} from 'antd';
import {
  CheckCircleOutlined, EuroCircleOutlined,
  CloseOutlined, CalendarOutlined, FileTextOutlined, CreditCardOutlined, BankOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

export default function BookingList({ bookings, onUpdate, onSendInvoice }: {
  bookings: AdminBooking[];
  onUpdate: (id: number, updates: Partial<AdminBooking>) => void;
  onSendInvoice: (bookingId: number) => void;
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
            opacity: b.status === 'cancelled' ? 0.6 : 1,
            borderColor: b.status === 'cancelled' ? '#fca5a5' : b.status === 'pending_payment' ? '#fbbf24' : undefined,
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
                <Tooltip title={b.invoiceSent ? 'Rechnung gesendet' : 'Rechnung senden'}>
                  <Button
                    type="text"
                    icon={b.invoiceSent
                      ? <CheckCircleOutlined style={{ color: '#4ade80' }} />
                      : <FileTextOutlined />}
                    disabled={b.invoiceSent}
                    onClick={() => onSendInvoice(b.id)}
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

        </Card>
      ))}
    </Space>
  );
}
