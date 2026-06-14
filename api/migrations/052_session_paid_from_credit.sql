-- Migration 052: track sessions settled from a cancellation credit (Guthaben)
-- A paid session that is later cancelled becomes a credit "source"; a non-cancelled
-- session settled from that credit is a "consumer" (paid_from_credit = 1) and is not
-- counted as new money received.
ALTER TABLE therapy_sessions
  ADD COLUMN paid_from_credit TINYINT(1) NOT NULL DEFAULT 0 AFTER payment_status;
