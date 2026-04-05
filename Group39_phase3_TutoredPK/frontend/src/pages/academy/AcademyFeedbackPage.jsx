import RoleFeedbackPage from "../../components/feedback/RoleFeedbackPage";
import { academyNavItems } from "../../features/academy/navigation";

export default function AcademyFeedbackPage() {
  return (
    <RoleFeedbackPage
      roleTitle="Academy"
      roleSubtitle="Share ideas, report issues, or suggest improvements for the academy experience."
      accentLabel="Academy Hub"
      navItems={academyNavItems}
      headerLabel="Feedback"
    />
  );
}
