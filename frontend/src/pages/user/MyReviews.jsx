import React, { useEffect, useState, useCallback } from "react";
import { fetchMyReviews } from "../../api/reviews";
import ReviewModerationBadge from "../../components/reviews/ReviewModerationBadge";
import { format } from "date-fns";
import { Edit, Package, AlertCircle, Trash2 } from "lucide-react";
import ReviewModal from "../../components/reviews/ReviewModal";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import api from "../../api/axios";
import { toast } from "react-hot-toast";

const MyReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchMyReviews({ page, limit: 10 });
      setReviews(res.data || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load your reviews.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleEditClick = (review) => {
    const itemToReview = {
      ...review.OrderItem,
      product: review.product,
      existingReview: review, // Pass existing review data to pre-fill
    };

    setEditingReview(itemToReview);
    setIsEditModalOpen(true);
  };

  const handleUpdateReview = async (item, formData) => {
    try {
      setIsSubmitting(true);
      await api.patch(`/review/${item.existingReview.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Review updated and submitted for moderation.");
      setIsEditModalOpen(false);
      setEditingReview(null);
      loadReviews(); // Reload list to show pending
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (reviewId) => {
    setReviewToDelete(reviewId);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteReview = async () => {
    if (!reviewToDelete) return;
    try {
      setIsDeleting(true);
      await api.delete(`/review/${reviewToDelete}`);
      toast.success("Review deleted successfully.");
      setIsDeleteModalOpen(false);
      setReviewToDelete(null);
      loadReviews();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete review.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">{error}</p>
        <button
          onClick={loadReviews}
          className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow px-6 py-5 border-b border-gray-100 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">My Reviews</h1>
        <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">
          {reviews.length} {reviews.length === 1 ? "Review" : "Reviews"}
        </span>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            No reviews yet
          </h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            You haven't submitted any reviews for your purchased products yet.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {reviews.map((review) => {
              const { product, status, moderationReason } = review;
              const isEditable = status !== "hidden";

              return (
                <li key={review.id} className="p-6 transition hover:bg-gray-50">
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Product Image & Info */}
                    <div className="sm:w-1/4 shrink-0 flex gap-4">
                      {product?.media?.[0]?.url ? (
                        <img
                          src={product.media[0].url}
                          alt={product.name}
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200 bg-white"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-300" />
                        </div>
                      )}

                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 line-clamp-2 text-sm">
                          {product?.name} {product?.model}
                        </span>
                        <ReviewModerationBadge
                          status={status}
                          className="mt-2"
                        />
                      </div>
                    </div>

                    {/* Review Content */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`w-4 h-4 ${
                                star <= review.rating
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-300"
                              }`}
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-xs text-gray-400">
                          {format(new Date(review.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>

                      <p className="text-gray-700 text-sm mb-4">
                        {review.comment || (
                          <span className="text-gray-400 italic">
                            No comment provided
                          </span>
                        )}
                      </p>

                      {/* Attached Media */}
                      {review.media?.length > 0 && (
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                          {review.media.map((m) => (
                            <img
                              key={m.id}
                              src={m.url}
                              alt="Review attachment"
                              className="w-16 h-16 object-cover rounded-md border border-gray-200 shrink-0"
                            />
                          ))}
                        </div>
                      )}

                      {/* Moderation Feedback */}
                      {moderationReason && (
                        <div
                          className={`mt-2 p-3 rounded-md text-sm ${
                            status === "rejected"
                              ? "bg-red-50 text-red-700 border border-red-100"
                              : status === "flagged"
                                ? "bg-orange-50 text-orange-800 border border-orange-100"
                                : "bg-gray-50 text-gray-700"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <div>
                              <strong className="block mb-0.5">
                                Moderation Feedback:
                              </strong>
                              {moderationReason}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="sm:w-32 shrink-0 flex flex-col justify-end">
                      {isEditable && (
                        <div className="flex flex-col gap-2 w-full">
                          <button
                            onClick={() => handleEditClick(review)}
                            className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-transparent rounded-lg hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(review.id)}
                            className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-transparent rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded text-sm font-medium border border-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <div className="flex items-center px-4 text-sm text-gray-600 font-medium">
            Page {page} of {totalPages}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 rounded text-sm font-medium border border-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Edit Modal (Re-uses same ReviewModal from orders) */}
      <ReviewModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingReview(null);
        }}
        onSubmit={handleUpdateReview}
        isSubmitting={isSubmitting}
        itemsToReview={editingReview ? [editingReview] : []}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setReviewToDelete(null);
        }}
        onConfirm={confirmDeleteReview}
        title="Delete Review"
        message="Are you sure you want to permanently delete this review? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default MyReviews;
