BEGIN;

CREATE TABLE IF NOT EXISTS student_wallets (
  wallet_id   SERIAL PRIMARY KEY,
  student_id  INTEGER NOT NULL UNIQUE REFERENCES students(student_id) ON DELETE CASCADE,
  balance     DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (balance >= 0)
);

CREATE INDEX IF NOT EXISTS idx_student_wallets_student ON student_wallets(student_id);

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS student_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS tutor_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS confirmation_status VARCHAR(30) NOT NULL DEFAULT 'pending'
    CHECK (confirmation_status IN ('pending','confirmed_by_both','disputed'));

CREATE INDEX IF NOT EXISTS idx_bookings_confirmation_status ON bookings(confirmation_status);
CREATE INDEX IF NOT EXISTS idx_bookings_session_datetime ON bookings(session_datetime);

COMMIT;
