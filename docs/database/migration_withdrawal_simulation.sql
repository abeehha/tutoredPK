BEGIN;

ALTER TABLE withdrawal_requests
  ADD COLUMN IF NOT EXISTS provider VARCHAR(20),
  ADD COLUMN IF NOT EXISTS account_title VARCHAR(100),
  ADD COLUMN IF NOT EXISTS account_number VARCHAR(40),
  ADD COLUMN IF NOT EXISTS destination_note TEXT,
  ADD COLUMN IF NOT EXISTS reference_code VARCHAR(80),
  ADD COLUMN IF NOT EXISTS review_note TEXT;

CREATE INDEX IF NOT EXISTS idx_withdrawal_reference_code ON withdrawal_requests(reference_code);

COMMIT;
