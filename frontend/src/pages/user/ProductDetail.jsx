import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Star,
  Truck,
  ShieldCheck,
  Minus,
  Plus,
  ShoppingCart,
  Heart,
  Share2,
  X,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";
import { getProductById, getRecommendations } from "../../api/products";
import { useCart } from "../../context/CartContext";
import { formatCurrency } from "../../utils/currency";
import ProductCarousel from "../../components/product/ProductCarousel";
import ProductReviews from "../../components/product/ProductReviews";
import ProductTabs from "../../components/product/ProductTabs";
import WishlistButton from "../../components/product/WishlistButton";

const CountdownTimer = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      return null;
    };

    const updateTimer = () => {
      const timeLeftObj = calculateTimeLeft();
      if (timeLeftObj) {
        const parts = [];
        if (timeLeftObj.days > 0) parts.push(`${timeLeftObj.days}d`);
        parts.push(`${String(timeLeftObj.hours).padStart(2, "0")}h`);
        parts.push(`${String(timeLeftObj.minutes).padStart(2, "0")}m`);
        parts.push(`${String(timeLeftObj.seconds).padStart(2, "0")}s`);
        setTimeLeft(parts.join(" "));
      } else {
        setTimeLeft("EXPIRED");
        return false;
      }
      return true;
    };

    updateTimer(); // run immediately
    const timer = setInterval(() => {
      if (!updateTimer()) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return <span>{timeLeft}</span>;
};

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart, cart } = useCart();
  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isSellersModalOpen, setIsSellersModalOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const shareUrl = window.location.href;
    const shareData = {
      title: product?.name || "Zapify Product",
      text: `Check out this ${product?.name || "item"} on Zapify!`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }
      }
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        handleCopySuccess();
        return;
      } catch (err) {
        console.warn("[Share] Clipboard API failed:", err);
      }
    }

    try {
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);

      if (successful) {
        handleCopySuccess();
      } else {
        throw new Error("execCommand('copy') returned false");
      }
    } catch (err) {
      console.error("[Share] All share methods failed:", err);
      toast.error("Could not copy link automatically");
    }
  };

  const handleCopySuccess = () => {
    toast.success("Link copied to clipboard!", {
      icon: "🔗",
      style: {
        borderRadius: "10px",
        background: "#333",
        color: "#fff",
      },
    });
    setIsSharing(true);
    setTimeout(() => setIsSharing(false), 2000);
  };

  const handleBuyNow = async () => {
    if (!selectedOffer) return;

    const isDeal =
      selectedOffer.dealPrice &&
      new Date() >= new Date(selectedOffer.dealStartDate) &&
      new Date() <= new Date(selectedOffer.dealEndDate);
    const finalPrice = isDeal ? selectedOffer.dealPrice : selectedOffer.price;

    const cartProduct = {
      ...product,
      id: product.id,
      offerId: selectedOffer.id,
      price: finalPrice,
      sellerName: selectedOffer.sellerProfile?.storeName,
    };

    // Add to cart only if not already in cart
    if (!cart.some((item) => item.offerId === selectedOffer.id)) {
      await addToCart(cartProduct, qty);
    }

    // Redirect to checkout
    navigate("/checkout");
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);

    const controller = new AbortController();
    const { signal } = controller;

    const fetchData = async () => {
      try {
        const foundProduct = await getProductById(slug, signal);
        setProduct(foundProduct);

        if (foundProduct?.offers?.length > 0) {
          const isOfferActiveDeal = (offer) => {
            if (!offer.dealPrice || !offer.dealStartDate || !offer.dealEndDate)
              return false;
            const now = new Date();
            const start = new Date(offer.dealStartDate);
            const end = new Date(offer.dealEndDate);
            return (
              now >= start && now <= end && parseFloat(offer.dealPrice) > 0
            );
          };

          const offers = [...foundProduct.offers];
          const dealOffers = offers.filter(isOfferActiveDeal);

          if (dealOffers.length > 0) {
            dealOffers.sort(
              (a, b) => parseFloat(a.dealPrice) - parseFloat(b.dealPrice),
            );
            const inStockDeal = dealOffers.find((o) => o.stockQuantity > 0);
            setSelectedOffer(inStockDeal || dealOffers[0]);
          } else {
            offers.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
            const inStockOffer = offers.find((o) => o.stockQuantity > 0);
            setSelectedOffer(inStockOffer || offers[0]);
          }
        } else {
          setSelectedOffer(null);
        }

        const recs = await getRecommendations(slug, signal);
        setSimilarProducts(recs);
      } catch (error) {
        if (
          error?.code === "ERR_CANCELED" ||
          error?.name === "AbortError" ||
          error?.name === "CanceledError"
        )
          return;
        console.error("Product load error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return () => controller.abort();
  }, [slug]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-indigo-600 font-medium">
        Loading...
      </div>
    );
  if (!product)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Product not found
      </div>
    );

  return (
    <div className="bg-white min-h-screen pb-12">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-8 flex items-center gap-2">
          <Link to="/" className="hover:text-indigo-600">
            Home
          </Link>{" "}
          /
          <Link to="/shop" className="hover:text-indigo-600">
            {typeof product.category === "object"
              ? product.category?.name
              : product.category}
          </Link>{" "}
          /<span className="text-gray-900 font-medium">{product.name}</span>
        </div>

        {/* Main Product Section */}
        <div className="flex flex-col lg:flex-row gap-12 mb-16">
          {/* 1. Image Gallery */}
          <div className="lg:w-1/2">
            <div className="bg-gray-50 rounded-2xl p-8 mb-4 aspect-square flex items-center justify-center border border-gray-100 relative">
              <img
                src={
                  product.media?.filter((m) => m.tag === "gallery")?.[
                    selectedImage
                  ]?.url ||
                  product.media?.find((m) => m.tag === "thumbnail")?.url ||
                  product.media?.[0]?.url ||
                  "https://placehold.co/600?text=No+Image"
                }
                alt={product.name}
                className="max-w-full max-h-full object-contain mix-blend-multiply"
              />
              <WishlistButton
                productId={product.id}
                size={20}
                className="absolute top-4 right-4 w-10 h-10 shadow-sm"
              />

              {/* Badges */}
              {product.isNew && (
                <span className="absolute top-4 left-4 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  New
                </span>
              )}

              {((selectedOffer && selectedOffer.stockQuantity <= 0) ||
                (!selectedOffer && product.totalOfferStock <= 0)) && (
                <span className="absolute top-4 right-16 bg-gray-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  Out of Stock
                </span>
              )}
            </div>
            {product.media &&
              product.media.filter((m) => m.tag === "gallery").length > 0 && (
                <div className="grid grid-cols-4 gap-4">
                  {product.media
                    .filter((m) => m.tag === "gallery")
                    .map((media, i) => (
                      <div
                        key={media.id || i}
                        className={`bg-gray-50 rounded-xl aspect-square border-2 cursor-pointer p-2 flex items-center justify-center ${
                          selectedImage === i
                            ? "border-indigo-600"
                            : "border-transparent hover:border-indigo-200"
                        }`}
                        onClick={() => setSelectedImage(i)}
                      >
                        <img
                          src={media.url}
                          alt={`${product.name} view ${i + 1}`}
                          className="max-w-full max-h-full object-contain mix-blend-multiply"
                        />
                      </div>
                    ))}
                </div>
              )}
          </div>

          {/* 2. Product Info */}
          <div className="lg:w-1/3 flex flex-col">
            <div className="mb-auto">
              {typeof product.brand === "object" && product.brand?.id ? (
                <Link
                  to={`/store/${product.brand.slug || product.brand.id}`}
                  className="text-indigo-600 font-medium text-sm hover:underline hover:text-orange-700 mb-2 block"
                >
                  Visit the {product.brand.name} Store
                </Link>
              ) : (
                <span className="text-gray-500 font-bold text-sm tracking-wide uppercase mb-2 block">
                  {typeof product.brand === "object"
                    ? product.brand?.name
                    : product.brand}
                </span>
              )}

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-4 leading-tight">
                {product.name}
              </h1>
              <h3 className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                {product.model || "No model available."}
              </h3>
              <div
                className="flex items-center gap-4 mb-6 cursor-pointer group w-fit"
                onClick={() =>
                  document
                    .getElementById("customer-reviews")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                <div className="flex items-center text-yellow-400 gap-0.5">
                  <Star size={18} fill="currentColor" />
                  <span className="text-gray-900 font-bold ml-1 group-hover:text-indigo-600 transition-colors">
                    {Number(product.averageRating || 0).toFixed(1)}
                  </span>
                </div>
                <span className="text-gray-400 text-sm">|</span>
                <span className="text-indigo-600 font-medium text-sm group-hover:underline">
                  {product.reviewCount || 0} Reviews
                </span>
              </div>

              <div className="hidden lg:block">
                <div className="border-t border-b border-gray-100 py-4 mb-6">
                  {(() => {
                    const isDeal =
                      selectedOffer &&
                      selectedOffer.dealPrice &&
                      parseFloat(selectedOffer.dealPrice) > 0 &&
                      new Date() >= new Date(selectedOffer.dealStartDate) &&
                      new Date() <= new Date(selectedOffer.dealEndDate);

                    const effectivePrice = isDeal
                      ? Number(selectedOffer.dealPrice)
                      : selectedOffer
                        ? Number(selectedOffer.price)
                        : Number(product.price);

                    const originalPrice = Number(product.price);
                    const hasDiscount = effectivePrice < originalPrice;
                    const savingsPercent = hasDiscount
                      ? Math.round(
                          ((originalPrice - effectivePrice) / originalPrice) *
                            100,
                        )
                      : 0;

                    return (
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-3">
                          {hasDiscount && (
                            <span className="text-3xl font-light text-red-600">
                              -{savingsPercent}%
                            </span>
                          )}
                          <span
                            className={`text-3xl font-bold ${isDeal ? "text-red-600" : "text-gray-900"}`}
                          >
                            {formatCurrency(effectivePrice)}
                          </span>
                        </div>
                        {isDeal && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                              Lightning Deal
                            </span>
                            <span className="text-red-600 text-sm font-medium animate-pulse">
                              Ends in:{" "}
                              <CountdownTimer
                                key={selectedOffer.id}
                                targetDate={selectedOffer.dealEndDate}
                              />
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {selectedOffer && (
                    <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                      <span>M.R.P.:</span>
                      <span className="relative inline-block text-gray-500">
                        {formatCurrency(product.price)}
                        <span className="absolute left-0 top-1/2 w-full h-[1px] bg-gray-500 -translate-y-1/2"></span>
                      </span>
                    </div>
                  )}
                  <div className="text-sm text-gray-500 mt-1">
                    Exclusive of all taxes
                  </div>
                </div>

                <div className="flex flex-col gap-3 text-sm text-gray-500 mb-8">
                  <div className="flex items-center gap-3">
                    <Truck size={18} className="text-indigo-600" />{" "}
                    <span>
                      Free shipping on all orders over {formatCurrency(500)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={18} className="text-indigo-600" />{" "}
                    <span>Warranty as per brand policy.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Buy Box */}
          <div className="lg:w-1/4">
            <div className="border border-gray-200 rounded-2xl p-6 shadow-sm sticky top-24">
              <div className="mb-6">
                {/* Deal Logic in Buy Box */}
                {(() => {
                  const isDeal =
                    selectedOffer &&
                    selectedOffer.dealPrice &&
                    parseFloat(selectedOffer.dealPrice) > 0 &&
                    new Date() >= new Date(selectedOffer.dealStartDate) &&
                    new Date() <= new Date(selectedOffer.dealEndDate);

                  const effectivePrice = isDeal
                    ? Number(selectedOffer.dealPrice)
                    : selectedOffer
                      ? Number(selectedOffer.price)
                      : Number(product.price);

                  return (
                    <div className="mb-3">
                      {isDeal && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                            Lightning Deal
                          </span>
                          <span className="text-red-600 text-sm font-medium animate-pulse">
                            Ends in:{" "}
                            <CountdownTimer
                              key={selectedOffer.id}
                              targetDate={selectedOffer.dealEndDate}
                            />
                          </span>
                        </div>
                      )}

                      <div className="flex items-baseline gap-2">
                        <span
                          className={`text-3xl font-bold ${isDeal ? "text-red-600" : "text-gray-900"}`}
                        >
                          {formatCurrency(effectivePrice)}
                        </span>
                      </div>

                      {Number(product.price) > effectivePrice && (
                        <div className="text-sm text-gray-500 mt-1">
                          <span>M.R.P.: </span>
                          <span className="relative inline-block text-gray-500">
                            {formatCurrency(product.price)}
                            <span className="absolute left-0 top-1/2 w-full h-[1px] bg-gray-500 -translate-y-1/2"></span>
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {selectedOffer && (
                  <div className="mt-2 text-sm">
                    <span className="text-gray-500">Sold by: </span>
                    <Link
                      to={`/seller/${selectedOffer.sellerProfile?.id}`}
                      className="text-indigo-600 font-medium hover:underline"
                    >
                      {selectedOffer.sellerProfile?.storeName ||
                        "Unknown Seller"}
                    </Link>
                  </div>
                )}

                <div
                  className={`font-medium text-sm mt-1 ${selectedOffer?.stockQuantity > 0 ? "text-green-600" : "text-red-500"}`}
                >
                  {selectedOffer?.stockQuantity > 0
                    ? "In Stock"
                    : "Out of Stock"}
                </div>

                {/* Mobile-only shipping/warranty info */}
                <div className="lg:hidden mt-4 space-y-2 border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2.5 text-xs text-gray-600">
                    <Truck size={14} className="text-indigo-600 shrink-0" />
                    <span>
                      Free shipping on all orders over {formatCurrency(500)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-gray-600">
                    <ShieldCheck
                      size={14}
                      className="text-indigo-600 shrink-0"
                    />
                    <span>Warranty as per brand policy.</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2 mb-4 border border-gray-200">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="cursor-pointer w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm hover:text-indigo-600"
                >
                  <Minus size={14} />
                </button>
                <span className="font-bold text-gray-900">{qty}</span>
                <button
                  onClick={() =>
                    setQty(
                      Math.min(
                        selectedOffer?.stockQuantity ||
                          product.totalOfferStock ||
                          1,
                        qty + 1,
                      ),
                    )
                  }
                  className="cursor-pointer w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={
                    qty >=
                    (selectedOffer?.stockQuantity ||
                      product.totalOfferStock ||
                      1)
                  }
                >
                  <Plus size={14} />
                </button>
              </div>

              {selectedOffer && qty >= selectedOffer.stockQuantity && (
                <div className="text-xs text-orange-600 font-medium mb-3 text-center">
                  Maximum available quantity reached.
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-3">
                  {selectedOffer && selectedOffer.stockQuantity > 0 ? (
                    <>
                      {cart.some((item) =>
                        selectedOffer
                          ? item.offerId === selectedOffer.id
                          : item.id === product.id,
                      ) ? (
                        <Link
                          to="/cart"
                          className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                        >
                          <ShoppingCart size={18} /> Go to Cart
                        </Link>
                      ) : (
                        <button
                          onClick={() => {
                            const isDeal =
                              selectedOffer.dealPrice &&
                              new Date() >=
                                new Date(selectedOffer.dealStartDate) &&
                              new Date() <= new Date(selectedOffer.dealEndDate);
                            const finalPrice = isDeal
                              ? selectedOffer.dealPrice
                              : selectedOffer.price;

                            const cartProduct = {
                              ...product,
                              id: product.id,
                              offerId: selectedOffer.id,
                              price: finalPrice,
                              sellerName:
                                selectedOffer.sellerProfile?.storeName,
                            };
                            addToCart(cartProduct, qty);
                          }}
                          className="cursor-pointer w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                        >
                          <ShoppingCart size={18} /> Add to Cart
                        </button>
                      )}

                      <button
                        onClick={handleBuyNow}
                        className="cursor-pointer w-full bg-orange-400 text-indigo-900 py-3.5 rounded-xl font-bold hover:bg-orange-500 transition"
                      >
                        Buy Now
                      </button>

                      {/* Wishlist toggle */}
                      <WishlistButton
                        productId={product.id}
                        size={18}
                        className="w-full py-3.5 rounded-xl border border-gray-200 hover:border-red-300 gap-2 font-semibold text-sm text-gray-700"
                      />
                    </>
                  ) : (
                    <button
                      disabled
                      className="w-full bg-gray-200 text-gray-500 py-3.5 rounded-xl font-bold cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {selectedOffer ? "Out of Stock" : "Currently Unavailable"}
                    </button>
                  )}
                </div>
              </div>
              {/* Link to open sellers modal if multiple sellers exist */}
              {product.offers &&
                product.offers.filter((o) => o.stockQuantity > 0).length >
                  1 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-center">
                    <button
                      onClick={() => setIsSellersModalOpen(true)}
                      className="cursor-pointer text-indigo-600 text-sm font-bold hover:underline transition"
                    >
                      Compare New & Used from{" "}
                      {product.offers.filter((o) => o.stockQuantity > 0).length}{" "}
                      Sellers
                    </button>
                  </div>
                )}

              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-center">
                <button
                  onClick={handleShare}
                  className="cursor-pointer text-gray-500 text-sm font-medium flex items-center gap-2 hover:text-indigo-600 transition"
                >
                  {isSharing ? (
                    <Check size={16} className="text-green-500" />
                  ) : (
                    <Share2 size={16} />
                  )}
                  {isSharing ? "Link Copied" : "Share Product"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sellers Modal */}
        {isSellersModalOpen && product.offers && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 animate-backdrop">
            <div className="bg-white rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-modal-slide">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900">
                  Other Sellers on Zapify
                </h3>
                <button
                  onClick={() => setIsSellersModalOpen(false)}
                  className="cursor-pointer text-gray-400 hover:text-gray-900 transition p-2 hover:bg-gray-100 rounded-full"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
                <div className="space-y-4">
                  {product.offers
                    .filter((o) => o.stockQuantity > 0)
                    .map((offer) => {
                      const isDeal =
                        offer.dealPrice &&
                        parseFloat(offer.dealPrice) > 0 &&
                        new Date() >= new Date(offer.dealStartDate) &&
                        new Date() <= new Date(offer.dealEndDate);
                      const effectivePrice = isDeal
                        ? Number(offer.dealPrice)
                        : Number(offer.price);

                      return (
                        <div
                          key={offer.id}
                          className={`flex items-center justify-between p-4 rounded-xl border ${selectedOffer?.id === offer.id ? "border-indigo-600 bg-indigo-50/30 shadow-sm" : "border-gray-200"}`}
                        >
                          <div className="w-1/3">
                            <div className="font-bold text-lg text-gray-900">
                              {formatCurrency(effectivePrice)}
                            </div>
                            {isDeal && (
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  Deal
                                </span>
                                <span className="text-xs text-gray-500 line-through">
                                  {formatCurrency(offer.price)}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-xs font-semibold text-gray-500">
                                Condition:
                              </span>
                              <span className="text-sm text-gray-700">
                                {offer.condition}
                              </span>
                            </div>
                          </div>

                          <div className="w-1/3 flex flex-col justify-center px-4 border-l border-r border-gray-100">
                            <span className="text-xs text-gray-500 mb-0.5">
                              Seller
                            </span>
                            <span className="font-medium text-gray-900">
                              {offer.sellerProfile?.storeName}
                            </span>
                          </div>

                          <div className="w-1/4 flex justify-end">
                            {selectedOffer?.id === offer.id ? (
                              <button
                                disabled
                                className="px-5 py-2.5 bg-gray-100 text-gray-500 text-sm font-bold rounded-lg cursor-not-allowed"
                              >
                                Selected
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedOffer(offer);
                                  setIsSellersModalOpen(false);
                                  window.scrollTo({
                                    top: 0,
                                    behavior: "smooth",
                                  });
                                }}
                                className="cursor-pointer px-5 py-2.5 bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 text-sm font-bold rounded-lg transition"
                              >
                                Select seller
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabbed Info Section (Added Here) */}
        <ProductTabs product={product} />

        {/* Similar Products */}
        <div className="mt-20">
          <ProductCarousel
            title="Similar Products"
            products={similarProducts}
          />
        </div>

        {/* Product Reviews Section */}
        <div id="customer-reviews">
          <ProductReviews product={product} />
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
