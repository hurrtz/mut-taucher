<?php

/**
 * Generate the next sequential booking number in format BYY-NNNN.
 * Uses the booking_numbers table as an atomic counter.
 */
function generateBookingNumber(PDO $db): string {
    $yearPrefix = date('y'); // e.g. "26"

    $db->beginTransaction();
    try {
        $stmt = $db->prepare(
            'SELECT MAX(sequence_number) as max_seq FROM booking_numbers WHERE year_prefix = ?'
        );
        $stmt->execute([$yearPrefix]);
        $row = $stmt->fetch();
        $nextSeq = (int)($row['max_seq'] ?? 0) + 1;

        $bookingNumber = 'B' . $yearPrefix . '-' . str_pad((string)$nextSeq, 4, '0', STR_PAD_LEFT);

        $stmt = $db->prepare(
            'INSERT INTO booking_numbers (year_prefix, sequence_number, booking_number) VALUES (?, ?, ?)'
        );
        $stmt->execute([$yearPrefix, $nextSeq, $bookingNumber]);

        $db->commit();
        return $bookingNumber;
    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }
}
