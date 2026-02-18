import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Mail, ArrowRight, Loader } from "lucide-react";
import { verifyEmail, getCsrfToken } from "../../api/auth";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

const VerifyEmail = () => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  
  const location = useLocation();
  const navigate = useNavigate();
  const { resendVerification, user, refreshUser } = useAuth(); // Assume user is logged in after register
  
  // CSRF Handshake
  React.useEffect(() => {
    const fetchCsrf = async () => {
      try {
        const { csrfToken } = await getCsrfToken();
        if (csrfToken) {
          api.defaults.headers.common["X-CSRF-Token"] = csrfToken;
        }
      } catch (err) {
        console.error("Failed to fetch CSRF token", err);
      }
    };
    fetchCsrf();
  }, []);

  // Email might come from location state (from Register page) or from current user context
  const email = location.state?.email || user?.email;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await verifyEmail(code);
      setMsg("Email verified successfully! Redirecting...");
      
      // Update user context to reflect verification status
      await refreshUser();
      
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setMsg("");
    setError("");
    const result = await resendVerification();
    setLoading(false);
    if(result.success) {
      setMsg(result.message);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 mb-4">
              <Mail className="h-6 w-6 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Verify your email</h2>
            <p className="mt-2 text-sm text-gray-500">
              We've sent a verification code to{" "}
              <span className="font-medium text-gray-900">{email}</span>
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="code"
                  id="code"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center tracking-widest text-lg"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
            </div>

            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            {msg && <div className="text-green-500 text-sm text-center">{msg}</div>}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? <Loader className="animate-spin h-5 w-5" /> : "Verify Email"}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Didn't receive the code?
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={handleResend}
                disabled={loading}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
              >
                Resend Code
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
