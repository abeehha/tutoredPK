import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import RoleLayout from "../../components/layout/RoleLayout";
import { academyNavItems } from "../../features/academy/navigation";
import { academyEnrollmentsRequest, academyMyCoursesRequest, academyStatusRequest, academySubscriptionsRequest } from "../../api/academy";

export default function AcademyDashboard() {
  const [status, setStatus] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [history, setHistory] = useState([]);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [statusData, enrollmentsData, subscriptionsData, coursesData] = await Promise.all([
          academyStatusRequest(),
          academyEnrollmentsRequest(),
          academySubscriptionsRequest(),
          academyMyCoursesRequest(),
        ]);
        setStatus(statusData);
        setEnrollments(enrollmentsData?.enrollments || []);
        setHistory(subscriptionsData?.subscriptions || []);
        setCourses(coursesData?.courses || []);
      } catch {
        // Keep dashboard visible if one optional section fails.
      }
    }

    loadData();
  }, []);

  const analyticsData = [
    { name: "Courses", value: courses.length },
    { name: "Enrollments", value: enrollments.length },
    { name: "Subscriptions", value: history.length },
    { name: "Active Plan", value: status?.active_subscription ? 1 : 0 },
  ];

  return (
    <RoleLayout
      roleTitle="Academy"
      roleSubtitle="Control subscriptions, course seeding, enrollments, and student messaging."
      accentLabel="Academy Hub"
      navItems={academyNavItems}
      quickStats={[
        { label: "Subscription", value: status?.active_subscription?.plan_type || "None", note: "Monthly academy plan status" },
        {
          label: "Wallet",
          value: status?.wallet?.balance === undefined ? "Unavailable" : `PKR ${status?.wallet?.balance ?? 0}`,
          note: "Available balance for monthly renewal",
        },
        { label: "Enrollments", value: String(enrollments.length), note: "Students currently enrolled" },
      ]}
    >
      <div className="panel-grid">
        <article className="soft-card action-card">
          <p className="section-kicker">Start Here</p>
          <h3>Manage subscription</h3>
          <p className="muted">Top up your wallet, keep the monthly plan active, and stay visible to students.</p>
          <Link className="text-link-cta" to="/academy/subscription">
            Open subscription
          </Link>
        </article>

        <article className="soft-card action-card">
          <p className="section-kicker">Next Step</p>
          <h3>Manage enrollments</h3>
          <p className="muted">
            {enrollments.length} enrollment{enrollments.length === 1 ? "" : "s"} currently tracked and{" "}
            {history.length} subscription record{history.length === 1 ? "" : "s"} available.
          </p>
          <Link className="text-link-cta" to="/academy/enrollments">
            View enrollments
          </Link>
        </article>
      </div>

      <article className="soft-card chart-card">
        <div>
          <p className="section-kicker">Analytics</p>
          <h3>Academy activity snapshot</h3>
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
