import React, { useEffect, useState, useCallback } from "react";
import {
  CheckCircle,
  XCircle,
  Star,
  Flag,
  EyeOff,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  MessageSquare,
} from "lucide-react";
import {
  getAdminReviewQueue,
  adminModerateReview,
  getAdminReviewReports,
  resolveReport,
} from "../../api/reviews";
import ReviewModerationBadge from "../../components/reviews/ReviewModerationBadge";

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "flagged", label: "Flagged" },
  { key: "all", label: "All Reviews" },
  { key: "reports", label: "Reports" },
];

const FlagPill = ({ active, label }) =>
  active ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
      <AlertTriangle size={10} />
      {label}
    </span>
  ) : null;

const ModerateDialog = ({ reviewId, onDone }) => {
  const [decision, setDecision] = useState("approved");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      await adminModerateReview(reviewId, { decision, reason, note });
      onDone(reviewId, decision);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
      <div className="flex gap-2 flex-wrap">
        {[
          { value: "approved", label: "Approve", color: "green" },
          { value: "rejected", label: "Reject", color: "red" },
          { value: "flagged", label: "Flag", color: "orange" },
          { value: "hidden", label: "Hide", color: "gray" },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setDecision(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              decision === opt.value
                ? `bg-${opt.color}-600 text-white border-${opt.color}-600`
                : `bg-white text-${opt.color}-700 border-${opt.color}-300 hover:bg-${opt.color}-50`
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason (shown to user, optional)"
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400"
      />
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Internal note (admin only, optional)"
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400"
      />
      <button
        onClick={submit}
        disabled={submitting}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors"
      >
        {submitting && <Loader2 size={14} className="animate-spin" />}
        Confirm {decision}
      </button>
    </div>
  );
};

const ReviewsQueue = ({ statusFilter }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actingOn, setActingOn] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminReviewQueue({
        status: statusFilter,
        page,
        limit,
      });
      setReviews(res.data || []);
      setTotalPages(res.totalPages || 1);
      setTotal(res.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, limit]);

  useEffect(() => {
    fetch();
    setActingOn(null);
  }, [fetch]);

  useEffect(() => {
    setPage(1);
  }, [limit]);

  const handleDone = (reviewId, decision) => {
    setActingOn(null);
    if (statusFilter !== "all" && statusFilter !== decision) {
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } else {
      fetch();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <Loader2 size={20} className="animate-spin mr-2" />
        Loading...
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="py-16 text-center">
        <CheckCircle size={36} className="text-gray-200 mx-auto mb-3" />
        <p className="text-gray-500">No reviews in this category.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 text-xs text-gray-500">
        <span>
          {total} review{total !== 1 ? "s" : ""} total
        </span>
        <div className="flex items-center gap-2">
          <label htmlFor="limit-select" className="font-medium">
            Items per page:
          </label>
          <select
            id="limit-select"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 outline-none text-gray-700 bg-white"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
      <div className="divide-y divide-gray-50 flex-1 overflow-hidden">
        {reviews.map((review) => {
          const flags = review.autoModFlags || {};
          return (
            <div
              key={review.id}
              className="p-6 hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Rating + status row */}
                  <div className="flex items-center gap-2 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={13}
                        className={
                          i < review.rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-200"
                        }
                      />
                    ))}
                    <ReviewModerationBadge status={review.status} />
                  </div>

                  {/* Comment */}
                  <p className="text-sm text-gray-700 mb-2 leading-relaxed">
                    {review.comment || (
                      <em className="text-gray-400">No comment</em>
                    )}
                  </p>

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-x-1 gap-y-1 text-xs text-gray-400 mb-3">
                    <span>
                      by{" "}
                      <strong className="text-gray-600">
                        {review.user?.fullname || "Unknown"}
                      </strong>
                    </span>
                    <span>
                      on{" "}
                      <strong className="text-gray-600">
                        {review.product?.name + " " + review.product?.model ||
                          "Unknown product"}
                      </strong>
                    </span>
                    <span>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                    {review.autoModScore > 0 && (
                      <span className="font-semibold text-orange-600">
                        Risk score: {(review.autoModScore * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>

                  {/* Automated flag pills */}
                  {review.status === "flagged" && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <FlagPill active={flags.profanity} label="Profanity" />
                      <FlagPill active={flags.spam} label="Spam" />
                      <FlagPill active={flags.nsfw} label="NSFW Image" />
                      <FlagPill active={flags.suspicious} label="Suspicious" />
                      {flags.toxicity > 0 && (
                        <FlagPill
                          active={true}
                          label={`Toxicity ${(flags.toxicity * 100).toFixed(0)}%`}
                        />
                      )}
                      {flags.toxicityCategories?.length > 0 && (
                        <span className="text-xs text-gray-400">
                          ({flags.toxicityCategories.join(", ")})
                        </span>
                      )}
                    </div>
                  )}

                  {/* Media thumbnails */}
                  {review.media?.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {review.media.map((m) => (
                        <img
                          key={m.id}
                          src={m.url}
                          alt="review"
                          className={`w-12 h-12 rounded-lg object-cover border ${
                            flags.nsfw
                              ? "border-red-400 ring-2 ring-red-300"
                              : "border-gray-100"
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Moderation reason (if already acted) */}
                  {review.moderationReason && (
                    <p className="text-xs text-gray-400 mt-2 italic">
                      Reason: {review.moderationReason}
                    </p>
                  )}

                  {/* Action dialog */}
                  {actingOn === review.id && (
                    <ModerateDialog reviewId={review.id} onDone={handleDone} />
                  )}
                </div>

                {/* Action button */}
                <div className="shrink-0">
                  {actingOn === review.id ? (
                    <button
                      onClick={() => setActingOn(null)}
                      className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                    >
                      Cancel
                    </button>
                  ) : (
                    <button
                      onClick={() => setActingOn(review.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold rounded-lg transition-colors"
                    >
                      <ShieldAlert size={12} />
                      Moderate
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-3 p-4 border-t border-gray-100">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
        >
          <ChevronLeft size={14} /> Prev
        </button>
        <span className="text-sm text-gray-600">
          Page {page} of {totalPages || 1}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </>
  );
};

const ReportsQueue = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("open");
  const [resolving, setResolving] = useState({});

  useEffect(() => {
    setPage(1);
  }, [limit]);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminReviewReports({
        status: statusFilter,
        page,
        limit,
      });
      setReports(res.data || []);
      setTotalPages(res.totalPages || 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, limit]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleResolve = async (reportId, resolution) => {
    setResolving((prev) => ({ ...prev, [reportId]: true }));
    try {
      await resolveReport(reportId, resolution);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (e) {
      console.error(e);
    } finally {
      setResolving((prev) => ({ ...prev, [reportId]: false }));
    }
  };

  const REASON_LABELS = {
    spam: "Spam",
    fake_review: "Fake Review",
    profanity: "Profanity",
    competitor_manipulation: "Competitor Manipulation",
    hate_speech: "Hate Speech",
    misleading: "Misleading",
    irrelevant: "Irrelevant",
    abuse: "Abuse",
    other: "Other",
  };

  return (
    <>
      {/* Status filter for reports */}
      <div className="flex gap-2 px-6 py-4 border-b border-gray-100">
        {["open", "resolved", "dismissed", "all"].map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFilter(s);
              setPage(1);
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
              statusFilter === s
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
          <label htmlFor="limit-reports" className="font-medium">
            Items per page:
          </label>
          <select
            id="limit-reports"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 outline-none text-gray-700 bg-white"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 size={20} className="animate-spin mr-2" />
          Loading...
        </div>
      ) : reports.length === 0 ? (
        <div className="py-16 text-center">
          <Flag size={36} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">No reports in this category.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50 flex-1 overflow-hidden">
          {reports.map((report) => (
            <div
              key={report.id}
              className="p-6 hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Reason + role badge */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                      {REASON_LABELS[report.reason] || report.reason}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        report.reporterRole === "seller"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {report.reporterRole}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        report.status === "open"
                          ? "bg-amber-100 text-amber-700"
                          : report.status === "resolved"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>

                  {/* Description */}
                  {report.description && (
                    <p className="text-sm text-gray-600 mb-2 italic">
                      "{report.description}"
                    </p>
                  )}

                  {/* Reported review snippet */}
                  {report.Review && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 mb-2">
                      <div className="flex items-center gap-1 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={11}
                            className={
                              i < report.Review.rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-200"
                            }
                          />
                        ))}
                        <ReviewModerationBadge status={report.Review.status} />
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {report.Review.comment || "No comment"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        by {report.Review.user?.fullname || "User"}
                      </p>
                    </div>
                  )}

                  {/* Reporter + date */}
                  <div className="text-xs text-gray-400">
                    Reported by{" "}
                    <strong className="text-gray-600">
                      {report.reporter?.fullname || "Unknown"}
                    </strong>{" "}
                    • {new Date(report.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Action buttons */}
                {report.status === "open" && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => handleResolve(report.id, "resolved")}
                      disabled={resolving[report.id]}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-bold transition-colors disabled:opacity-60"
                    >
                      {resolving[report.id] ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : (
                        <CheckCircle size={11} />
                      )}
                      Resolve
                    </button>
                    <button
                      onClick={() => handleResolve(report.id, "dismissed")}
                      disabled={resolving[report.id]}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg text-xs font-bold transition-colors disabled:opacity-60"
                    >
                      <XCircle size={11} />
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-center gap-3 p-4 border-t border-gray-100">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
        >
          <ChevronLeft size={14} /> Prev
        </button>
        <span className="text-sm text-gray-600">
          Page {page} of {totalPages || 1}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </>
  );
};

const AdminReviews = () => {
  const [activeTab, setActiveTab] = useState("pending");

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[calc(100vh-6rem)] overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-800">Review Moderation</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Review automated flags, moderate content, and manage abuse reports
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-3 border-b border-gray-100 bg-gray-50/50">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-white text-indigo-700 shadow-sm border border-gray-200"
                : "text-gray-600 hover:bg-white hover:text-gray-800"
            }`}
          >
            {tab.key === "reports" && <Flag size={13} />}
            {tab.key === "flagged" && <AlertTriangle size={13} />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === "reports" ? (
          <ReportsQueue />
        ) : (
          <ReviewsQueue statusFilter={activeTab} />
        )}
      </div>
    </div>
  );
};

export default AdminReviews;
