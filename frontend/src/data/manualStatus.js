export const STATUS = {
  approved: { label: "Approved", pill: "bg-good-soft text-good border-good/30" },
  pending: { label: "Pending Review", pill: "bg-warn-soft text-warn border-warn/30" },
  pending_expert_review: { label: "Pending Review", pill: "bg-warn-soft text-warn border-warn/30" },
  rejected: { label: "Rejected", pill: "bg-bad-soft text-bad border-bad/30" },
};

export function statusInfo(status) {
  return STATUS[status] ?? { label: status, pill: "bg-canvas text-text-muted border-line" };
}

export const FILTERS = [
  { value: "all", label: "All" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending Review" },
  { value: "rejected", label: "Rejected" },
];
