import React, { useState } from "react";
import { X, Flag, Loader2 } from "lucide-react";
import { reportReview } from "../../api/reviews";

const REPORT_REASONS = [
  { value: "spam", label: "Spam or advertising" },
  { value: "fake_review", label: "Fake or incentivised review" },
  { value: "profanity", label: "Profanity or offensive language" },
  { value: "competitor_manipulation", label: "Competitor manipulation" },
  { value: "hate_speech", label: "Hate speech or discrimination" },
  { value: "misleading", label: "Misleading or false information" },
  { value: "irrelevant", label: "Irrelevant to the product" },
  { value: "abuse", label: "Abusive or harassing content" },
  { value: "other", label: "Other" },
];

/**
 * Modal for users or sellers to report a review for abuse.
 * @param {boolean} isOpen
 * @param {function} onClose
 * @param {string} reviewId
 * @param {function} onSuccess - optional callback on successful submission
 */
const ReportReviewModal = ({ isOpen, onClose, reviewId, onSuccess }) => {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setReason("");
    setDescription("");
    setError(null);
    setSuccess(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      setError("Please select a reason for reporting.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await reportReview(reviewId, { reason, description: description.trim() });
      setSuccess(true);
      onSuccess?.();
      setTimeout(handleClose, 2000);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Failed to submit report. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <Flag size={14} className="text-red-600" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Report Review</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Flag size={24} className="text-green-600" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-1">
              Report Submitted
            </h4>
            <p className="text-sm text-gray-500">
              Thank you. Our team will review your report.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <p className="text-sm text-gray-500">
              Help us understand why this review is inappropriate.
            </p>

            {/* Reason selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Reason <span className="text-red-500">*</span>
              </label>
              <div className="grid gap-2 max-h-48 overflow-y-auto pr-1">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      reason === r.value
                        ? "border-red-400 bg-red-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={() => setReason(r.value)}
                      className="accent-red-500"
                    />
                    <span className="text-sm text-gray-700">{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Additional details */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Additional details{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Provide more context about the issue..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 resize-none"
              />
              <p className="text-xs text-gray-400 text-right mt-0.5">
                {description.length}/500
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !reason}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <>
                    <Flag size={14} />
                    Submit Report
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReportReviewModal;
