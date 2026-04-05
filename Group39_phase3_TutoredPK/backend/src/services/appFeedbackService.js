const pool = require("../config/db");
const HttpError = require("../utils/httpError");

let ensureTablePromise = null;

function ensureFeedbackTable() {
  if (!ensureTablePromise) {
    ensureTablePromise = pool.query(`
      CREATE TABLE IF NOT EXISTS app_feedback (
        feedback_id SERIAL PRIMARY KEY,
        account_id INTEGER NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL,
        subject VARCHAR(150) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'open',
        admin_reply TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        replied_at TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_app_feedback_account ON app_feedback(account_id);
      CREATE INDEX IF NOT EXISTS idx_app_feedback_status ON app_feedback(status);
      CREATE INDEX IF NOT EXISTS idx_app_feedback_created ON app_feedback(created_at DESC);
    `);
  }

  return ensureTablePromise;
}

async function submitFeedback({ accountId, role, subject, message }) {
  await ensureFeedbackTable();

  const result = await pool.query(
    `
    INSERT INTO app_feedback (account_id, role, subject, message, status)
    VALUES ($1, $2, $3, $4, 'open')
    RETURNING feedback_id, account_id, role, subject, message, status, admin_reply, created_at, replied_at
    `,
    [accountId, role, subject, message]
  );

  return result.rows[0];
}

async function getMyFeedback(accountId) {
  await ensureFeedbackTable();

  const result = await pool.query(
    `
    SELECT feedback_id, role, subject, message, status, admin_reply, created_at, replied_at
    FROM app_feedback
    WHERE account_id = $1
    ORDER BY created_at DESC
    `,
    [accountId]
  );

  return result.rows;
}

async function getAllFeedback() {
  await ensureFeedbackTable();

  const result = await pool.query(
    `
    SELECT
      f.feedback_id,
      f.account_id,
      f.role,
      f.subject,
      f.message,
      f.status,
      f.admin_reply,
      f.created_at,
      f.replied_at,
      a.email
    FROM app_feedback f
    JOIN accounts a ON a.account_id = f.account_id
    ORDER BY
      CASE WHEN f.status = 'open' THEN 0 ELSE 1 END,
      f.created_at DESC
    `
  );

  return result.rows;
}

async function replyToFeedback(feedbackId, reply) {
  await ensureFeedbackTable();

  const result = await pool.query(
    `
    UPDATE app_feedback
    SET admin_reply = $2, status = 'replied', replied_at = NOW()
    WHERE feedback_id = $1
    RETURNING feedback_id, account_id, role, subject, message, status, admin_reply, created_at, replied_at
    `,
    [feedbackId, reply]
  );

  if (result.rowCount === 0) {
    throw new HttpError(404, "FEEDBACK_NOT_FOUND", "Feedback entry not found");
  }

  return result.rows[0];
}

module.exports = {
  submitFeedback,
  getMyFeedback,
  getAllFeedback,
  replyToFeedback,
};
