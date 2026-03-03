-- Per-participant attendance tracking for group sessions
-- Adds attendance_status to group_session_payments and simplifies group_sessions.status

-- 1. Add attendance_status column to group_session_payments
ALTER TABLE group_session_payments
  ADD COLUMN attendance_status ENUM('attended','no_show','cancelled') DEFAULT NULL
  AFTER payment_status;

-- 2. Migrate existing no_show sessions to completed (attendance is now per-participant)
UPDATE group_sessions SET status = 'completed' WHERE status = 'no_show';

-- 3. Simplify group_sessions.status enum (remove no_show)
ALTER TABLE group_sessions
  MODIFY COLUMN status ENUM('scheduled','completed','cancelled') NOT NULL DEFAULT 'scheduled';
