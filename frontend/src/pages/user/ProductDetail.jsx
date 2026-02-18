import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Star,
  Truck,
  ShieldCheck,
  Minus,
  Plus,
  ShoppingCart,
  Heart,
  Share2,
} from "lucide-react";
import { getProductById, getRecommendations } from "../../api/products";
import { useCart } from "../../context/CartContext";
import { formatCurrency } from "../../utils/currency";
import ProductCarousel from "../../components/product/ProductCarousel";
import ProductReviews from "../../components/product/ProductReviews";
import ProductTabs from "../../components/product/ProductTabs";

const CountdownTimer = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference > 0) {
        return {
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      return null;
    };

    const timer = setInterval(() => {
      const timeLeftObj = calculateTimeLeft();
      if (timeLeftObj) {
        setTimeLeft(
          `${String(timeLeftObj.hours).padStart(2, "0")}:${String(
            timeLeftObj.minutes,
          ).padStart(2, "0")}:${String(timeLeftObj.seconds).padStart(2, "0")}`,
        );
      } else {
        setTimeLeft("EXPIRED");
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return <span>{timeLeft}</span>;
};

const ProductDetail = () => {
  const { slug } = useParams();
  const { addToCart, cart } = useCart();
  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);

    const fetchData = async () => {
      try {
        const foundProduct = await getProductById(slug);
        setProduct(foundProduct);

        // Find best offer (lowest price with stock, or just lowest price)
        if (foundProduct?.offers?.length > 0) {
          const sortedOffers = [...foundProduct.offers].sort(
            (a, b) => parseFloat(a.price) - parseFloat(b.price),
          );
          const inStockOffer = sortedOffers.find((o) => o.stockQuantity > 0);
          setSelectedOffer(inStockOffer || sortedOffers[0]);
        }

        const recs = await getRecommendations();
        setSimilarProducts(recs.filter((p) => p.slug !== slug));
      } catch (error) {
        console.error("Product load error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  const handleAddToCart = () => {
    if (!selectedOffer) return;

    // Normalize product data for cart with selected offer details
    const cartProduct = {
      ...product,
      id: product.id,
      offerId: selectedOffer.id,
      price: selectedOffer.price,
      sellerName: selectedOffer.sellerProfile?.storeName,
    };

    for (let i = 0; i < qty; i++) addToCart(cartProduct);
  };

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
                  product.media?.[selectedImage]?.url ||
                  product.media?.[0]?.url ||
                  "https://placehold.co/600?text=No+Image"
                }
                alt={product.name}
                className="max-w-full max-h-full object-contain mix-blend-multiply"
              />
              <button className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-sm hover:text-red-500 transition">
                <Heart size={20} />
              </button>

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
            {product.media && product.media.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.media.map((media, i) => (
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

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {product.name}
              </h1>
              <h3 className="text-gray-600 mb-8 leading-relaxed">
                {product.model || "No model available."}
              </h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center text-yellow-400 gap-0.5">
                  <Star size={18} fill="currentColor" />
                  <span className="text-gray-900 font-bold ml-1">
                    {Number(product.averageRating || 0).toFixed(1)}
                  </span>
                </div>
                <span className="text-gray-400 text-sm">|</span>
                <span className="text-indigo-600 font-medium text-sm hover:underline cursor-pointer">
                  {product.reviewCount || 0} Reviews
                </span>
              </div>

              <div className="border-t border-b border-gray-100 py-4 mb-6">
                {selectedOffer ? (
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-light text-red-600">
                      -
                      {Math.round(
                        ((Number(product.price) - Number(selectedOffer.price)) /
                          Number(product.price)) *
                          100,
                      )}
                      %
                    </span>
                    <span className="text-3xl font-bold text-gray-900">
                      {formatCurrency(selectedOffer.price)}
                    </span>
                  </div>
                ) : (
                  <span className="text-3xl font-bold text-gray-900">
                    {formatCurrency(product.price)}
                  </span>
                )}

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
                  Inclusive of all taxes
                </div>
              </div>

              <div className="flex flex-col gap-3 text-sm text-gray-500 mb-8">
                <div className="flex items-center gap-3">
                  <Truck size={18} className="text-indigo-600" />{" "}
                  <span>
                    Free shipping on all orders over {formatCurrency(50)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheck size={18} className="text-indigo-600" />{" "}
                  <span>2 Year Warranty included</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Buy Box */}
          <div className="lg:w-1/4">
            <div className="border border-gray-200 rounded-2xl p-6 shadow-sm sticky top-24">
              <div className="mb-6">
                {/* Deal Logic */}
                {selectedOffer &&
                selectedOffer.dealPrice &&
                new Date() >= new Date(selectedOffer.dealStartDate) &&
                new Date() <= new Date(selectedOffer.dealEndDate) ? (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                        Lightning Deal
                      </span>
                      <span className="text-red-600 text-sm font-medium animate-pulse">
                        Ends in:{" "}
                        <CountdownTimer
                          targetDate={selectedOffer.dealEndDate}
                        />
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-gray-900">
                        {formatCurrency(selectedOffer.dealPrice)}
                      </span>
                      <span className="text-sm text-gray-500 line-through">
                        {formatCurrency(selectedOffer.price)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      You save:{" "}
                      {formatCurrency(
                        selectedOffer.price - selectedOffer.dealPrice,
                      )}{" "}
                      (
                      {Math.round(
                        ((selectedOffer.price - selectedOffer.dealPrice) /
                          selectedOffer.price) *
                          100,
                      )}
                      %)
                    </div>
                  </div>
                ) : (
                  <span className="text-3xl font-bold text-gray-900">
                    {selectedOffer
                      ? formatCurrency(selectedOffer.price)
                      : "N/A"}
                  </span>
                )}

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
              </div>
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2 mb-4 border border-gray-200">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm hover:text-indigo-600"
                >
                  <Minus size={14} />
                </button>
                <span className="font-bold text-gray-900">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm hover:text-indigo-600"
                >
                  <Plus size={14} />
                </button>
              </div>
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
                            // Handle Add to Cart with Deal Price
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
                            for (let i = 0; i < qty; i++)
                              addToCart(cartProduct);
                          }}
                          className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                        >
                          <ShoppingCart size={18} /> Add to Cart
                        </button>
                      )}

                      <button className="w-full bg-orange-400 text-indigo-900 py-3.5 rounded-xl font-bold hover:bg-orange-500 transition">
                        Buy Now
                      </button>
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
              <div className="mt-6 pt-6 border-t border-gray-100 flex justify-center">
                <button className="text-gray-500 text-sm font-medium flex items-center gap-2 hover:text-indigo-600 transition">
                  <Share2 size={16} /> Share Product
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Other Sellers Section */}
        {product.offers && product.offers.length > 1 && (
          <div className="mb-16">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Other Sellers
            </h3>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 font-medium text-sm text-gray-500 border-b border-gray-200">
                <div>Seller</div>
                <div>Price</div>
                <div>Condition</div>
                <div>Action</div>
              </div>
              {product.offers.map((offer) => (
                <div
                  key={offer.id}
                  className={`grid grid-cols-4 gap-4 p-4 items-center border-b border-gray-100 last:border-0 ${selectedOffer?.id === offer.id ? "bg-indigo-50/50" : ""}`}
                >
                  <div className="font-medium text-gray-900">
                    {offer.sellerProfile?.storeName}
                    {selectedOffer?.id === offer.id && (
                      <span className="ml-2 text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                        Selected
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-gray-900">
                    {formatCurrency(offer.price)}
                  </div>
                  <div className="text-sm text-gray-600">{offer.condition}</div>
                  <div>
                    {selectedOffer?.id !== offer.id && (
                      <button
                        onClick={() => {
                          setSelectedOffer(offer);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        Select this seller
                      </button>
                    )}
                  </div>
                </div>
              ))}
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
        <ProductReviews product={product} />
      </div>
    </div>
  );
};

export default ProductDetail;
