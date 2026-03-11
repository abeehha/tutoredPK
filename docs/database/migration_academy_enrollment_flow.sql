BEGIN;

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
