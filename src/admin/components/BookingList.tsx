import { useState } from 'react';
import type { AdminBooking, AdminBookingUpdate } from '../../lib/useAdminBooking';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Card, Button, Tag, Space, Typography, Tooltip, Modal,
} from 'antd';
import {
  CheckCircleOutlined, EuroCircleOutlined,
  CloseOutlined, CalendarOutlined, CreditCardOutlined, BankOutlined,
  DownOutlined, RightOutlined, MailOutlined, FileTextOutlined, UndoOutlined, UserAddOutlined, PlayCircleOutlined, NotificationOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

function isPaymentConfirmed(b: AdminBooking) {
  return Boolean(b.paymentConfirmedAt);
}

function canConfirmPayment(b: AdminBooking) {
  return !isPaymentConfirmed(b) && b.status !== 'cancelled';
}

function canSendReminder(b: AdminBooking) {
  return b.paymentMethod === 'wire_transfer' && !isPaymentConfirmed(b) && (b.status === 'pending_payment' || b.status === 'confirmed');
}

function canSendInvoice(b: AdminBooking) {
  return b.invoiceSent || isPaymentConfirmed(b);
}

function BookingCardBody({ b }: { b: AdminBooking }) {
  return (
    <div style={{ display: 'flex', gap: 0 }}>
      <Space direction="vertical" size={2} style={{ flex: 1 }}>
        {b.bookingNumber && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            Buchungsnummer: {b.bookingNumber}
            {b.paymentRequestSent && b.paymentRequestSentAt ? ` · Zahlungsaufforderung ${format(parseISO(b.paymentRequestSentAt), 'dd.MM.yyyy HH:mm')}` : ''}
            {b.paymentConfirmedAt ? ` · Zahlung bestätigt ${format(parseISO(b.paymentConfirmedAt), 'dd.MM.yyyy HH:mm')}` : ''}
          </Text>
        )}
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
  );
}

function ArchivedBookingCard({
  b, onUpdate, onSendInvoice,
}: {
  b: AdminBooking;
  onUpdate: (id: number, updates: AdminBookingUpdate) => void;
  onSendInvoice?: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      key={b.id}
      size="default"
      title={
        <Space
          style={{ cursor: 'pointer' }}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded
            ? <DownOutlined style={{ fontSize: 10 }} />
            : <RightOutlined style={{ fontSize: 10 }} />
          }
          <span>{b.clientName}</span>
        </Space>
      }
      extra={
        <Space size={4}>
          {b.status === 'completed'
            ? <Tag color="green">Erledigt</Tag>
            : <Tag color="red">Storniert</Tag>
          }
          {isPaymentConfirmed(b) && <Tag color="green">Bezahlt</Tag>}
          {b.status === 'completed' && canConfirmPayment(b) && (
            <Tooltip title="Zahlung bestätigen">
              <Button
                type="text"
                size="small"
                icon={<EuroCircleOutlined />}
                onClick={() => {
                  Modal.confirm({
                    title: 'Zahlung bestätigen',
                    content: `Zahlung von ${b.clientName} als eingegangen bestätigen?`,
                    okText: 'Bestätigen',
                    cancelText: 'Abbrechen',
                    onOk: () => onUpdate(b.id, { paymentConfirmed: true }),
                  });
                }}
              />
            </Tooltip>
          )}
          {b.status === 'completed' && onSendInvoice && canSendInvoice(b) && (
            <Tooltip title={b.invoiceSent ? 'Rechnung erneut senden' : 'Rechnung senden'}>
              <Button
                type="text"
                size="small"
                icon={<FileTextOutlined style={b.invoiceSent ? { color: '#52c41a' } : undefined} />}
                onClick={() => onSendInvoice(b.id)}
              />
            </Tooltip>
          )}
          <Tooltip title="Wiederherstellen">
            <Button
              type="text"
              size="small"
              icon={<UndoOutlined style={{ fontSize: 12 }} />}
              onClick={() => onUpdate(b.id, { status: 'confirmed' })}
            />
          </Tooltip>
        </Space>
      }
      styles={{ body: expanded ? undefined : { display: 'none' } }}
    >
      <BookingCardBody b={b} />
    </Card>
  );
}

export default function BookingList({ bookings, onUpdate, onSendEmail, onSendInvoice, onMigrateToClient }: {
  bookings: AdminBooking[];
  onUpdate: (id: number, updates: AdminBookingUpdate) => void;
  onSendEmail?: (id: number, type: 'intro' | 'reminder') => void;
  onSendInvoice?: (id: number) => void;
  onMigrateToClient?: (id: number) => void;
}) {
  const [archivedExpanded, setArchivedExpanded] = useState(false);

  const active = bookings.filter(b => b.status === 'pending_payment' || b.status === 'confirmed');
  const archived = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');

  if (bookings.length === 0) {
    return (
      <Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: '24px 0' }}>
        Keine Buchungen im gewählten Zeitraum.
      </Text>
    );
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {active.length > 0 && (
        <div>
          <Typography.Title level={5} style={{ marginBottom: 12 }}>
            Aktiv ({active.length})
          </Typography.Title>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {active.map(b => (
              <Card
                key={b.id}
                size="default"
                title={(
                  <span>
                    {b.clientName}
                    {b.bookingNumber && <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>{b.bookingNumber}</Text>}
                    {b.status === 'pending_payment' && <Tag color="orange" style={{ marginLeft: 8 }}>Zahlung ausstehend</Tag>}
                    {b.status === 'confirmed' && !isPaymentConfirmed(b) && <Tag color="gold" style={{ marginLeft: 8 }}>Unbezahlt</Tag>}
                    {isPaymentConfirmed(b) && <Tag color="green" style={{ marginLeft: 8 }}>Bezahlt</Tag>}
                  </span>
                )}
                style={{
                  borderColor: b.status === 'pending_payment' ? '#fbbf24' : undefined,
                }}
                extra={
                  b.status === 'pending_payment' ? (
                    <Space size={0}>
                      <Tooltip title={b.paymentMethod === 'stripe' ? 'Kreditkarte' : b.paymentMethod === 'paypal' ? 'PayPal' : 'Überweisung'}>
                        {b.paymentMethod === 'stripe' ? <CreditCardOutlined style={{ color: '#6366f1', marginRight: 8 }} /> : b.paymentMethod === 'paypal' ? <EuroCircleOutlined style={{ color: '#0070ba', marginRight: 8 }} /> : <BankOutlined style={{ color: '#6366f1', marginRight: 8 }} />}
                      </Tooltip>
                      {onSendEmail && canSendReminder(b) && (
                        <Tooltip title={b.reminderSent ? 'Zahlungserinnerung erneut senden' : 'Zahlungserinnerung senden'}>
                          <Button
                            type="text"
                            icon={<NotificationOutlined style={b.reminderSent ? { color: '#52c41a' } : undefined} />}
                            onClick={() => onSendEmail(b.id, 'reminder')}
                          />
                        </Tooltip>
                      )}
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
                              onOk: () => onUpdate(b.id, { status: 'confirmed', paymentConfirmed: true }),
                            });
                          }}
                        />
                      </Tooltip>
                      <Tooltip title="Termin starten">
                        <Button
                          type="text"
                          icon={<PlayCircleOutlined />}
                          onClick={() => onUpdate(b.id, { status: 'confirmed' })}
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
                    <Space size={0}>
                      <Tooltip title={b.paymentMethod === 'stripe' ? 'Kreditkarte' : b.paymentMethod === 'paypal' ? 'PayPal' : b.paymentMethod === 'wire_transfer' ? 'Überweisung' : ''}>
                        {b.paymentMethod === 'stripe' ? <CreditCardOutlined style={{ color: '#6366f1', marginRight: 4 }} /> : b.paymentMethod === 'paypal' ? <EuroCircleOutlined style={{ color: '#0070ba', marginRight: 4 }} /> : b.paymentMethod === 'wire_transfer' ? <BankOutlined style={{ color: '#6366f1', marginRight: 4 }} /> : null}
                      </Tooltip>
                      {canConfirmPayment(b) && (
                        <Tooltip title="Zahlung bestätigen">
                          <Button
                            type="text"
                            icon={<EuroCircleOutlined style={isPaymentConfirmed(b) ? { color: '#52c41a' } : undefined} />}
                            onClick={() => {
                              Modal.confirm({
                                title: 'Zahlung bestätigen',
                                content: `Zahlung von ${b.clientName} als eingegangen bestätigen?`,
                                okText: 'Bestätigen',
                                cancelText: 'Abbrechen',
                                onOk: () => onUpdate(b.id, { paymentConfirmed: true }),
                              });
                            }}
                          />
                        </Tooltip>
                      )}
                      {onSendEmail && canSendReminder(b) && (
                        <Tooltip title={b.reminderSent ? 'Zahlungserinnerung erneut senden' : 'Zahlungserinnerung senden'}>
                          <Button
                            type="text"
                            icon={<NotificationOutlined style={b.reminderSent ? { color: '#52c41a' } : undefined} />}
                            onClick={() => onSendEmail(b.id, 'reminder')}
                          />
                        </Tooltip>
                      )}
                      {onSendEmail && (
                        <Tooltip title={b.introEmailSent ? 'Termininfo erneut senden' : 'Termininfo senden'}>
                          <Button
                            type="text"
                            icon={<MailOutlined style={b.introEmailSent ? { color: '#52c41a' } : undefined} />}
                            onClick={() => onSendEmail(b.id, 'intro')}
                          />
                        </Tooltip>
                      )}
                      {onSendInvoice && canSendInvoice(b) && (
                        <Tooltip title={b.invoiceSent ? 'Rechnung erneut senden' : 'Rechnung senden'}>
                          <Button
                            type="text"
                            icon={<FileTextOutlined style={b.invoiceSent ? { color: '#52c41a' } : undefined} />}
                            onClick={() => onSendInvoice(b.id)}
                          />
                        </Tooltip>
                      )}
                      {onMigrateToClient && !b.hasClient && (
                        <Tooltip title="Patient anlegen">
                          <Button
                            type="text"
                            icon={<UserAddOutlined />}
                            onClick={() => onMigrateToClient(b.id)}
                          />
                        </Tooltip>
                      )}
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
                  )
                }
              >
                <BookingCardBody b={b} />
              </Card>
            ))}
          </Space>
        </div>
      )}

      {archived.length > 0 && (
        <div>
          <Typography.Title
            level={5}
            style={{ marginBottom: 12, cursor: 'pointer', userSelect: 'none' }}
            onClick={() => setArchivedExpanded(!archivedExpanded)}
          >
            {archivedExpanded ? <DownOutlined style={{ fontSize: 12, marginRight: 8 }} /> : <RightOutlined style={{ fontSize: 12, marginRight: 8 }} />}
            Archiviert ({archived.length})
          </Typography.Title>
          {archivedExpanded && (
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {archived.map(b => (
                <ArchivedBookingCard key={b.id} b={b} onUpdate={onUpdate} onSendInvoice={onSendInvoice} />
              ))}
            </Space>
          )}
        </div>
      )}
    </Space>
  );
}
