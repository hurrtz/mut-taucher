import { useEffect } from 'react';
import { useAdminBooking } from '../../lib/useAdminBooking';
import { useAdminStyles } from '../styles';
import BookingList from '../components/BookingList';
import { Typography, Alert } from 'antd';

export default function BookingsTab() {
  const styles = useAdminStyles();
  const { bookings, error, fetchBookings, updateBooking, sendEmail, sendBookingInvoice } = useAdminBooking();

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

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
      />
    </div>
  );
}
