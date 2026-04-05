import { useEffect, useState } from "react";
import RoleLayout from "../../components/layout/RoleLayout";
import { adminNavItems } from "../../features/admin/navigation";
import { adminAppFeedbackRequest, adminReplyFeedbackRequest } from "../../api/feedback";

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState([]);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const data = await adminAppFeedbackRequest();
      setFeedback(data?.feedback || []);
    } catch (err) {
      setError(err?.response?.data?.error?.message || "Could not load feedback.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  const handleDraftChange = (feedbackId, value) => {
    setReplyDrafts((current) => ({ ...current, [feedbackId]: value }));
  };

  const handleReply = async (feedbackId) => {
    const reply = (replyDrafts[feedbackId] || "").trim();
    if (!reply) {
      setError("Please write a reply before sending.");
      return;
    }

    setSubmittingId(feedbackId);
    setError("");
    setSuccess("");

    try {
      const data = await adminReplyFeedbackRequest(feedbackId, { reply });
      setFeedback((current) =>
        current.map((item) => (item.feedback_id === feedbackId ? { ...item, ...data.feedback } : item))
      );
      setReplyDrafts((current) => ({ ...current, [feedbackId]: "" }));
      setSuccess(data?.message || "Reply sent successfully.");
    } catch (err) {
      setError(err?.response?.data?.error?.message || "Could not send reply.");
    } finally {
      setSubmittingId(null);
    }
  };

  const openCount = feedback.filter((item) => item.status === "open").length;
  const repliedCount = feedback.filter((item) => item.status === "replied").length;

  return (
    <RoleLayout
      roleTitle="Admin"
      roleSubtitle="Review platform feedback and reply to students, tutors, and academies."
      accentLabel="Control Room"
      navItems={adminNavItems}
      headerLabel="Feedback"
      quickStats={[
        { label: "Total", value: feedback.length, note: "All feedback messages" },
        { label: "Open", value: openCount, note: "Waiting for reply" },
        { label: "Replied", value: repliedCount, note: "Handled by admin" },
      ]}
    >
      {error ? <p className="error">{error}</p> : null}
      {success ? <p className="success">{success}</p> : null}

      <section className="content-panel">
        <p className="section-kicker">Inbox</p>
        <h3 style={{ marginTop: 0 }}>App feedback from all roles</h3>

        {loading ? (
          <p className="muted">Loading feedback...</p>
        ) : feedback.length === 0 ? (
          <p className="muted">No feedback has been submitted yet.</p>
        ) : (
          <div className="detail-list">
            {feedback.map((item) => (
              <article className="soft-card action-card" key={item.feedback_id}>
                <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p className="section-kicker" style={{ marginBottom: "8px" }}>
                      {item.role} · {item.status}
                    </p>
                    <h3 style={{ margin: 0 }}>{item.subject}</h3>
                  </div>
                  <span className="badge-pill">{item.email}</span>
                </div>

                <p className="muted" style={{ margin: 0 }}>
                  {item.message}
                </p>

                {item.admin_reply ? (
                  <div className="reply-box">
                    <strong>Reply sent</strong>
                    <p>{item.admin_reply}</p>
                  </div>
                ) : (
                  <div className="form-grid">
                    <div>
                      <label htmlFor={`reply-${item.feedback_id}`}>Reply</label>
                      <textarea
                        id={`reply-${item.feedback_id}`}
                        rows="4"
                        value={replyDrafts[item.feedback_id] || ""}
                        onChange={(event) => handleDraftChange(item.feedback_id, event.target.value)}
                        placeholder="Write your response here."
                      />
                    </div>
                    <button
                      className="btn-primary"
                      type="button"
                      disabled={submittingId === item.feedback_id}
                      onClick={() => handleReply(item.feedback_id)}
                    >
                      {submittingId === item.feedback_id ? "Sending..." : "Send reply"}
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </RoleLayout>
  );
}
