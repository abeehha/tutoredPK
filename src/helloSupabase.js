require("dotenv").config();

const express = require("express");
const { Pool } = require("pg");

const app = express();
const PORT = Number(process.env.SUPABASE_TEST_PORT || 5050);
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL in .env");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  connectionTimeoutMillis: 10000,
  max: 3,
});

async function queryWithRetry(sql, params = [], attempts = 3) {
  let lastError;
  for (let i = 1; i <= attempts; i += 1) {
    try {
      return await pool.query(sql, params);
    } catch (err) {
      lastError = err;
      const retryable = err.code === "EAI_AGAIN" || err.code === "ENOTFOUND";
      if (!retryable || i === attempts) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }
  throw lastError;
}

app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "Hello World from Supabase test app",
  });
});

app.get("/db-time", async (req, res, next) => {
  try {
    const result = await queryWithRetry("select now() as db_time");
    res.json({
      ok: true,
      db_time: result.rows[0].db_time,
    });
  } catch (err) {
    next(err);
  }
});

app.get("/tables", async (req, res, next) => {
  try {
    const result = await queryWithRetry(
      `select table_name
       from information_schema.tables
       where table_schema = 'public'
       order by table_name
       limit 20`
    );
    res.json({
      ok: true,
      tables: result.rows.map((r) => r.table_name),
    });
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error("Supabase test error:", err.message);
  res.status(500).json({
    ok: false,
    error: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`Supabase test app running on http://localhost:${PORT}`);
});
