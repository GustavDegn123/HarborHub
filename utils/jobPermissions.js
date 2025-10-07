// /utils/jobPermissions.js
export function computeViewerRole(job, uid) {
  if (!job || !uid) return "guest";
  if (job.owner_id === uid) return "owner";
  if (job.acceptedProviderId === uid) return "acceptedProvider";
  return "otherProvider";
}

// Afgrænser hvad der må vises afhængigt af rolle + status
export function derivePermissions(job, role) {
  const status = String(job?.status || "").toLowerCase();
  const hasAccepted = !!job?.acceptedProviderId;
  const isOtherProv = role === "otherProvider" || role === "provider";

  const canOpenChat =
    hasAccepted && (role === "owner" || role === "acceptedProvider");

  const canBid = status === "open" && isOtherProv;

  const showOwnerBidList = role === "owner" && status === "open";
  const showAcceptedBidToOwner = role === "owner" && status !== "open";

  const canStart =
    role === "acceptedProvider" && status === "assigned"; // flyttet hertil
  const canComplete =
    role === "acceptedProvider" && status === "in_progress";
  const canCancelAsProvider =
    role === "acceptedProvider" && (status === "assigned" || status === "in_progress");

  return {
    status,
    canOpenChat,
    canBid,
    showOwnerBidList,
    showAcceptedBidToOwner,
    canStart,
    canComplete,
    canCancelAsProvider,
  };
}
