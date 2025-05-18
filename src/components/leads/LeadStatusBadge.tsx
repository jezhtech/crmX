import { LeadStage } from "@/types/lead";

interface LeadStatusBadgeProps {
  stage: LeadStage;
}

const LeadStatusBadge = ({ stage }: LeadStatusBadgeProps) => {
  const getStageClass = () => {
    switch (stage) {
      case "new":
        return "stage-badge stage-new";
      case "contacted":
        return "stage-badge stage-contacted";
      case "qualified":
        return "stage-badge stage-qualified";
      case "proposal":
        return "stage-badge stage-proposal";
      case "project":
        return "stage-badge stage-project";
      case "rejected":
        return "stage-badge stage-rejected";
      default:
        return "stage-badge stage-new";
    }
  };

  const getStageName = () => {
    switch (stage) {
      case "new":
        return "New";
      case "contacted":
        return "Contacted";
      case "qualified":
        return "Qualified";
      case "proposal":
        return "Proposal";
      case "project":
        return "Project";
      case "rejected":
        return "Rejected";
      default:
        return "Unknown";
    }
  };

  return (
    <span className={getStageClass()}>
      {getStageName()}
    </span>
  );
};

export default LeadStatusBadge;
