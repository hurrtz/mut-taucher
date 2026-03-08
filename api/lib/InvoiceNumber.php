<?php

/**
 * Generate the next sequential invoice number in format YY-NNNN.
 * Uses the invoice_numbers table as an atomic counter.
 */
function generateInvoiceNumber(PDO $db): string {
    $yearPrefix = date('y'); // e.g. "26"

    // Atomically get next sequence number for this year
    $db->beginTransaction();
    try {
        $stmt = $db->prepare(
            'SELECT MAX(sequence_number) as max_seq FROM invoice_numbers WHERE year_prefix = ?'
        );
        $stmt->execute([$yearPrefix]);
        $row = $stmt->fetch();
        $nextSeq = ($row['max_seq'] ?? 0) + 1;

        $invoiceNumber = $yearPrefix . '-' . str_pad($nextSeq, 4, '0', STR_PAD_LEFT);

        $stmt = $db->prepare(
            'INSERT INTO invoice_numbers (year_prefix, sequence_number, invoice_number) VALUES (?, ?, ?)'
        );
        $stmt->execute([$yearPrefix, $nextSeq, $invoiceNumber]);

        $db->commit();
        return $invoiceNumber;
    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }
}
