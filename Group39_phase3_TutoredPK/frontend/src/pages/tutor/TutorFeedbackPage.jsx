import RoleFeedbackPage from "../../components/feedback/RoleFeedbackPage";
import { tutorNavItems } from "../../features/tutor/navigation";

export default function TutorFeedbackPage() {
  return (
    <RoleFeedbackPage
      roleTitle="Tutor"
      roleSubtitle="Share ideas, report issues, or suggest improvements for the tutor experience."
      accentLabel="Tutor Hub"
      navItems={tutorNavItems}
      headerLabel="Feedback"
    />
  );
}
