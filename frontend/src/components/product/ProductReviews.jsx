import React, { useState, useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  PlayCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";

import { getProductReviews, toggleReviewVote } from "../../api/reviews";

const RatingBar = ({ star, percentage, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-3 text-sm mb-2 ${onClick ? "cursor-pointer hover:bg-gray-50 p-1 -ml-1 rounded transition" : ""}`}
  >
    <div
      className={`w-12 font-medium ${onClick ? "text-indigo-600 font-bold" : "text-gray-600"}`}
    >
      {star} stars
    </div>
    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-yellow-400 rounded-full"
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
    <div className="w-10 text-right text-gray-400">{percentage}%</div>
  </div>
);

const ReviewItem = ({
  review,
  originalIndex,
  isAuthenticated,
  user,
  handleVote,
  openLightbox,
}) => {
  const hasLiked = isAuthenticated && review.likedBy?.includes(user?.id);
  const hasDisliked = isAuthenticated && review.dislikedBy?.includes(user?.id);
  const isOwnReview =
    isAuthenticated && user?.id === (review.user?.id || review.userId);

  return (
    <div className="border-b border-gray-100 pb-8 last:border-0 last:pb-0">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm">
            {(review.user?.fullname || review.User?.fullname || "V")
              .charAt(0)
              .toUpperCase()}
          </div>
          <div>
            <h4 className="font-bold text-gray-900">
              {review.user?.fullname ||
                review.User?.fullname ||
                "Verified Buyer"}
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {new Date(review.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              {review.OrderItem?.Offer?.sellerProfile?.storeName && (
                <>
                  <span className="text-gray-300 text-xs">•</span>
                  <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    Bought from {review.OrderItem.Offer.sellerProfile.storeName}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex text-yellow-400">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={14}
              fill={i < review.rating ? "currentColor" : "none"}
              className={i >= review.rating ? "text-gray-200" : ""}
            />
          ))}
        </div>
      </div>

      {review.title && (
        <h5 className="font-bold text-gray-800 mt-3 mb-2">{review.title}</h5>
      )}
      <p className="text-gray-600 leading-relaxed mt-3 mb-4">
        {review.comment}
      </p>

      {/* Media Gallery within Review */}
      {review.media && review.media.length > 0 && (
        <div className="flex gap-3 mb-4">
          {review.media.map((item, mIdx) => (
            <div
              key={mIdx}
              onClick={() => openLightbox(originalIndex, mIdx)}
              className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 cursor-pointer group"
            >
              {item.type === "video" ? (
                <>
                  <img
                    src={item.thumbnail}
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition"
                    alt="video thumbnail"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition">
                    <PlayCircle
                      className="text-white drop-shadow-md"
                      size={32}
                    />
                  </div>
                </>
              ) : (
                <img
                  src={item.url}
                  className="w-full h-full object-cover hover:scale-110 transition duration-500"
                  alt="review image"
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-6 text-sm text-gray-500">
        <button
          onClick={() =>
            handleVote(review.id, "like", review.user?.id || review.userId)
          }
          disabled={isOwnReview}
          title={isOwnReview ? "You cannot vote on your own review" : ""}
          className={`flex items-center gap-1.5 transition ${
            isOwnReview
              ? "opacity-40 cursor-not-allowed"
              : hasLiked
                ? "text-indigo-600 font-medium"
                : "hover:text-indigo-600"
          }`}
        >
          <ThumbsUp size={16} className={hasLiked ? "fill-indigo-600" : ""} />
          Helpful ({review.likes || 0})
        </button>
        <button
          onClick={() =>
            handleVote(review.id, "dislike", review.user?.id || review.userId)
          }
          disabled={isOwnReview}
          title={isOwnReview ? "You cannot vote on your own review" : ""}
          className={`flex items-center gap-1.5 transition ${
            isOwnReview
              ? "opacity-40 cursor-not-allowed"
              : hasDisliked
                ? "text-red-500 font-medium"
                : "hover:text-red-500"
          }`}
        >
          <ThumbsDown size={16} className={hasDisliked ? "fill-red-500" : ""} />
          ({review.dislikes || 0})
        </button>
        <span className="text-xs text-gray-400 ml-auto">Verified Purchase</span>
      </div>
    </div>
  );
};

const ProductReviews = ({ product }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lightbox State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // Reviews Modal State
  const [isAllReviewsModalOpen, setIsAllReviewsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  const { user } = useSelector((state) => state.auth);
  const isAuthenticated = !!user;
  const navigate = useNavigate();

  useEffect(() => {
    if (product && product.id) {
      setLoading(true);
      getProductReviews(product.id)
        .then((res) => {
          setReviews(res.reviews || []);
        })
        .catch((err) => {
          console.error("Failed to load reviews:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [product?.id]);

  const handleVote = async (reviewId, voteType, reviewUserId) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (user?.id === reviewUserId) {
      toast.error("You cannot vote on your own review.");
      return;
    }

    // Optimistic Update
    const originalReviews = [...reviews];
    setReviews((prevReviews) =>
      prevReviews.map((review) => {
        if (review.id !== reviewId) return review;

        const likedBy = review.likedBy || [];
        const dislikedBy = review.dislikedBy || [];
        const hasLiked = likedBy.includes(user.id);
        const hasDisliked = dislikedBy.includes(user.id);

        let newLikes = review.likes || 0;
        let newDislikes = review.dislikes || 0;
        let newLikedBy = [...likedBy];
        let newDislikedBy = [...dislikedBy];

        if (voteType === "like") {
          if (hasLiked) {
            newLikedBy = newLikedBy.filter((id) => id !== user.id);
            newLikes--;
          } else {
            newLikedBy.push(user.id);
            newLikes++;
            if (hasDisliked) {
              newDislikedBy = newDislikedBy.filter((id) => id !== user.id);
              newDislikes--;
            }
          }
        } else {
          if (hasDisliked) {
            newDislikedBy = newDislikedBy.filter((id) => id !== user.id);
            newDislikes--;
          } else {
            newDislikedBy.push(user.id);
            newDislikes++;
            if (hasLiked) {
              newLikedBy = newLikedBy.filter((id) => id !== user.id);
              newLikes--;
            }
          }
        }

        return {
          ...review,
          likes: newLikes,
          dislikes: newDislikes,
          likedBy: newLikedBy,
          dislikedBy: newDislikedBy,
        };
      }),
    );

    try {
      await toggleReviewVote(reviewId, voteType);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to submit vote.");
      // Revert on failure
      setReviews(originalReviews);
    }
  };

  // Flatten all media into a single array for the gallery
  const allMedia = useMemo(() => {
    return reviews.reduce((acc, review) => {
      if (review.media && review.media.length > 0) {
        const mediaWithContext = review.media.map((m) => ({
          ...m,
          user:
            review.user?.fullname || review.User?.fullname || "Verified Buyer",
          title: review.title || review.comment || "Review Media",
        }));
        return [...acc, ...mediaWithContext];
      }
      return acc;
    }, []);
  }, [reviews]);

  const openLightbox = (reviewIndex, mediaIndex) => {
    // Calculate global index based on previous reviews' media counts
    // Note: reviewIndex must be the index from the ORIGINAL reviews array!
    let globalIndex = 0;
    for (let i = 0; i < reviewIndex; i++) {
      globalIndex += reviews[i].media?.length || 0;
    }
    globalIndex += mediaIndex;

    setCurrentMediaIndex(globalIndex);
    setIsLightboxOpen(true);
    document.body.style.overflow = "hidden"; // Prevent background scrolling
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    document.body.style.overflow = "unset";
  };

  const nextMedia = (e) => {
    e?.stopPropagation();
    setCurrentMediaIndex((prev) => (prev + 1) % allMedia.length);
  };

  const prevMedia = (e) => {
    e?.stopPropagation();
    setCurrentMediaIndex(
      (prev) => (prev - 1 + allMedia.length) % allMedia.length,
    );
  };

  // Handle keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isLightboxOpen) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextMedia();
      if (e.key === "ArrowLeft") prevMedia();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen]);

  const filteredReviews = useMemo(() => {
    if (activeFilter === "all") return reviews;
    if (activeFilter === "media")
      return reviews.filter((r) => r.media && r.media.length > 0);
    return reviews.filter((r) => r.rating === parseInt(activeFilter));
  }, [reviews, activeFilter]);

  return (
    <div className="py-12 border-t border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">
        Customer Reviews
      </h2>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Left: Summary & Breakdown */}
        <div className="lg:w-1/3">
          <div className="bg-gray-50 rounded-2xl p-8 mb-6 sticky top-24">
            <div className="flex items-end gap-4 mb-4">
              <span className="text-6xl font-bold text-gray-900">
                {product.averageRating || "0.0"}
              </span>
              <div className="mb-2">
                <div className="flex text-yellow-400 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      fill={
                        i < Math.floor(product.averageRating || 0)
                          ? "currentColor"
                          : "none"
                      }
                      className={
                        i >= Math.floor(product.averageRating || 0)
                          ? "text-gray-300"
                          : ""
                      }
                    />
                  ))}
                </div>
                <p className="text-gray-500 text-sm">
                  {reviews.length || 0} verified reviews
                </p>
              </div>
            </div>

            <div className="mt-6">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviews.filter((r) => r.rating === star).length;
                const percentage =
                  reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                return (
                  <RatingBar
                    key={star}
                    star={star}
                    percentage={Math.round(percentage)}
                    onClick={() => {
                      setActiveFilter(star.toString());
                      setIsAllReviewsModalOpen(true);
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Review List */}
        <div className="lg:w-2/3 space-y-8">
          {/* Header for Reviews with Images */}
          {allMedia.length > 0 && (
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100 overflow-x-auto">
              <h4 className="font-bold text-gray-900 whitespace-nowrap">
                Customer images
              </h4>
              <div className="flex gap-2">
                {allMedia.slice(0, 5).map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setCurrentMediaIndex(idx);
                      setIsLightboxOpen(true);
                      document.body.style.overflow = "hidden";
                    }}
                    className="w-16 h-16 bg-gray-100 rounded-lg cursor-pointer overflow-hidden border border-transparent hover:border-indigo-500 flex-shrink-0 relative"
                  >
                    <img
                      src={item.type === "video" ? item.thumbnail : item.url}
                      className="w-full h-full object-cover"
                      alt="review thumbnail"
                    />
                    {item.type === "video" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <PlayCircle size={20} className="text-white" />
                      </div>
                    )}
                  </div>
                ))}
                {allMedia.length > 5 && (
                  <div
                    onClick={() => {
                      setActiveFilter("media");
                      setIsAllReviewsModalOpen(true);
                    }}
                    className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center text-xs text-gray-500 font-bold cursor-pointer hover:bg-gray-100 flex-shrink-0"
                  >
                    +{allMedia.length - 5}
                  </div>
                )}
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8 text-gray-500 font-medium">
              Loading reviews...
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500 font-medium">
              No reviews yet.
            </div>
          ) : (
            reviews.slice(0, 20).map((review) => {
              const originalIndex = reviews.findIndex(
                (r) => r.id === review.id,
              );
              return (
                <ReviewItem
                  key={review.id}
                  review={review}
                  originalIndex={originalIndex}
                  isAuthenticated={isAuthenticated}
                  user={user}
                  handleVote={handleVote}
                  openLightbox={openLightbox}
                />
              );
            })
          )}

          {reviews.length > 20 && (
            <button
              onClick={() => {
                setActiveFilter("all");
                setIsAllReviewsModalOpen(true);
              }}
              className="text-indigo-600 font-bold hover:underline mt-4"
            >
              View all {product.reviewCount || reviews.length} reviews
            </button>
          )}
        </div>
      </div>

      {/* All Reviews Modal */}
      {isAllReviewsModalOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white z-10">
              <h3 className="text-2xl font-bold text-gray-900">All Reviews</h3>
              <button
                onClick={() => setIsAllReviewsModalOpen(false)}
                className="text-gray-400 hover:text-gray-900 transition p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={24} />
              </button>
            </div>

            {/* Filter Bar */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex gap-2 overflow-x-auto">
              <div className="flex items-center text-gray-400 mr-2">
                <Filter size={18} />
              </div>
              {[
                { id: "all", label: "All Reviews" },
                { id: "5", label: "5 Stars" },
                { id: "4", label: "4 Stars" },
                { id: "3", label: "3 Stars" },
                { id: "2", label: "2 Stars" },
                { id: "1", label: "1 Star" },
                { id: "media", label: "With Media" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    activeFilter === filter.id
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Filtered Reviews List */}
            <div className="overflow-y-auto flex-1 p-6 custom-scrollbar bg-white">
              {filteredReviews.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No reviews found for this filter.
                </div>
              ) : (
                <div className="space-y-8">
                  {filteredReviews.map((review) => {
                    const originalIndex = reviews.findIndex(
                      (r) => r.id === review.id,
                    );
                    return (
                      <ReviewItem
                        key={review.id}
                        review={review}
                        originalIndex={originalIndex}
                        isAuthenticated={isAuthenticated}
                        user={user}
                        handleVote={handleVote}
                        openLightbox={openLightbox}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen &&
        allMedia[currentMediaIndex] &&
        (() => {
          const currentMediaItem = allMedia[currentMediaIndex];
          return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
              {/* Close Button */}
              <button
                onClick={closeLightbox}
                className="cursor-pointer absolute top-6 right-6 text-white/70 hover:text-white transition p-2 bg-black/50 rounded-full z-50"
              >
                <X size={24} />
              </button>

              {/* Navigation Arrows */}
              <button
                onClick={prevMedia}
                className="cursor-pointer absolute left-4 md:left-8 text-white/70 hover:text-white transition p-3 bg-black/50 rounded-full hover:bg-black/70 z-50"
              >
                <ChevronLeft size={32} />
              </button>

              <button
                onClick={nextMedia}
                className="cursor-pointer absolute right-4 md:right-8 text-white/70 hover:text-white transition p-3 bg-black/50 rounded-full hover:bg-black/70 z-50"
              >
                <ChevronRight size={32} />
              </button>

              {/* Content */}
              <div
                className="w-full h-full flex flex-col items-center justify-center p-4 md:p-12"
                onClick={closeLightbox}
              >
                <div
                  className="relative max-w-5xl max-h-[85vh] w-full flex items-center justify-center"
                  onClick={(e) => e.stopPropagation()} // Prevent close when clicking content
                >
                  {currentMediaItem.type === "video" ? (
                    <video
                      src={currentMediaItem.url}
                      controls
                      autoPlay
                      className="max-w-full max-h-[80vh] rounded shadow-2xl bg-black"
                    />
                  ) : (
                    <img
                      src={currentMediaItem.url}
                      alt="Review Media"
                      className="max-w-full max-h-[85vh] object-contain rounded shadow-2xl"
                    />
                  )}
                </div>

                {/* Media Caption */}
                <div className="absolute bottom-0 left-0 right-0 text-center text-white pb-8 pt-16 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="font-bold text-lg">{currentMediaItem.user}</p>
                  <p className="text-sm text-gray-300 line-clamp-1 max-w-2xl mx-auto">
                    {currentMediaItem.title}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
};

export default ProductReviews;
