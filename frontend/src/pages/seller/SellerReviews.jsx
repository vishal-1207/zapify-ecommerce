import React, { useEffect, useState, useCallback } from "react";
import {
  Star,
  MessageSquare,
  Flag,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Send,
  Filter,
  Search,
} from "lucide-react";
import { getSellerReviews, addSellerResponse } from "../../api/reviews";
import ReportReviewModal from "../../components/reviews/ReportReviewModal";
import ReviewModerationBadge from "../../components/reviews/ReviewModerationBadge";

const StarDisplay = ({ rating }) =>
  [...Array(5)].map((_, i) => (
    <Star
      key={i}
      size={13}
      className={
        i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"
      }
    />
  ));

const SellerReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState({
    hasResponse: "",
    rating: "",
    sortBy: "newest",
    search: "",
  });
  const [searchInput, setSearchInput] = useState("");

  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replyError, setReplyError] = useState(null);

  const [reportTarget, setReportTarget] = useState(null);

  const handleReportSuccess = () => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reportTarget
          ? { ...r, reports: [{ id: "optimistic" }], status: "flagged" }
          : r,
      ),
    );
    setReportTarget(null);
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      if (filters.search !== searchInput) {
        setFilters((prev) => ({ ...prev, search: searchInput }));
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput, filters.search]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  useEffect(() => {
    setPage(1);
  }, [limit]);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSellerReviews({ page, limit, ...filters });
      setReviews(res.data || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleReply = async (reviewId) => {
    if (!replyText.trim()) return;
    setReplySubmitting(true);
    setReplyError(null);
    try {
      await addSellerResponse(reviewId, replyText.trim());
      setReplyingTo(null);
      setReplyText("");
      fetchReviews();
    } catch (err) {
      setReplyError(err?.response?.data?.message || "Failed to post response.");
    } finally {
      setReplySubmitting(false);
    }
  };

  const openReply = (reviewId, existing) => {
    setReplyingTo(reviewId);
    setReplyText(existing || "");
    setReplyError(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Review Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Monitor, respond, and report customer reviews across your products
          </p>
        </div>
      </div>

      {/* Advanced Filters Bar */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="flex-1 w-full relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search reviews..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <select
            value={filters.hasResponse}
            onChange={(e) => handleFilterChange("hasResponse", e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="false">Needs Reply</option>
            <option value="true">Replied</option>
          </select>

          <select
            value={filters.rating}
            onChange={(e) => handleFilterChange("rating", e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange("sortBy", e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
          </select>

          <div className="flex items-center gap-2 pl-2 border-l border-gray-100">
            <label className="text-xs text-gray-500 font-medium whitespace-nowrap">
              Show:
            </label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="border border-gray-200 rounded-xl px-2 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Review list */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 size={20} className="animate-spin mr-2" />
            Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-16 text-center">
            <MessageSquare size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No reviews found</p>
            <p className="text-sm text-gray-400 mt-1">
              Reviews from your customers will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="p-6 hover:bg-gray-50/50 transition-colors"
              >
                {/* Top row: stars + product + status */}
                <div className="flex items-start justify-between gap-6 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 border border-gray-100 bg-gray-50 px-3 py-1.5 rounded-lg w-fit">
                        <div className="flex items-center">
                          <StarDisplay rating={review.rating} />
                        </div>
                        <span className="text-sm font-bold text-gray-800">
                          {review.rating}.0
                        </span>
                      </div>
                      <ReviewModerationBadge
                        status={review.status}
                        reason={review.moderationReason}
                      />
                    </div>

                    <p className="text-sm text-gray-800 leading-relaxed font-medium">
                      {review.comment || (
                        <em className="text-gray-400 font-normal">
                          No written comment
                        </em>
                      )}
                    </p>

                    <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-3 text-xs text-gray-500">
                      <div className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">
                        {review.user?.fullname?.charAt(0) || "C"}
                      </div>
                      <span className="font-semibold text-gray-700">
                        {review.user?.fullname || "Customer"}
                      </span>
                      <span className="text-gray-300 px-1">•</span>
                      <span className="px-2 py-1 bg-gray-50 border border-gray-100 rounded text-gray-600 truncate max-w-[200px]">
                        {review.product?.name || "Product"}
                      </span>
                      <span className="text-gray-300 px-1">•</span>
                      <span>
                        {new Date(review.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() =>
                        openReply(review.id, review.sellerResponse)
                      }
                      className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm"
                    >
                      <MessageSquare size={14} />
                      {review.sellerResponse ? "Edit Reply" : "Reply"}
                    </button>
                    <button
                      onClick={() => setReportTarget(review.id)}
                      disabled={review.reports && review.reports.length > 0}
                      className={`flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold border rounded-xl transition-all shadow-sm ${
                        review.reports && review.reports.length > 0
                          ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-white border-red-200 text-red-600 hover:bg-red-50"
                      }`}
                    >
                      <Flag size={14} />
                      {review.reports && review.reports.length > 0
                        ? "Reported"
                        : "Report"}
                    </button>
                  </div>
                </div>

                {/* Media thumbnails */}
                {review.media?.length > 0 && (
                  <div className="flex gap-2 mt-3 mb-3">
                    {review.media.map((m) => (
                      <img
                        key={m.id}
                        src={m.url}
                        alt="review"
                        className="w-12 h-12 rounded-lg object-cover border border-gray-100"
                      />
                    ))}
                  </div>
                )}

                {/* Existing seller response */}
                {review.sellerResponse && replyingTo !== review.id && (
                  <div className="mt-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 rounded-l-xl"></div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold font-mono tracking-wider text-indigo-700 uppercase">
                        Your Public Response
                      </p>
                      <p className="text-xs text-indigo-400 font-medium">
                        {review.sellerResponseAt
                          ? new Date(
                              review.sellerResponseAt,
                            ).toLocaleDateString()
                          : ""}
                      </p>
                    </div>
                    <p className="text-sm text-indigo-900 leading-relaxed">
                      {review.sellerResponse}
                    </p>
                  </div>
                )}

                {/* Inline reply form */}
                {replyingTo === review.id && (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={3}
                      maxLength={1000}
                      placeholder="Write your public response to this review..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                      autoFocus
                    />
                    <div className="flex items-center justify-between">
                      {replyError && (
                        <p className="text-xs text-red-600">{replyError}</p>
                      )}
                      <div className="flex gap-2 ml-auto">
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText("");
                          }}
                          className="px-3 py-1.5 text-xs font-medium border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleReply(review.id)}
                          disabled={replySubmitting || !replyText.trim()}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                        >
                          {replySubmitting ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Send size={12} />
                          )}
                          Post Response
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="bg-white pt-2 pb-2 flex items-center justify-center gap-3">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
        >
          <ChevronLeft size={14} /> Prev
        </button>
        <span className="text-sm text-gray-600">
          Page {page} of {totalPages || 1}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>

      {/* Report modal */}
      <ReportReviewModal
        isOpen={!!reportTarget}
        onClose={() => setReportTarget(null)}
        reviewId={reportTarget}
        onSuccess={handleReportSuccess}
      />
    </div>
  );
};

export default SellerReviews;
