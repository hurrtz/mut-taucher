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

/**
 * Resolve the effective cost (in cents) for a session.
 * Returns the override when set (including the legitimate value 0),
 * otherwise falls back to the therapy/group default.
 */
function resolveSessionCost(?int $override, int $default): int {
    return $override ?? $default;
}

/**
 * Parse a cost-override input value (cents) from a request body.
 * Returns null when the value is missing, explicit null, or an empty string;
 * otherwise casts to an unsigned integer (in cents).
 */
function parseOverrideCents(mixed $raw): ?int {
    return ($raw === null || $raw === '') ? null : (int)$raw;
}

/**
 * Parse an invoice number in format YY-NNNN into its components.
 * Returns null on malformed input.
 */
function parseInvoiceNumber(string $number): ?array {
    if (!preg_match('/^(\d{2})-(\d{4})$/', $number, $m)) {
        return null;
    }
    return [
        'year_prefix'     => $m[1],
        'sequence_number' => (int)$m[2],
    ];
}

/**
 * Thrown when a caller tries to reserve an invoice number that is already taken.
 */
class InvoiceNumberTaken extends RuntimeException {}

/**
 * Reserve a specific externally-issued invoice number so it won't be auto-generated later.
 * Throws InvoiceNumberTaken if the number is already in use.
 * Throws RuntimeException on malformed input.
 */
function reserveInvoiceNumber(PDO $db, string $number): void {
    $parts = parseInvoiceNumber($number);
    if ($parts === null) {
        throw new RuntimeException("Malformed invoice number: {$number}");
    }

    try {
        $stmt = $db->prepare(
            'INSERT INTO invoice_numbers (year_prefix, sequence_number, invoice_number) VALUES (?, ?, ?)'
        );
        $stmt->execute([$parts['year_prefix'], $parts['sequence_number'], $number]);
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') {
            throw new InvoiceNumberTaken("Invoice number already reserved: {$number}", 0, $e);
        }
        throw $e;
    }
}
