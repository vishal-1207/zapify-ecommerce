import React from "react";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  EyeOff,
} from "lucide-react";

const STATUS_CONFIG = {
  pending: {
    label: "Under Review",
    icon: Clock,
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    iconColor: "text-amber-500",
  },
  approved: {
    label: "Published",
    icon: CheckCircle,
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    iconColor: "text-green-500",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    iconColor: "text-red-500",
  },
  flagged: {
    label: "Flagged",
    icon: AlertTriangle,
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    iconColor: "text-orange-500",
  },
  hidden: {
    label: "Hidden",
    icon: EyeOff,
    bg: "bg-gray-50",
    text: "text-gray-600",
    border: "border-gray-200",
    iconColor: "text-gray-400",
  },
};

/**
 * A small badge/pill showing the moderation status of a review.
 * @param {string} status - One of: pending | approved | rejected | flagged | hidden
 * @param {string} reason - Optional reason shown on hover via title attribute
 */
const ReviewModerationBadge = ({ status, reason }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;

  return (
    <span
      title={reason || config.label}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
    >
      <Icon size={11} className={config.iconColor} />
      {config.label}
    </span>
  );
};

export default ReviewModerationBadge;
