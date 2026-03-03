import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminBooking } from '../../lib/useAdminBooking';
import { useAdminClients } from '../../lib/useAdminClients';
import { useAdminStyles } from '../styles';
import BookingList from '../components/BookingList';
import { Typography, Alert } from 'antd';

export default function BookingsTab() {
  const styles = useAdminStyles();
  const { bookings, error, fetchBookings, updateBooking, sendEmail, sendBookingInvoice } = useAdminBooking();
  const { migrateBookingToClient } = useAdminClients();
  const navigate = useNavigate();

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleMigrate = useCallback(async (bookingId: number) => {
    const clientId = await migrateBookingToClient(bookingId);
    if (clientId) navigate('/admin/kunden');
  }, [migrateBookingToClient, navigate]);

  return (
    <div style={styles.pageContent}>
      <div style={styles.headerRow}>
        <Typography.Title style={{ margin: 0 }}>Erstgespräche</Typography.Title>
      </div>
      {error && <Alert message={error} type="error" showIcon closable style={{ marginBottom: styles.token.marginMD }} />}
      <BookingList
        bookings={bookings}
        onUpdate={updateBooking}
        onSendEmail={sendEmail}
        onSendInvoice={sendBookingInvoice}
        onMigrateToClient={handleMigrate}
      />
    </div>
  );
}
