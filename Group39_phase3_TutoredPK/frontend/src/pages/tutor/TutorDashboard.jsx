import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import RoleLayout from "../../components/layout/RoleLayout";
import { tutorNavItems } from "../../features/tutor/navigation";
import { tutorBookingsRequest, tutorReviewsRequest, tutorStatusRequest, tutorWithdrawalsRequest } from "../../api/tutor";

export default function TutorDashboard() {
  const [status, setStatus] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [reviewsSummary, setReviewsSummary] = useState({ average_rating: 0, total_reviews: 0 });

  useEffect(() => {
    async function loadData() {
      try {
        const [statusData, bookingsData, withdrawalsData, reviewsData] = await Promise.all([
          tutorStatusRequest(),
          tutorBookingsRequest(),
          tutorWithdrawalsRequest(),
          tutorReviewsRequest(),
        ]);

        setStatus(statusData);
        setBookings(bookingsData?.bookings || []);
        setWithdrawals(withdrawalsData?.withdrawals || withdrawalsData || []);
        setReviewsSummary(reviewsData?.rating_summary || { average_rating: 0, total_reviews: 0 });
      } catch {
        // Keep the dashboard visible even if one section fails.
      }
    }

    loadData();
  }, []);

  const pendingWithdrawals = withdrawals.filter((item) => item.status === "pending").length;
  const analyticsData = [
    { name: "Bookings", value: bookings.length },
    { name: "Pending", value: pendingWithdrawals },
    { name: "Reviews", value: reviewsSummary.total_reviews || 0 },
    { name: "Active Plan", value: status?.active_subscription ? 1 : 0 },
  ];

  return (
    <RoleLayout
      roleTitle="Tutor"
      roleSubtitle="Manage subscriptions, confirm sessions, and request withdrawals."
      accentLabel="Tutor Studio"
      navItems={tutorNavItems}
      quickStats={[
        { label: "Subscription", value: status?.active_subscription?.plan_type || "None", note: "Plan status and renewal" },
        {
          label: "Wallet",
          value: status?.wallet?.balance === undefined ? "Unavailable" : `PKR ${status?.wallet?.balance ?? 0}`,
          note: "Available balance for plans and payouts",
        },
        { label: "Withdrawals", value: String(withdrawals.length), note: "Track pending and reviewed requests" },
      ]}
    >
      <div className="panel-grid">
        <article className="soft-card action-card">
          <p className="section-kicker">Start Here</p>
          <h3>Manage subscription</h3>
          <p className="muted">Top up your wallet, purchase a plan, and keep your tutor profile active.</p>
          <Link className="text-link-cta" to="/tutor/subscription">
            Open subscription
          </Link>
        </article>

        <article className="soft-card action-card">
          <p className="section-kicker">Next Step</p>
          <h3>Review bookings</h3>
          <p className="muted">
            {bookings.length} booking{bookings.length === 1 ? "" : "s"} on your schedule and{" "}
            {pendingWithdrawals} pending withdrawal
            {pendingWithdrawals === 1 ? "" : "s"}.
          </p>
          <Link className="text-link-cta" to="/tutor/bookings">
            Open bookings
          </Link>
        </article>
      </div>

      <article className="soft-card chart-card">
        <div>
          <p className="section-kicker">Analytics</p>
          <h3>Tutor performance snapshot</h3>
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
