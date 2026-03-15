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

ALTER TABLE withdrawal_requests
  ADD COLUMN IF NOT EXISTS provider VARCHAR(20),
  ADD COLUMN IF NOT EXISTS account_title VARCHAR(100),
  ADD COLUMN IF NOT EXISTS account_number VARCHAR(40),
  ADD COLUMN IF NOT EXISTS destination_note TEXT,
  ADD COLUMN IF NOT EXISTS reference_code VARCHAR(80),
  ADD COLUMN IF NOT EXISTS review_note TEXT;

CREATE INDEX IF NOT EXISTS idx_withdrawal_reference_code ON withdrawal_requests(reference_code);

CREATE TABLE IF NOT EXISTS academy_tutor_members (
  membership_id SERIAL PRIMARY KEY,
  academy_id INTEGER NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  tutor_id INTEGER NOT NULL REFERENCES tutors(tutor_id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (academy_id, tutor_id)
);

CREATE INDEX IF NOT EXISTS idx_academy_tutor_members_academy ON academy_tutor_members(academy_id);
CREATE INDEX IF NOT EXISTS idx_academy_tutor_members_tutor ON academy_tutor_members(tutor_id);
CREATE INDEX IF NOT EXISTS idx_academy_tutor_members_active ON academy_tutor_members(is_active);

CREATE TABLE IF NOT EXISTS academy_enrollments (
  enrollment_id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  academy_id INTEGER NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES academy_courses(course_id) ON DELETE CASCADE,
  amount_paid DECIMAL(10,2) NOT NULL CHECK (amount_paid >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled','cancelled','completed')),
  enrolled_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_academy_enrollments_student ON academy_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_academy_enrollments_academy ON academy_enrollments(academy_id);
CREATE INDEX IF NOT EXISTS idx_academy_enrollments_course ON academy_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_academy_enrollments_status ON academy_enrollments(status);

CREATE TABLE IF NOT EXISTS academy_enrollment_payments (
  payment_id SERIAL PRIMARY KEY,
  enrollment_id INTEGER NOT NULL UNIQUE REFERENCES academy_enrollments(enrollment_id) ON DELETE CASCADE,
  amount_total DECIMAL(10,2) NOT NULL CHECK (amount_total >= 0),
  currency VARCHAR(10) NOT NULL DEFAULT 'PKR',
  payment_method VARCHAR(50) NOT NULL DEFAULT 'student_wallet',
  payment_status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (payment_status IN ('pending','completed','refunded')),
  transaction_reference VARCHAR(120),
  paid_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_academy_enrollment_payments_status ON academy_enrollment_payments(payment_status);

COMMIT;

