import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import RoleLayout from "../../components/layout/RoleLayout";
import { adminNavItems } from "../../features/admin/navigation";
import { adminPendingWithdrawalsRequest } from "../../api/admin";
import { adminAppFeedbackRequest } from "../../api/feedback";

export default function AdminDashboard() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [feedback, setFeedback] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [withdrawalsData, feedbackData] = await Promise.all([
          adminPendingWithdrawalsRequest(),
          adminAppFeedbackRequest(),
        ]);
        setWithdrawals(withdrawalsData?.withdrawals || []);
        setFeedback(feedbackData?.feedback || []);
      } catch {
        // Keep dashboard visible if the queue cannot be fetched immediately.
      }
    }

    loadData();
  }, []);

  const pendingCount = withdrawals.length;
  const repliedCount = feedback.filter((item) => item.status === "replied").length;
  const openFeedbackCount = feedback.filter((item) => item.status === "open").length;
  const analyticsData = [
    { name: "Pending", value: pendingCount },
    { name: "Open feedback", value: openFeedbackCount },
    { name: "Replied", value: repliedCount },
  ];

  return (
    <RoleLayout
      roleTitle="Admin"
      roleSubtitle="Review system-critical flows and handle payout decisions with confidence."
      accentLabel="Control Room"
      navItems={adminNavItems}
      headerLabel="Dashboard"
      quickStats={[
        { label: "Pending", value: String(pendingCount), note: "Withdrawal requests awaiting review" },
        {
          label: "Queue Health",
          value: pendingCount > 0 ? "Action Needed" : "Clear",
          note: "Current payout review workload",
        },
        {
          label: "Focus",
          value: "Withdrawals",
          note: "Main admin flow available in this phase",
        },
      ]}
    >
      <div className="panel-grid">
        <article className="soft-card action-card">
          <p className="section-kicker">Withdrawals</p>
          <h3>{pendingCount} request{pendingCount === 1 ? "" : "s"} waiting for review</h3>
          <p className="muted">Approve valid payout requests or reject them to return funds to the tutor wallet.</p>
          <a className="text-link-cta" href="/admin/withdrawals">
            Open withdrawal queue
          </a>
        </article>

        <article className="soft-card action-card">
          <p className="section-kicker">Feedback</p>
          <h3>Read app suggestions</h3>
          <p className="muted">Review messages from students, tutors, and academies and reply from one place.</p>
          <a className="text-link-cta" href="/admin/feedback">
            Open feedback inbox
          </a>
        </article>
      </div>

      <article className="soft-card chart-card">
        <div>
          <p className="section-kicker">Analytics</p>
          <h3>Admin workload snapshot</h3>
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
