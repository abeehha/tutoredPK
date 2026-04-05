import { useEffect, useState } from "react";
import { myAppFeedbackRequest, submitAppFeedbackRequest } from "../../api/feedback";
import RoleLayout from "../layout/RoleLayout";

const initialForm = {
  subject: "",
  message: "",
};

export default function RoleFeedbackPage({
  roleTitle,
  roleSubtitle,
  accentLabel,
  navItems,
  headerLabel = "Feedback",
}) {
  const [form, setForm] = useState(initialForm);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const data = await myAppFeedbackRequest();
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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const data = await submitAppFeedbackRequest(form);
      if (data?.feedback) {
        setFeedback((current) => [data.feedback, ...current]);
      } else {
        await loadFeedback();
      }
      setForm(initialForm);
      setSuccess(data?.message || "Feedback sent successfully.");
    } catch (err) {
      setError(err?.response?.data?.error?.message || "Could not send feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  const openCount = feedback.filter((item) => item.status === "open").length;
  const repliedCount = feedback.filter((item) => item.status === "replied").length;

  return (
    <RoleLayout
      roleTitle={roleTitle}
      roleSubtitle={roleSubtitle}
      accentLabel={accentLabel}
      navItems={navItems}
      headerLabel={headerLabel}
      quickStats={[
        { label: "Sent", value: feedback.length, note: "Total feedback messages" },
        { label: "Open", value: openCount, note: "Waiting for admin review" },
        { label: "Replied", value: repliedCount, note: "Responses received" },
      ]}
    >
      <div className="panel-grid">
        <article className="soft-card">
          <p className="section-kicker">Send Feedback</p>
          <h3>Share a suggestion or report an issue</h3>
          <form className="form-grid" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="subject">Subject</label>
              <input
                id="subject"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="Suggestion for booking flow"
                required
              />
            </div>

            <div>
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                rows="5"
                value={form.message}
                onChange={handleChange}
                placeholder="Write your suggestion, issue, or improvement idea here."
                required
              />
            </div>

            <button className="btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Sending..." : "Send feedback"}
            </button>
          </form>

          {error ? <p className="error">{error}</p> : null}
          {success ? <p className="success">{success}</p> : null}
        </article>

        <article className="soft-card">
          <p className="section-kicker">How It Works</p>
          <h3>Feedback goes straight to admin</h3>
          <p className="muted">
            Use this page to share bugs, suggestions, or any changes you think would improve the app experience.
          </p>
        </article>
      </div>

      <section className="content-panel">
        <p className="section-kicker">Your Messages</p>
        <h3 style={{ marginTop: 0 }}>Recent feedback</h3>

        {loading ? (
          <p className="muted">Loading feedback...</p>
        ) : feedback.length === 0 ? (
          <p className="muted">No feedback sent yet.</p>
        ) : (
          <div className="detail-list">
            {feedback.map((item) => (
              <article className="soft-card action-card" key={item.feedback_id}>
                <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p className="section-kicker" style={{ marginBottom: "8px" }}>
                      {item.status === "replied" ? "Replied" : "Open"}
                    </p>
                    <h3 style={{ margin: 0 }}>{item.subject}</h3>
                  </div>
                  <span className="badge-pill">{new Date(item.created_at).toLocaleDateString()}</span>
                </div>

                <p className="muted" style={{ margin: 0 }}>
                  {item.message}
                </p>

                {item.admin_reply ? (
                  <div className="reply-box">
                    <strong>Admin reply</strong>
                    <p>{item.admin_reply}</p>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </RoleLayout>
  );
}
