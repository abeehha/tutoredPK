const Joi = require("joi");
const { createClient } = require("@supabase/supabase-js");
const pool = require("../config/db");
const supabase = require("../config/supabase");
const HttpError = require("../utils/httpError");

const registerSchema = Joi.object({
  email: Joi.string().trim().lowercase().email({ tlds: { allow: true } }).required(),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/)
    .required(),
  role: Joi.string().valid("student", "tutor", "academy").required(),
  name: Joi.string().trim().min(2).max(100).when("role", {
    is: Joi.valid("student", "tutor"),
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  city: Joi.string().trim().max(100).when("role", {
    is: Joi.valid("student", "tutor", "academy"),
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  country: Joi.string().trim().max(100).when("role", {
    is: Joi.valid("student", "tutor", "academy"),
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  phone: Joi.string().trim().pattern(/^[0-9+\-\s()]{7,20}$/).when("role", {
    is: "student",
    then: Joi.required(),
    otherwise: Joi.allow("", null),
  }),
  bio: Joi.string().trim().max(1000).allow("", null),
  education_level: Joi.string().trim().max(100).when("role", {
    is: "tutor",
    then: Joi.required(),
    otherwise: Joi.allow("", null),
  }),
  education_history: Joi.string().trim().max(2000).allow("", null),
  work_history: Joi.string().trim().max(2000).allow("", null),
  teaching_mode: Joi.string().valid("online", "physical", "hybrid").when("role", {
    is: "tutor",
    then: Joi.required(),
    otherwise: Joi.allow(null),
  }),
  profile_picture_url: Joi.string().uri().max(500).allow("", null),
  academy_name: Joi.string().trim().min(2).max(200).when("role", {
    is: "academy",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  description: Joi.string().trim().max(2000).allow("", null),
  logo_url: Joi.string().uri().max(500).allow("", null),
  about: Joi.string().trim().max(2000).allow("", null),
  founded_year: Joi.number().integer().min(1800).max(2100).allow(null),
  owner_name: Joi.string().trim().max(100).when("role", {
    is: "academy",
    then: Joi.required(),
    otherwise: Joi.allow("", null),
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email({ tlds: { allow: true } }).required(),
  password: Joi.string().required(),
});

const resendVerificationSchema = Joi.object({
  email: Joi.string().trim().lowercase().email({ tlds: { allow: true } }).required(),
});

const logoutSchema = Joi.object({
  refresh_token: Joi.string().trim().min(10).optional(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().lowercase().email({ tlds: { allow: true } }).required(),
});

const resetPasswordSchema = Joi.object({
  access_token: Joi.string().trim().min(10).required(),
  refresh_token: Joi.string().trim().min(10).required(),
  new_password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/)
    .required(),
});

function normalizeNullable(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  return value;
}

function getFrontendBaseUrl() {
  return process.env.FRONTEND_URL || "http://localhost:5173";
}

async function createRoleProfile(client, accountId, payload) {
  if (payload.role === "student") {
    await client.query(
      `
      INSERT INTO students (account_id, name, city, country, phone)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        accountId,
        payload.name,
        normalizeNullable(payload.city),
        normalizeNullable(payload.country),
        normalizeNullable(payload.phone),
      ]
    );
    return;
  }

  if (payload.role === "tutor") {
    await client.query(
      `
      INSERT INTO tutors (
        account_id, name, bio, education_level, city, country,
        education_history, work_history, teaching_mode, profile_picture_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
      [
        accountId,
        payload.name,
        normalizeNullable(payload.bio),
        normalizeNullable(payload.education_level),
        normalizeNullable(payload.city),
        normalizeNullable(payload.country),
        normalizeNullable(payload.education_history),
        normalizeNullable(payload.work_history),
        normalizeNullable(payload.teaching_mode),
        normalizeNullable(payload.profile_picture_url),
      ]
    );
    return;
  }

  if (payload.role === "academy") {
    await client.query(
      `
      INSERT INTO academies (
        account_id, academy_name, description, logo_url,
        city, country, about, founded_year, owner_name
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      [
        accountId,
        payload.academy_name,
        normalizeNullable(payload.description),
        normalizeNullable(payload.logo_url),
        normalizeNullable(payload.city),
        normalizeNullable(payload.country),
        normalizeNullable(payload.about),
        normalizeNullable(payload.founded_year),
        normalizeNullable(payload.owner_name),
      ]
    );
  }
}

async function getRoleProfile(accountId, role) {
  if (role === "student") {
    const result = await pool.query(
      `SELECT student_id, name, city, country, phone FROM students WHERE account_id = $1 LIMIT 1`,
      [accountId]
    );
    return result.rows[0] || null;
  }

  if (role === "tutor") {
    const result = await pool.query(
      `SELECT tutor_id, name, bio, education_level, city, country, is_verified, teaching_mode
       FROM tutors WHERE account_id = $1 LIMIT 1`,
      [accountId]
    );
    return result.rows[0] || null;
  }

  if (role === "academy") {
    const result = await pool.query(
      `SELECT academy_id, academy_name, city, country, is_verified, owner_name
       FROM academies WHERE account_id = $1 LIMIT 1`,
      [accountId]
    );
    return result.rows[0] || null;
  }

  return null;
}

async function provisionLocalAccountIfMissing(email, profilePayload) {
  const existing = await pool.query(
    `SELECT account_id, role, email, created_at FROM accounts WHERE email = $1 LIMIT 1`,
    [email]
  );

  if (existing.rowCount > 0) {
    return existing.rows[0];
  }

  if (!profilePayload || !profilePayload.role) {
    throw new HttpError(
      409,
      "MISSING_PROFILE_METADATA",
      "Account metadata not found. Please register again before login."
    );
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const accountResult = await client.query(
      `
      INSERT INTO accounts (role, email, password_hash, is_active)
      VALUES ($1, $2, $3, TRUE)
      RETURNING account_id, role, email, created_at
      `,
      [profilePayload.role, email, "managed_by_supabase"]
    );

    const account = accountResult.rows[0];
    await createRoleProfile(client, account.account_id, profilePayload);

    await client.query("COMMIT");
    return account;
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[auth:provision] rollback for", email, err.code || "ERROR", err.message);
    if (err.code === "23505") {
      const row = await pool.query(
        `SELECT account_id, role, email, created_at FROM accounts WHERE email = $1 LIMIT 1`,
        [email]
      );
      if (row.rowCount > 0) {
        return row.rows[0];
      }
    }
    throw err;
  } finally {
    client.release();
  }
}

exports.register = async (req, res) => {
  const { error, value } = registerSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    throw new HttpError(
      400,
      "VALIDATION_ERROR",
      "Invalid registration payload",
      error.details.map((d) => d.message)
    );
  }

  const email = value.email.toLowerCase();

  const existingAccount = await pool.query(`SELECT account_id FROM accounts WHERE email = $1 LIMIT 1`, [email]);
  if (existingAccount.rowCount > 0) throw new HttpError(409, "DUPLICATE_EMAIL", "Email already exists in backend database");

  const metadata = {
    role: value.role,
    name: normalizeNullable(value.name),
    city: normalizeNullable(value.city),
    country: normalizeNullable(value.country),
    phone: normalizeNullable(value.phone),
    bio: normalizeNullable(value.bio),
    education_level: normalizeNullable(value.education_level),
    education_history: normalizeNullable(value.education_history),
    work_history: normalizeNullable(value.work_history),
    teaching_mode: normalizeNullable(value.teaching_mode),
    profile_picture_url: normalizeNullable(value.profile_picture_url),
    academy_name: normalizeNullable(value.academy_name),
    description: normalizeNullable(value.description),
    logo_url: normalizeNullable(value.logo_url),
    about: normalizeNullable(value.about),
    founded_year: normalizeNullable(value.founded_year),
    owner_name: normalizeNullable(value.owner_name),
  };

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: value.password,
    options: {
      emailRedirectTo: process.env.SUPABASE_EMAIL_REDIRECT_TO || getFrontendBaseUrl(),
      data: metadata,
    },
  });

  if (authError) {
    console.error("[auth:register] supabase signup failed for", email, authError.message);
    throw new HttpError(400, "SUPABASE_SIGNUP_FAILED", authError.message);
  }

  if (authData?.session) {
    throw new HttpError(
      409,
      "EMAIL_VERIFICATION_NOT_ENFORCED",
      "Email verification is required. Enable 'Confirm email' in Supabase Auth settings."
    );
  }

  res.status(201).json({
    success: true,
    data: {
      account: null,
      supabase_user_id: authData?.user?.id || null,
      email_confirmation_required: true,
      message: "Signup pending. Please verify your email before login.",
    },
  });
};

exports.login = async (req, res) => {
  const { error, value } = loginSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    throw new HttpError(
      400,
      "VALIDATION_ERROR",
      "Invalid login payload",
      error.details.map((d) => d.message)
    );
  }

  const { data, error: authError } = await supabase.auth.signInWithPassword({
    email: value.email.toLowerCase(),
    password: value.password,
  });

  if (authError) {
    if ((authError.message || "").toLowerCase().includes("email not confirmed")) {
      throw new HttpError(401, "EMAIL_NOT_VERIFIED", "Please verify your email before login");
    }
    throw new HttpError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  if (!data?.session?.access_token) {
    throw new HttpError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const email = (data.user.email || "").toLowerCase();
  await provisionLocalAccountIfMissing(email, data.user.user_metadata || null);

  res.json({
    success: true,
    data: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      token_type: data.session.token_type,
      expires_in: data.session.expires_in,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    },
  });
};

exports.resendVerification = async (req, res) => {
  const { error, value } = resendVerificationSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    throw new HttpError(
      400,
      "VALIDATION_ERROR",
      "Invalid resend verification payload",
      error.details.map((d) => d.message)
    );
  }

  const { error: resendError } = await supabase.auth.resend({
    type: "signup",
    email: value.email,
    options: {
      emailRedirectTo: process.env.SUPABASE_EMAIL_REDIRECT_TO || getFrontendBaseUrl(),
    },
  });

  if (resendError) {
    console.error("[auth:resend] resend failed for", value.email, resendError.message);
    throw new HttpError(400, "RESEND_VERIFICATION_FAILED", resendError.message);
  }

  res.json({
    success: true,
    data: {
      message: "Verification email sent if the account exists.",
    },
  });
};

exports.me = async (req, res) => {
  const profile = await getRoleProfile(req.user.account_id, req.user.role);

  res.json({
    success: true,
    data: {
      account_id: req.user.account_id,
      email: req.user.email,
      role: req.user.role,
      supabase_user_id: req.user.supabase_user_id,
      profile,
    },
  });
};

exports.logout = async (req, res) => {
  const { error, value } = logoutSchema.validate(req.body || {}, { abortEarly: false, stripUnknown: true });
  if (error) {
    throw new HttpError(
      400,
      "VALIDATION_ERROR",
      "Invalid logout payload",
      error.details.map((d) => d.message)
    );
  }

  if (value.refresh_token) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { error: setSessionError } = await client.auth.setSession({
      access_token: req.auth_token,
      refresh_token: value.refresh_token,
    });

    if (setSessionError) {
      throw new HttpError(400, "SUPABASE_LOGOUT_FAILED", setSessionError.message);
    }

    const { error: signOutError } = await client.auth.signOut({ scope: "local" });
    if (signOutError) {
      throw new HttpError(400, "SUPABASE_LOGOUT_FAILED", signOutError.message);
    }
  }

  res.json({
    success: true,
    data: {
      message: "Logged out. Clear access token and refresh token from client storage.",
      revoked: Boolean(value.refresh_token),
    },
  });
};

exports.forgotPassword = async (req, res) => {
  const { error, value } = forgotPasswordSchema.validate(req.body || {}, { abortEarly: false, stripUnknown: true });
  if (error) {
    throw new HttpError(
      400,
      "VALIDATION_ERROR",
      "Invalid forgot-password payload",
      error.details.map((d) => d.message)
    );
  }

  const { error: resetError } = await supabase.auth.resetPasswordForEmail(value.email, {
    redirectTo:
      process.env.SUPABASE_PASSWORD_RESET_REDIRECT_TO ||
      process.env.SUPABASE_EMAIL_REDIRECT_TO ||
      `${getFrontendBaseUrl()}/reset-password`,
  });

  if (resetError) {
    throw new HttpError(400, "PASSWORD_RESET_EMAIL_FAILED", resetError.message);
  }

  res.json({
    success: true,
    data: {
      message: "If this email exists, password reset instructions have been sent.",
    },
  });
};

exports.resetPassword = async (req, res) => {
  const { error, value } = resetPasswordSchema.validate(req.body || {}, { abortEarly: false, stripUnknown: true });
  if (error) {
    throw new HttpError(
      400,
      "VALIDATION_ERROR",
      "Invalid reset-password payload",
      error.details.map((d) => d.message)
    );
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error: setSessionError } = await client.auth.setSession({
    access_token: value.access_token,
    refresh_token: value.refresh_token,
  });

  if (setSessionError) {
    throw new HttpError(400, "RESET_SESSION_INVALID", setSessionError.message);
  }

  const { error: updateError } = await client.auth.updateUser({
    password: value.new_password,
  });

  if (updateError) {
    throw new HttpError(400, "PASSWORD_RESET_FAILED", updateError.message);
  }

  const { error: signOutError } = await client.auth.signOut({ scope: "local" });
  if (signOutError) {
    throw new HttpError(400, "PASSWORD_RESET_SIGNOUT_FAILED", signOutError.message);
  }

  res.json({
    success: true,
    data: {
      message: "Password reset successful. Please login again.",
    },
  });
};
