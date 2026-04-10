import React, { useState, useEffect } from "react";
import { X, Star, Upload, Loader2, CheckCircle2 } from "lucide-react";
import { useCallback } from "react";

const ReviewModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  itemsToReview = [],
  startingIndex = 0,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const resetForm = useCallback(() => {
    const current =
      itemsToReview[
        Math.min(startingIndex, Math.max(0, itemsToReview.length - 1))
      ];
    const existing = current?.existingReview;

    setRating(existing?.rating || 0);
    setHoverRating(0);
    setComment(existing?.comment || "");
    setFiles([]);

    const existingMedia = existing?.media?.map((m) => m.url) || [];
    setPreviews(existingMedia);

    setShowSuccess(false);
  }, [itemsToReview, startingIndex]);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(
        Math.min(startingIndex, Math.max(0, itemsToReview.length - 1)),
      );
      resetForm();
    }
  }, [isOpen, startingIndex, itemsToReview.length, resetForm]);

  if (!isOpen || itemsToReview.length === 0) return null;

  const currentItem = itemsToReview[currentIndex];

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 5) {
      alert("You can only upload up to 5 images.");
      return;
    }
    setFiles((prev) => [...prev, ...selectedFiles]);

    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Please provide a star rating.");
      return;
    }

    const formData = new FormData();
    formData.append("rating", rating);
    if (comment.trim()) {
      formData.append("comment", comment.trim());
    }

    const existingMediaToKeepIds =
      currentItem?.existingReview?.media
        ?.filter((m) => previews.includes(m.url))
        ?.map((m) => m.id) || [];

    const originalMediaIds =
      currentItem?.existingReview?.media?.map((m) => m.id) || [];
    const mediaToDelete = originalMediaIds.filter(
      (id) => !existingMediaToKeepIds.includes(id),
    );

    if (mediaToDelete.length > 0) {
      formData.append("mediaToDelete", JSON.stringify(mediaToDelete));
    }

    files.forEach((file) => {
      if (file instanceof File) {
        formData.append("gallery", file);
      }
    });

    try {
      await onSubmit(currentItem, formData);

      if (currentIndex < itemsToReview.length - 1) {
        setShowSuccess(true);
        setTimeout(() => {
          setCurrentIndex((prev) => prev + 1);
          resetForm();
        }, 1500);
      } else {
        onClose();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 animate-backdrop">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative animate-modal-slide">
        <button
          onClick={onClose}
          className="cursor-pointer absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        {showSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
            <CheckCircle2 size={64} className="text-green-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Review Submitted!
            </h3>
            <p className="text-gray-500">Loading next item...</p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex justify-between items-end">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  Leave a rating
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2 pr-6">
                  {currentItem?.Offer?.product?.name || "Product"}
                </p>
              </div>
              {itemsToReview.length > 1 && (
                <div className="text-xs font-medium text-gray-400 shrink-0 bg-gray-100 px-2 py-1 rounded-full">
                  {currentIndex + 1} of {itemsToReview.length}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overall Rating <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="cursor-pointer focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        size={32}
                        className={`${
                          star <= (hoverRating || rating)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        } transition-colors`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add a written review (optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What did you like or dislike about this product?"
                  rows={4}
                  maxLength={300}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {comment.length}/300
                </p>
              </div>

              {/* Media Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add photos (optional)
                </label>
                {files.length < 5 && (
                  <label className="flex items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-6 h-6 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">
                        <span className="font-semibold text-indigo-600">
                          Click to upload
                        </span>
                      </p>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}

                {previews.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {previews.map((preview, index) => (
                      <div
                        key={index}
                        className="relative group w-16 h-16 rounded-md border border-gray-200 overflow-hidden"
                      >
                        <img
                          src={preview}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="cursor-pointer absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 flex gap-3">
                {itemsToReview.length > 1 &&
                  currentIndex < itemsToReview.length - 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentIndex((prev) => prev + 1);
                        resetForm();
                      }}
                      className="cursor-pointer flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                    >
                      Skip
                    </button>
                  )}
                <button
                  type="submit"
                  disabled={isSubmitting || rating === 0}
                  className="flex-[2] flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Submit Review"
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ReviewModal;
