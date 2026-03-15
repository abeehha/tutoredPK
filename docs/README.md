# TutoredPK Backend (Phase 2) - Quick Guide

## 1) What this backend includes

Implemented features:
- Authentication (register, login, email verification, logout, forgot/reset password)
- Role-based access (`student`, `tutor`, `academy`, `admin`)
- Tutor subscription flow
- Academy subscription flow
- Student booking + escrow confirmation flow
- Academy enrollment flow
- Tutor withdrawal + admin review flow
- Chat flow (allowed role pairs)
- Review flow
- Search and discovery filters

---

## 2) Setup

1. Install dependencies:
   - `npm install`
2. Create `.env` from `.env.example` and fill your real values.
3. Make sure PostgreSQL/Supabase DB is ready.
4. Run migration file(s) from `docs/database/` if needed.

---

## 3) Run

1. Start API server:
   - `npm run dev`
2. Open health check:
   - `http://localhost:4001/health`
3. Open API docs:
   - `http://localhost:4001/api-docs`

---

## 4) Tester pages

Role-based tester pages:
- `temp/student-tester.html`
- `temp/tutor-tester.html`
- `temp/academy-tester.html`
- `temp/admin-tester.html`

Master page:
- `temp/auth-tester.html`

Tip:
- Keep backend running on port `4001`.
- Role pages are designed to keep flow simple and reduce confusion.

---

## 5) Basic testing flow (recommended order)

1. Auth + RBAC
   - Register user, verify email, login, check `/auth/me`, test role access.

2. Tutor subscription
   - Tutor top-up -> purchase plan -> verify status.
   - Try buying again while active (should be blocked).

3. Academy subscription + enrollment
   - Academy top-up -> purchase plan -> seed courses.
   - Student loads academies/courses -> enrolls.

4. Session booking escrow
   - Student top-up -> select tutor -> book slot (hold payment).
   - Student + tutor confirm after session time.
   - Both yes = release, one no = refund.

5. Withdrawal flow
   - Tutor requests withdrawal.
   - Admin approves or rejects.

6. Review flow
   - Student submits review only for completed + released booking.

7. Discovery + chat
   - Student runs tutor/academy filters.
   - Chat between allowed role pairs.

---

## 6) Submission files (important)

- `docs/api/swagger.yaml`
- `docs/database/migration_phase2_consolidated.sql`
- Any required project explanation PDF/document
- Supporting screenshots/logs from your manual tests

