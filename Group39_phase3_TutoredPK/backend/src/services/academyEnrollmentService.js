const pool = require("../config/db");
const HttpError = require("../utils/httpError");

const DEMO_COURSES = [
  { subject_name: "Mathematics", course_title: "Mathematics Foundation", course_description: "Core math concepts and exam practice", capacity: 30, price_per_student: 1200 },
  { subject_name: "Physics", course_title: "Physics Concepts", course_description: "Mechanics, electricity, and numericals", capacity: 25, price_per_student: 1300 },
  { subject_name: "Chemistry", course_title: "Chemistry Essentials", course_description: "Organic, inorganic, and practical prep", capacity: 25, price_per_student: 1250 },
  { subject_name: "Biology", course_title: "Biology Masterclass", course_description: "Detailed theory and MCQ drills", capacity: 25, price_per_student: 1400 },
  { subject_name: "English", course_title: "English Communication", course_description: "Grammar, writing, and spoken practice", capacity: 35, price_per_student: 900 },
  { subject_name: "Computer Science", course_title: "CS Fundamentals", course_description: "Programming basics and logic building", capacity: 30, price_per_student: 1500 },
  { subject_name: "Economics", course_title: "Economics Complete", course_description: "Micro and macro economics with examples", capacity: 25, price_per_student: 1100 },
  { subject_name: "Business Studies", course_title: "Business Studies Pro", course_description: "Case studies and exam strategies", capacity: 25, price_per_student: 1150 },
  { subject_name: "Statistics", course_title: "Statistics and Data", course_description: "Probability, distributions, and data analysis", capacity: 25, price_per_student: 1350 },
  { subject_name: "Urdu", course_title: "Urdu Language Skills", course_description: "Reading, writing, and literature coverage", capacity: 30, price_per_student: 800 },
];

async function getStudentIdByAccount(client, accountId) {
  const row = await client.query(`SELECT student_id FROM students WHERE account_id = $1 LIMIT 1`, [accountId]);
  if (row.rowCount === 0) {
    throw new HttpError(404, "STUDENT_PROFILE_NOT_FOUND", "Student profile not found for this account");
  }
  return row.rows[0].student_id;
}

async function ensureStudentWallet(client, studentId) {
  await client.query(
    `INSERT INTO student_wallets (student_id, balance) VALUES ($1, 0) ON CONFLICT (student_id) DO NOTHING`,
    [studentId]
  );
  const wallet = await client.query(`SELECT wallet_id, balance FROM student_wallets WHERE student_id = $1 FOR UPDATE`, [studentId]);
  if (wallet.rowCount === 0) {
    throw new HttpError(500, "STUDENT_WALLET_ERROR", "Failed to load student wallet");
  }
  return wallet.rows[0];
}

async function getAcademyIdByAccount(accountId) {
  const academy = await pool.query(`SELECT academy_id FROM academies WHERE account_id = $1 LIMIT 1`, [accountId]);
  if (academy.rowCount === 0) {
    throw new HttpError(404, "ACADEMY_PROFILE_NOT_FOUND", "Academy profile not found for this account");
  }
  return academy.rows[0].academy_id;
}

function mapCourse(row) {
  return {
    ...row,
    price_per_student: Number(row.price_per_student || 0),
    capacity: Number(row.capacity || 0),
    enrolled_count: Number(row.enrolled_count || 0),
    seats_left: Number(row.seats_left || 0),
  };
}

async function listSubscribedAcademies() {
  const result = await pool.query(
    `
    SELECT
      ac.academy_id,
      ac.account_id,
      ac.academy_name,
      ac.city,
      ac.country,
      ac.is_verified,
      a.email,
      s.plan_type,
      s.end_at,
      s.end_date
    FROM academies ac
    JOIN accounts a ON a.account_id = ac.account_id
    JOIN subscriptions s
      ON s.academy_id = ac.academy_id
     AND s.is_active = TRUE
     AND (
       (s.end_at IS NOT NULL AND s.end_at > NOW()) OR
       (s.end_at IS NULL AND s.end_date >= CURRENT_DATE)
     )
    ORDER BY ac.academy_id DESC
    `
  );

  return result.rows;
}

async function fetchCoursesForAcademy(academyId) {
  const result = await pool.query(
    `
    SELECT
      c.course_id,
      c.academy_id,
      c.course_title,
      c.course_description,
      c.subject_name,
      c.capacity,
      c.enrolled_count,
      (c.capacity - c.enrolled_count) AS seats_left,
      c.price_per_student
    FROM academy_courses c
    WHERE c.academy_id = $1
    ORDER BY c.course_id DESC
    `,
    [academyId]
  );

  return result.rows.map(mapCourse);
}

async function listAcademyCourses(academyId) {
  const academyCheck = await pool.query(
    `
    SELECT ac.academy_id
    FROM academies ac
    JOIN subscriptions s
      ON s.academy_id = ac.academy_id
     AND s.is_active = TRUE
     AND (
       (s.end_at IS NOT NULL AND s.end_at > NOW()) OR
       (s.end_at IS NULL AND s.end_date >= CURRENT_DATE)
     )
    WHERE ac.academy_id = $1
    LIMIT 1
    `,
    [academyId]
  );

  if (academyCheck.rowCount === 0) {
    throw new HttpError(404, "ACADEMY_NOT_AVAILABLE", "Academy not found or has no active subscription");
  }

  let courses = await fetchCoursesForAcademy(academyId);

  if (courses.length === 0) {
    await seedDemoCoursesForAcademyId(academyId);
    courses = await fetchCoursesForAcademy(academyId);
  }

  return courses;
}

async function seedDemoCoursesForAcademyId(academyId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existing = await client.query(`SELECT COUNT(*)::int AS count FROM academy_courses WHERE academy_id = $1`, [academyId]);
    if (existing.rows[0].count > 0) {
      await client.query("COMMIT");
      return { inserted: 0, message: "Courses already exist for academy" };
    }

    for (const item of DEMO_COURSES) {
      await client.query(
        `
        INSERT INTO academy_courses (
          academy_id, teacher_id, subject_id, subject_name, course_title, course_description, price_per_student, capacity, enrolled_count
        )
        VALUES ($1, NULL, NULL, $2, $3, $4, $5, $6, 0)
        `,
        [academyId, item.subject_name, item.course_title, item.course_description, item.price_per_student, item.capacity]
      );
    }

    await client.query("COMMIT");
    return { inserted: DEMO_COURSES.length, message: "Demo courses created" };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[txn:academy_seed_courses] rollback:", err.code || "ERROR", err.message);
    throw err;
  } finally {
    client.release();
  }
}

async function seedDemoCoursesForAcademyAccount(accountId) {
  const academyId = await getAcademyIdByAccount(accountId);
  return seedDemoCoursesForAcademyId(academyId);
}

async function listMyAcademyCourses(accountId) {
  const academyId = await getAcademyIdByAccount(accountId);
  return fetchCoursesForAcademy(academyId);
}

async function createCourseForAcademyAccount(accountId, payload) {
  const academyId = await getAcademyIdByAccount(accountId);

  const result = await pool.query(
    `
    INSERT INTO academy_courses (
      academy_id, teacher_id, subject_id, subject_name, course_title, course_description, price_per_student, capacity, enrolled_count
    )
    VALUES ($1, NULL, NULL, $2, $3, $4, $5, $6, 0)
    RETURNING
      course_id,
      academy_id,
      course_title,
      course_description,
      subject_name,
      capacity,
      enrolled_count,
      (capacity - enrolled_count) AS seats_left,
      price_per_student
    `,
    [
      academyId,
      payload.subject_name,
      payload.course_title,
      payload.course_description,
      payload.price_per_student,
      payload.capacity,
    ]
  );

  return mapCourse(result.rows[0]);
}

async function deleteCourseForAcademyAccount(accountId, courseId) {
  const academyId = await getAcademyIdByAccount(accountId);

  const course = await pool.query(
    `
    SELECT course_id, enrolled_count
    FROM academy_courses
    WHERE academy_id = $1 AND course_id = $2
    LIMIT 1
    `,
    [academyId, courseId]
  );

  if (course.rowCount === 0) {
    throw new HttpError(404, "COURSE_NOT_FOUND", "Course not found for this academy");
  }

  if (Number(course.rows[0].enrolled_count) > 0) {
    throw new HttpError(409, "COURSE_HAS_ENROLLMENTS", "Cannot delete a course that already has enrolled students");
  }

  await pool.query(`DELETE FROM academy_courses WHERE academy_id = $1 AND course_id = $2`, [academyId, courseId]);

  return {
    course_id: courseId,
    message: "Course deleted successfully",
  };
}

async function enrollInAcademyCourse({ studentAccountId, academyId, courseId }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const studentId = await getStudentIdByAccount(client, studentAccountId);
    const studentWallet = await ensureStudentWallet(client, studentId);
    const studentBalanceBefore = Number(studentWallet.balance);

    const academyWallet = await client.query(
      `
      SELECT ac.academy_id, w.wallet_id, w.balance
      FROM academies ac
      JOIN wallets w ON w.academy_id = ac.academy_id
      JOIN subscriptions s
        ON s.academy_id = ac.academy_id
       AND s.is_active = TRUE
       AND (
         (s.end_at IS NOT NULL AND s.end_at > NOW()) OR
         (s.end_at IS NULL AND s.end_date >= CURRENT_DATE)
       )
      WHERE ac.academy_id = $1
      LIMIT 1
      FOR UPDATE OF w
      `,
      [academyId]
    );

    if (academyWallet.rowCount === 0) {
      throw new HttpError(404, "ACADEMY_NOT_AVAILABLE", "Academy not found or has no active subscription");
    }

    const course = await client.query(
      `
      SELECT course_id, academy_id, course_title, capacity, enrolled_count, price_per_student
      FROM academy_courses
      WHERE course_id = $1 AND academy_id = $2
      LIMIT 1
      FOR UPDATE
      `,
      [courseId, academyId]
    );

    if (course.rowCount === 0) {
      throw new HttpError(404, "COURSE_NOT_FOUND", "Course not found in selected academy");
    }

    const c = course.rows[0];
    const coursePrice = Number(c.price_per_student || 0);

    if (studentBalanceBefore < coursePrice) {
      throw new HttpError(409, "INSUFFICIENT_STUDENT_BALANCE", "Insufficient student wallet balance", {
        required: coursePrice,
        available: studentBalanceBefore,
      });
    }

    if (Number(c.enrolled_count) >= Number(c.capacity)) {
      throw new HttpError(409, "COURSE_FULL", "No seat left in selected course");
    }

    const duplicate = await client.query(
      `
      SELECT enrollment_id
      FROM academy_enrollments
      WHERE student_id = $1 AND course_id = $2 AND status = 'enrolled'
      LIMIT 1
      `,
      [studentId, courseId]
    );

    if (duplicate.rowCount > 0) {
      throw new HttpError(409, "ALREADY_ENROLLED", "Student is already enrolled in this course");
    }

    const enrollment = await client.query(
      `
      INSERT INTO academy_enrollments (
        student_id, academy_id, course_id, amount_paid, status, enrolled_at
      )
      VALUES ($1, $2, $3, $4, 'enrolled', NOW())
      RETURNING enrollment_id, student_id, academy_id, course_id, amount_paid, status, enrolled_at
      `,
      [studentId, academyId, courseId, coursePrice]
    );

    const enrollmentId = enrollment.rows[0].enrollment_id;

    await client.query(
      `
      INSERT INTO academy_enrollment_payments (
        enrollment_id, amount_total, currency, payment_method, payment_status, paid_at, transaction_reference
      )
      VALUES ($1, $2, 'PKR', 'student_wallet', 'completed', NOW(), $3)
      `,
      [enrollmentId, coursePrice, `ENR-${enrollmentId}-${Date.now()}`]
    );

    await client.query(`UPDATE academy_courses SET enrolled_count = enrolled_count + 1 WHERE course_id = $1`, [courseId]);

    const studentWalletAfter = await client.query(
      `UPDATE student_wallets SET balance = balance - $1 WHERE wallet_id = $2 RETURNING balance`,
      [coursePrice, studentWallet.wallet_id]
    );

    const academyWalletAfter = await client.query(
      `UPDATE wallets SET balance = balance + $1 WHERE wallet_id = $2 RETURNING balance`,
      [coursePrice, academyWallet.rows[0].wallet_id]
    );

    await client.query("COMMIT");

    return {
      enrollment: enrollment.rows[0],
      payment: {
        amount_total: coursePrice,
        currency: "PKR",
        payment_status: "completed",
      },
      student_wallet: {
        wallet_id: studentWallet.wallet_id,
        balance_before: studentBalanceBefore,
        balance_after: Number(studentWalletAfter.rows[0].balance),
      },
      academy_wallet: {
        wallet_id: academyWallet.rows[0].wallet_id,
        balance_after: Number(academyWalletAfter.rows[0].balance),
      },
    };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[txn:academy_enroll] rollback:", err.code || "ERROR", err.message);
    throw err;
  } finally {
    client.release();
  }
}

async function getMyEnrollments(accountId, role) {
  if (role === "student") {
    const student = await pool.query(`SELECT student_id FROM students WHERE account_id = $1 LIMIT 1`, [accountId]);
    if (student.rowCount === 0) {
      throw new HttpError(404, "STUDENT_PROFILE_NOT_FOUND", "Student profile not found for this account");
    }
    const result = await pool.query(
      `
      SELECT
        e.enrollment_id,
        e.amount_paid,
        e.status,
        e.enrolled_at,
        c.course_id,
        c.course_title,
        c.subject_name,
        ac.academy_id,
        ac.academy_name
      FROM academy_enrollments e
      JOIN academy_courses c ON c.course_id = e.course_id
      JOIN academies ac ON ac.academy_id = e.academy_id
      WHERE e.student_id = $1
      ORDER BY e.enrolled_at DESC
      `,
      [student.rows[0].student_id]
    );
    return result.rows;
  }

  if (role === "academy") {
    const academy = await pool.query(`SELECT academy_id FROM academies WHERE account_id = $1 LIMIT 1`, [accountId]);
    if (academy.rowCount === 0) {
      throw new HttpError(404, "ACADEMY_PROFILE_NOT_FOUND", "Academy profile not found for this account");
    }
    const result = await pool.query(
      `
      SELECT
        e.enrollment_id,
        e.amount_paid,
        e.status,
        e.enrolled_at,
        c.course_id,
        c.course_title,
        c.subject_name,
        s.student_id,
        s.name AS student_name,
        a.email AS student_email,
        a.account_id AS student_account_id
      FROM academy_enrollments e
      JOIN academy_courses c ON c.course_id = e.course_id
      JOIN students s ON s.student_id = e.student_id
      JOIN accounts a ON a.account_id = s.account_id
      WHERE e.academy_id = $1
      ORDER BY e.enrolled_at DESC
      `,
      [academy.rows[0].academy_id]
    );
    return result.rows;
  }

  throw new HttpError(403, "FORBIDDEN", "Enrollments are available only for student or academy");
}

module.exports = {
  listSubscribedAcademies,
  listAcademyCourses,
  seedDemoCoursesForAcademyAccount,
  listMyAcademyCourses,
  createCourseForAcademyAccount,
  deleteCourseForAcademyAccount,
  enrollInAcademyCourse,
  getMyEnrollments,
};
