import { useEffect, useState } from "react";
import RoleLayout from "../../components/layout/RoleLayout";
import { academyNavItems } from "../../features/academy/navigation";
import { academyCreateCourseRequest, academyDeleteCourseRequest, academyMyCoursesRequest, academySeedCoursesRequest } from "../../api/academy";

const initialForm = {
  subject_name: "",
  course_title: "",
  course_description: "",
  price_per_student: "1000",
  capacity: "30",
};

export default function AcademyCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [savingCourse, setSavingCourse] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [deletingCourseId, setDeletingCourseId] = useState(null);
  const [seedResult, setSeedResult] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCourses = async () => {
    setLoadingCourses(true);
    try {
      const data = await academyMyCoursesRequest();
      setCourses(data?.courses || []);
    } catch (err) {
      setError(err?.response?.data?.error?.message || "Could not load courses.");
    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleCreateCourse = async (event) => {
    event.preventDefault();
    setSavingCourse(true);
    setError("");
    setSuccess("");

    try {
      const data = await academyCreateCourseRequest({
        ...form,
        price_per_student: Number(form.price_per_student),
        capacity: Number(form.capacity),
      });

      if (data?.course) {
        setCourses((current) => [data.course, ...current]);
      }

      setForm(initialForm);
      setSuccess(data?.message || "Course added successfully.");
    } catch (err) {
      setError(err?.response?.data?.error?.message || "Could not add course.");
    } finally {
      setSavingCourse(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setError("");
    setSuccess("");

    try {
      const data = await academySeedCoursesRequest();
      setSeedResult(data);
      setSuccess(data?.message || "Courses updated successfully.");
      await loadCourses();
    } catch (err) {
      setError(err?.response?.data?.error?.message || "Could not seed academy courses.");
    } finally {
      setSeeding(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    setDeletingCourseId(courseId);
    setError("");
    setSuccess("");

    try {
      const data = await academyDeleteCourseRequest(courseId);
      setCourses((current) => current.filter((course) => course.course_id !== courseId));
      setSuccess(data?.message || "Course deleted successfully.");
    } catch (err) {
      setError(err?.response?.data?.error?.message || "Could not delete course.");
    } finally {
      setDeletingCourseId(null);
    }
  };

  return (
    <RoleLayout
      roleTitle="Academy"
      roleSubtitle="Add your own courses or quickly seed a starter catalog for students."
      accentLabel="Academy Hub"
      navItems={academyNavItems}
      headerLabel="Courses"
      quickStats={[
        { label: "Courses", value: courses.length, note: "Current catalog size" },
        { label: "Last Seed", value: seedResult?.inserted ?? "-", note: "Courses inserted in the latest seed" },
        { label: "Pricing", value: "Custom", note: "Set your own course fees" },
      ]}
    >
      <div className="panel-grid">
        <article className="soft-card">
          <p className="section-kicker">Add Course</p>
          <h3>Create a course manually</h3>
          <form className="form-grid" onSubmit={handleCreateCourse}>
            <div>
              <label htmlFor="subject_name">Subject</label>
              <input
                id="subject_name"
                name="subject_name"
                value={form.subject_name}
                onChange={handleChange}
                placeholder="Mathematics"
                required
              />
            </div>

            <div>
              <label htmlFor="course_title">Course title</label>
              <input
                id="course_title"
                name="course_title"
                value={form.course_title}
                onChange={handleChange}
                placeholder="Algebra Foundation"
                required
              />
            </div>

            <div>
              <label htmlFor="course_description">Description</label>
              <textarea
                id="course_description"
                name="course_description"
                rows="4"
                value={form.course_description}
                onChange={handleChange}
                placeholder="Describe what students will learn in this course."
                required
              />
            </div>

            <div>
              <label htmlFor="price_per_student">Price Per Student (PKR)</label>
              <input
                id="price_per_student"
                name="price_per_student"
                type="number"
                min="100"
                max="100000"
                value={form.price_per_student}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label htmlFor="capacity">Capacity</label>
              <input
                id="capacity"
                name="capacity"
                type="number"
                min="1"
                max="500"
                value={form.capacity}
                onChange={handleChange}
                required
              />
            </div>

            <button className="btn-primary" type="submit" disabled={savingCourse}>
              {savingCourse ? "Adding..." : "Add Course"}
            </button>
          </form>
        </article>

        <article className="soft-card">
          <p className="section-kicker">Seed Courses</p>
          <h3>Add the starter pack</h3>
          <p className="muted">
            Use this once if you want a ready-made catalog of common subjects for quick testing and demos.
          </p>

          <button className="btn-secondary" type="button" disabled={seeding} onClick={handleSeed} style={{ marginTop: "16px" }}>
            {seeding ? "Seeding..." : "Seed Demo Courses"}
          </button>

          {seedResult ? (
            <div className="detail-list" style={{ marginTop: "16px" }}>
              <p>
                <strong>Inserted:</strong> {seedResult.inserted}
              </p>
              <p>
                <strong>Message:</strong> {seedResult.message}
              </p>
            </div>
          ) : null}
        </article>
      </div>

      {error ? <p className="error">{error}</p> : null}
      {success ? <p className="success">{success}</p> : null}

      <section className="content-panel">
        <p className="section-kicker">Course List</p>
        <h3 style={{ marginTop: 0 }}>Current academy courses</h3>

        {loadingCourses ? (
          <p className="muted">Loading courses...</p>
        ) : courses.length === 0 ? (
          <p className="muted">No courses yet. Add one manually or seed the starter pack.</p>
        ) : (
          <div className="detail-list">
            {courses.map((course) => (
              <article className="soft-card action-card" key={course.course_id}>
                <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p className="section-kicker" style={{ marginBottom: "8px" }}>
                      {course.subject_name}
                    </p>
                    <h3 style={{ margin: 0 }}>{course.course_title}</h3>
                  </div>
                  <strong>PKR {course.price_per_student || 0}</strong>
                </div>

                <p className="muted" style={{ margin: 0 }}>
                  {course.course_description}
                </p>

                <div className="row">
                  <span className="badge-pill">Capacity {course.capacity}</span>
                  <span className="badge-pill">Enrolled {course.enrolled_count}</span>
                  <span className="badge-pill">Seats left {course.seats_left}</span>
                </div>

                <button
                  className="btn-secondary"
                  type="button"
                  onClick={() => handleDeleteCourse(course.course_id)}
                  disabled={deletingCourseId === course.course_id}
                >
                  {deletingCourseId === course.course_id ? "Removing..." : "Delete Course"}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </RoleLayout>
  );
}
