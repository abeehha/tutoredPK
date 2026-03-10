const pool = require("../config/db");
const supabase = require("../config/supabase");
const HttpError = require("../utils/httpError");

module.exports = async function auth(req, res, next) {
  const authorization = req.headers.authorization || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new HttpError(401, "UNAUTHORIZED", "Missing or invalid Authorization header");
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user?.email) {
    throw new HttpError(401, "INVALID_TOKEN", "Invalid or expired token");
  }

  const accountQuery = `
    SELECT account_id, email, role, is_active, created_at
    FROM accounts
    WHERE email = $1
    LIMIT 1
  `;

  const accountResult = await pool.query(accountQuery, [data.user.email.toLowerCase()]);
  if (accountResult.rowCount === 0) {
    throw new HttpError(403, "ACCOUNT_NOT_PROVISIONED", "Account is not provisioned in backend database");
  }

  const account = accountResult.rows[0];
  if (!account.is_active) {
    throw new HttpError(403, "ACCOUNT_INACTIVE", "Account is inactive");
  }

  req.user = {
    account_id: account.account_id,
    email: account.email,
    role: account.role,
    created_at: account.created_at,
    supabase_user_id: data.user.id,
  };

  next();
};
