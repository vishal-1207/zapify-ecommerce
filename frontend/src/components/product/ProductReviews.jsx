import React, { useState, useMemo, useEffect } from "react";
import {
  Star,
  ThumbsUp,
  MessageSquare,
  PlayCircle,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const MOCK_REVIEWS = [
  {
    id: 1,
    user: "Sarah Jenkins",
    rating: 5,
    date: "2 weeks ago",
    title: "Absolutely stunning quality!",
    content:
      "I was hesitant at first due to the price, but the build quality is incredible. It feels premium and works perfectly right out of the box.",
    helpful: 12,
    media: [
      {
        type: "image",
        url: "https://placehold.co/600x400/e2e8f0/64748b?text=Customer+Photo+1",
      },
      {
        type: "image",
        url: "https://placehold.co/400x600/e2e8f0/64748b?text=Customer+Photo+2",
      },
    ],
  },
  {
    id: 2,
    user: "Michael Chen",
    rating: 4,
    date: "1 month ago",
    title: "Great, but shipping was slow",
    content:
      "The product itself is 5 stars, but it took a week longer to arrive than estimated. Otherwise, very happy with the purchase.",
    helpful: 8,
    media: [], // No media
  },
  {
    id: 3,
    user: "Jessica D.",
    rating: 5,
    date: "2 months ago",
    title: "Best purchase of the year",
    content:
      "Exactly what I needed. The color matches the photos perfectly and the functionality is seamless.",
    helpful: 24,
    media: [
      {
        type: "video",
        url: "https://www.w3schools.com/html/mov_bbb.mp4", // Sample video URL
        thumbnail:
          "https://placehold.co/600x400/000000/white?text=Video+Thumbnail",
      },
    ],
  },
];

const RatingBar = ({ star, percentage }) => (
  <div className="flex items-center gap-3 text-sm mb-2">
    <div className="w-12 font-medium text-gray-600">{star} stars</div>
    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-yellow-400 rounded-full"
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
    <div className="w-10 text-right text-gray-400">{percentage}%</div>
  </div>
);

const ProductReviews = ({ product }) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // Flatten all media into a single array for the gallery
  const allMedia = useMemo(() => {
    return MOCK_REVIEWS.reduce((acc, review) => {
      if (review.media) {
        const mediaWithContext = review.media.map((m) => ({
          ...m,
          user: review.user,
          title: review.title,
        }));
        return [...acc, ...mediaWithContext];
      }
      return acc;
    }, []);
  }, []);

  const openLightbox = (reviewIndex, mediaIndex) => {
    // Calculate global index based on previous reviews' media counts
    let globalIndex = 0;
    for (let i = 0; i < reviewIndex; i++) {
      globalIndex += MOCK_REVIEWS[i].media?.length || 0;
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

  // Handle keyboard navigation
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

  const currentMediaItem = allMedia[currentMediaIndex];

  return (
    <div className="py-12 border-t border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">
        Customer Reviews
      </h2>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Left: Summary & Breakdown */}
        <div className="lg:w-1/3">
          <div className="bg-gray-50 rounded-2xl p-8 mb-6">
            <div className="flex items-end gap-4 mb-4">
              <span className="text-6xl font-bold text-gray-900">
                {product.rating}
              </span>
              <div className="mb-2">
                <div className="flex text-yellow-400 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      fill={
                        i < Math.floor(product.rating) ? "currentColor" : "none"
                      }
                      className={
                        i >= Math.floor(product.rating) ? "text-gray-300" : ""
                      }
                    />
                  ))}
                </div>
                <p className="text-gray-500 text-sm">
                  {product.reviews} verified reviews
                </p>
              </div>
            </div>

            <div className="mt-6">
              <RatingBar star={5} percentage={70} />
              <RatingBar star={4} percentage={20} />
              <RatingBar star={3} percentage={5} />
              <RatingBar star={2} percentage={2} />
              <RatingBar star={1} percentage={3} />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-gray-800">Share your thoughts</h3>
            <p className="text-gray-500 text-sm">
              If you've used this product, share your thoughts with other
              customers.
            </p>
            <button className="w-full bg-white border border-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition">
              Write a Review
            </button>
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
                  <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center text-xs text-gray-500 font-bold cursor-pointer hover:bg-gray-100 flex-shrink-0">
                    +{allMedia.length - 5}
                  </div>
                )}
              </div>
            </div>
          )}

          {MOCK_REVIEWS.map((review, rIdx) => (
            <div
              key={review.id}
              className="border-b border-gray-100 pb-8 last:border-0 last:pb-0"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm">
                    {review.user.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{review.user}</h4>
                    <span className="text-xs text-gray-500">{review.date}</span>
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

              <h5 className="font-bold text-gray-800 mt-3 mb-2">
                {review.title}
              </h5>
              <p className="text-gray-600 leading-relaxed mb-4">
                {review.content}
              </p>

              {/* Media Gallery within Review */}
              {review.media && review.media.length > 0 && (
                <div className="flex gap-3 mb-4">
                  {review.media.map((item, mIdx) => (
                    <div
                      key={mIdx}
                      onClick={() => openLightbox(rIdx, mIdx)}
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
                <button className="flex items-center gap-1.5 hover:text-indigo-600 transition">
                  <ThumbsUp size={16} /> Helpful ({review.helpful})
                </button>
                <button className="flex items-center gap-1.5 hover:text-indigo-600 transition">
                  <MessageSquare size={16} /> Comment
                </button>
                <span className="text-xs text-gray-400 ml-auto">
                  Verified Purchase
                </span>
              </div>
            </div>
          ))}

          <button className="text-indigo-600 font-bold hover:underline">
            View all {product.reviews} reviews
          </button>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 text-white/70 hover:text-white transition p-2 bg-black/50 rounded-full z-50"
          >
            <X size={24} />
          </button>

          {/* Navigation Arrows */}
          <button
            onClick={prevMedia}
            className="absolute left-4 md:left-8 text-white/70 hover:text-white transition p-3 bg-black/50 rounded-full hover:bg-black/70 z-50"
          >
            <ChevronLeft size={32} />
          </button>

          <button
            onClick={nextMedia}
            className="absolute right-4 md:right-8 text-white/70 hover:text-white transition p-3 bg-black/50 rounded-full hover:bg-black/70 z-50"
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
            <div className="absolute bottom-6 left-0 right-0 text-center text-white p-4 bg-linear-to-t from-black/80 to-transparent">
              <p className="font-bold text-lg">{currentMediaItem.user}</p>
              <p className="text-sm text-gray-300 line-clamp-1 max-w-2xl mx-auto">
                {currentMediaItem.title}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Image {currentMediaIndex + 1} of {allMedia.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
