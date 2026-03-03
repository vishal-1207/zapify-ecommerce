import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import {
  toggleWishlist,
  selectWishlistIds,
} from "../../store/wishlist/wishlistSlice";
import toast from "react-hot-toast";

/**
 * Reusable heart/wishlist toggle button.
 * @param {string} productId - The product ID to toggle
 * @param {string} className - Extra classnames for the wrapper button
 * @param {number} size - Icon size (default 18)
 */
const WishlistButton = ({ productId, className = "", size = 18 }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const wishlistIds = useSelector(selectWishlistIds);
  const isWishlisted = wishlistIds.includes(productId);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate("/login");
      return;
    }

    dispatch(toggleWishlist(productId)).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        const action = res.payload.action;
        if (action === "added") toast.success("Added to wishlist!");
        else toast.success("Removed from wishlist.");
      } else {
        toast.error(res.payload || "Failed to update wishlist.");
      }
    });
  };

  return (
    <button
      onClick={handleClick}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      className={`cursor-pointer flex items-center justify-center rounded-full transition-all duration-200 ${
        isWishlisted
          ? "text-red-500 bg-red-50 hover:bg-red-100 !opacity-100"
          : "text-gray-400 bg-white hover:text-red-500 hover:bg-red-50"
      } ${className}`}
    >
      <Heart
        size={size}
        className={`transition-all duration-200 ${isWishlisted ? "fill-red-500" : ""}`}
      />
    </button>
  );
};

export default WishlistButton;
