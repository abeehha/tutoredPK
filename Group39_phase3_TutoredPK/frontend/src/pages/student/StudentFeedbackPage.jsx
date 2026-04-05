import RoleFeedbackPage from "../../components/feedback/RoleFeedbackPage";
import { studentNavItems } from "../../features/student/navigation";

export default function StudentFeedbackPage() {
  return (
    <RoleFeedbackPage
      roleTitle="Student"
      roleSubtitle="Share ideas, report issues, or suggest improvements for the student experience."
      accentLabel="Learner Portal"
      navItems={studentNavItems}
      headerLabel="Feedback"
    />
  );
}
