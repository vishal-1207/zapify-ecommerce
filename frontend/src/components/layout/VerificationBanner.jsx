import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Send } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const VerificationBanner = () => {
  const { user, resendVerification } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const traverse = useNavigate();

  if (!user || user.isEmailVerified) return null;

  const handleResend = async () => {
    setLoading(true);
    const result = await resendVerification();
    setLoading(false);
    setMessage(result.message);
    setTimeout(() => setMessage(""), 5000);
    if (result.success) {
      traverse("/verify-email");
    }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 p-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-800">
        <div className="flex items-center gap-2">
          <AlertTriangle size={20} className="shrink-0" />
          <p className="text-sm font-medium">
            Your email is not verified. Please verify your email to place orders.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {message && <span className="text-xs text-green-600 font-medium">{message}</span>}
          <button
            onClick={handleResend}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-semibold rounded transition disabled:opacity-50"
          >
            <Send size={14} />
            {loading ? "Sending..." : "Resend Link"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationBanner;
