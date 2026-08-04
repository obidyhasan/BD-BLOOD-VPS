import type { Report } from "@/redux/features/reports/reportsApi";
import { formatDistanceToNow } from "date-fns";

export type ModerationAssetUI = {
  id: string;
  type: string;
  content: string;
  author: string;
  time: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  issue: string;
  status: "In Review" | "Accepted" | "Rejected";
};

const STATUS_TO_UI: Record<Report["status"], ModerationAssetUI["status"]> = {
  PENDING: "In Review",
  RESOLVED: "Accepted",
  REJECTED: "Rejected",
};

export function mapReportToModerationAsset(report: Report): ModerationAssetUI {
  const reason = report.reason;
  return {
    id: report.id,
    type: report.targetType,
    content: reason,
    author: report.reporter?.fullName ?? "Anonymous",
    time: formatDistanceToNow(new Date(report.createdAt), { addSuffix: true }),
    severity:
      reason.length > 80 ? "HIGH" : reason.length > 40 ? "MEDIUM" : "LOW",
    issue: reason.length > 60 ? `${reason.slice(0, 57)}...` : reason,
    status: STATUS_TO_UI[report.status],
  };
}

export function mapModerationStatusToApi(
  status: ModerationAssetUI["status"],
): Report["status"] {
  if (status === "Accepted") return "RESOLVED";
  if (status === "Rejected") return "REJECTED";
  return "PENDING";
}
