import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle, Star } from "lucide-react";
import api from "../../api/axios";

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await api.get("/reviews/admin/pending-reviews");
      setReviews(res.data.reviews || []);
    } catch (error) {
      console.error("Failed to fetch reviews", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleModerate = async (reviewId, status) => {
    try {
      await api.post(`/reviews/admin/review/${reviewId}/moderate`, { status });
      fetchReviews();
    } catch (error) {
      console.error("Failed to moderate review", error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-800">Pending Reviews</h2>
      </div>

      <div className="p-0">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No pending reviews.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reviews.map((review) => (
              <div key={review.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                       {[...Array(5)].map((_, i) => (
                        <Star
                            key={i}
                            size={16}
                            className={i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                        />
                       ))}
                       <span className="text-sm font-bold text-gray-800 ml-1">{review.title}</span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{review.comment}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>by <strong>{review.user?.fullname || "Unknown User"}</strong></span>
                        <span>on <strong>{review.product?.name || "Unknown Product"}</strong></span>
                        <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Gallery if needed */}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleModerate(review.id, "approved")}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-md text-xs font-bold transition-colors"
                    >
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button
                      onClick={() => handleModerate(review.id, "rejected")}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-md text-xs font-bold transition-colors"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReviews;
