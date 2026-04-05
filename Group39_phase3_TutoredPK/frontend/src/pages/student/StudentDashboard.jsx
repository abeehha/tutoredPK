import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import RoleLayout from "../../components/layout/RoleLayout";
import { studentNavItems } from "../../features/student/navigation";
import useStudentStore from "../../store/studentStore";

export default function StudentDashboard() {
  const walletBalance = useStudentStore((state) => state.walletBalance);
  const bookingCount = useStudentStore((state) => state.bookingCount);
  const enrollmentCount = useStudentStore((state) => state.enrollmentCount);
  const analyticsData = [
    { name: "Bookings", value: bookingCount },
    { name: "Enrollments", value: enrollmentCount },
  ];

  return (
    <RoleLayout
      roleTitle="Student"
      roleSubtitle="Explore tutors, book sessions, manage wallet, and track enrollments."
      accentLabel="Learner Portal"
      navItems={studentNavItems}
      quickStats={[
        { label: "Bookings", value: String(bookingCount), note: "Sessions booked so far" },
        { label: "Enrollments", value: String(enrollmentCount), note: "Courses joined so far" },
        {
          label: "Wallet",
          value: walletBalance === null ? "Unavailable" : `PKR ${walletBalance}`,
          note: "Current available balance",
        },
      ]}
    >
      <div className="panel-grid">
        <article className="soft-card action-card">
          <p className="section-kicker">Start Here</p>
          <h3>Find a tutor</h3>
          <p className="muted">Browse available tutors and pick one that matches your schedule.</p>
          <Link className="text-link-cta" to="/student/tutors">
            Open tutor search
          </Link>
        </article>

        <article className="soft-card action-card">
          <p className="section-kicker">Next Step</p>
          <h3>Make a booking</h3>
          <p className="muted">Choose a slot, confirm your session, and keep your learning on track.</p>
          <Link className="text-link-cta" to="/student/bookings">
            View my bookings
          </Link>
        </article>
      </div>

      <article className="soft-card chart-card">
        <div>
          <p className="section-kicker">Analytics</p>
          <h3>Student activity snapshot</h3>
        </div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f2d8e7" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#e471ad" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>
    </RoleLayout>
  );
}
