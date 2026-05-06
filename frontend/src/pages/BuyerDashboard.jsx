import { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

// 🔥 ADDED: Razorpay Integration — Load Razorpay script dynamically
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function BuyerDashboard() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("products");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 🔥 FILTER STATES
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("");

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);

  // 🔥 ADDED: Razorpay Integration — Track which order is being paid
  const [payingOrderId, setPayingOrderId] = useState(null);

  // ⭐ STAR RENDER
  const renderStars = (value) => (
    <div className="flex text-yellow-400">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star}>{star <= value ? "★" : "☆"}</span>
      ))}
    </div>
  );

  const getAverageRating = (reviewList) => {
    if (!reviewList || reviewList.length === 0) return 0;
    const total = reviewList.reduce((sum, r) => sum + r.rating, 0);
    return Math.round(total / reviewList.length);
  };

  // ================= FETCH PRODUCTS =================
  const fetchProducts = async (pageNumber = 1) => {
    try {
      setLoading(true);

      const res = await API.get("/products", {
        params: {
          page: pageNumber,
          limit: 8,
          min_price: minPrice || undefined,
          max_price: maxPrice || undefined,
          sort: sort || undefined,
        },
      });

      const productData = res.data?.data || [];

      setProducts(productData);
      setFilteredProducts(productData);

      setTotalPages(
        res.data?.total && res.data?.limit
          ? Math.ceil(res.data.total / res.data.limit)
          : 1
      );

      setPage(res.data?.page || 1);
    } catch {
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    try {
      const res = await API.get("/cart/");
      setCartCount(res.data?.items?.length || 0);
    } catch {
      setCartCount(0);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await API.get("/orders/");
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch {
      setOrders([]);
    }
  };

  const fetchReviews = async (productId) => {
    try {
      const res = await API.get(`/reviews/${productId}`);
      setReviews(res.data || []);
    } catch {
      setReviews([]);
    }
  };

  const submitReview = async () => {
    try {
      await API.post("/reviews/", {
        product_id: selectedProduct.id,
        comment: reviewText,
        rating: rating,
      });

      toast.success("Review added ⭐");
      setReviewText("");
      setRating(5);
      fetchReviews(selectedProduct.id);
    } catch {
      toast.error("Review failed");
    }
  };

  const addToCart = async (id) => {
    try {
      await API.post("/cart/", {
        product_id: id,
        quantity: 1,
      });

      fetchCart();
      toast.success("Added to cart 🛒");
    } catch {
      toast.error("Failed to add to cart");
    }
  };

  // 🔥 UPDATED: Payment Logic — Calls /payment/create then opens Razorpay popup
  const handleProceedToPay = async (orderId) => {
    try {
      setPayingOrderId(orderId);

      // Step 1: Load Razorpay SDK script dynamically if not already loaded
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Failed to load Razorpay. Check your connection.");
        setPayingOrderId(null);
        return;
      }

      // Step 2: Call backend to create Razorpay order
      // 🔥 UPDATED: Payment Logic — correctly calls /payment/create/{orderId}
      const res = await API.post(`/payment/create/${orderId}`);
      const paymentData = res.data;

      // Step 3: Guard — stop if backend did not return razorpay_order_id
      if (!paymentData || !paymentData.razorpay_order_id) {
        toast.error("Payment initiation failed. Please try again.");
        setPayingOrderId(null);
        return;
      }

      // Step 4: Configure Razorpay options using returned backend data
      const options = {
        key: paymentData.key,                        // Razorpay Key ID from backend
        amount: paymentData.amount,                  // Amount in paise
        currency: paymentData.currency || "INR",
        name: paymentData.name || "SmartCart",
        description: paymentData.description || `Order #${orderId}`,
        order_id: paymentData.razorpay_order_id,     // Razorpay order ID from backend

        // Step 5: Success handler — fires ONLY after successful payment
        handler: async function (response) {
          try {
            // Step 6: Verify payment with backend AFTER Razorpay success
            await API.post(`/payment/verify/${orderId}`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            toast.success("Payment successful! 🎉");
            fetchOrders(); // Step 7: Refresh orders to reflect updated status
          } catch {
            toast.error("Payment verification failed. Contact support.");
          } finally {
            setPayingOrderId(null);
          }
        },

        // Fires when user closes Razorpay popup without paying
        modal: {
          ondismiss: function () {
            toast.error("Payment cancelled.");
            setPayingOrderId(null);
          },
        },

        // Pre-fill user details if provided by backend
        prefill: {
          name: paymentData.prefill?.name || "",
          email: paymentData.prefill?.email || "",
          contact: paymentData.prefill?.contact || "",
        },

        theme: {
          color: "#2563eb",
        },
      };

      // Step 8: Open Razorpay popup — this is what shows the payment UI
      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch {
      toast.error("Failed to initiate payment. Please try again.");
      setPayingOrderId(null);
    }
  };

  // SEARCH
  useEffect(() => {
    const filtered = products.filter((product) =>
      product.name.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [search, products]);

  // AUTO REFRESH ORDERS
  useEffect(() => {
    let interval;
    if (view === "orders") {
      fetchOrders();
      interval = setInterval(fetchOrders, 10000);
    }
    return () => interval && clearInterval(interval);
  }, [view]);

  // REFRESH PRODUCTS WHEN FILTER CHANGES
  useEffect(() => {
    fetchProducts(page);
  }, [page, minPrice, maxPrice, sort]);

  useEffect(() => {
    fetchCart();
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#e2e8f0]">

      {/* NAVBAR */}
      <div className="bg-[#1e293b] px-6 py-3 flex justify-between items-center">
        <h1
          className="text-2xl font-bold text-[#38bdf8] cursor-pointer"
          onClick={() => setView("products")}
        >
          SmartCart
        </h1>

        {view === "products" && (
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-1/3 px-4 py-1 rounded bg-[#0f172a]"
          />
        )}

        <div className="flex gap-6">
          <button onClick={() => navigate("/cart")}>
            Cart ({cartCount})
          </button>
          <button onClick={() => setView("orders")}>
            My Orders
          </button>
        </div>
      </div>

      {/* 🔥 FILTER SECTION */}
      {view === "products" && (
        <div className="p-6 bg-[#1e293b] flex gap-4 flex-wrap">

          <input
            type="number"
            placeholder="Min Price"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="px-3 py-2 rounded bg-[#0f172a]"
          />

          <input
            type="number"
            placeholder="Max Price"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="px-3 py-2 rounded bg-[#0f172a]"
          />

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2 rounded bg-[#0f172a]"
          >
            <option value="">Sort</option>
            <option value="price_low">Price Low → High</option>
            <option value="price_high">Price High → Low</option>
            <option value="rating">Top Rated</option>
          </select>

        </div>
      )}

      {/* PRODUCTS VIEW */}
      {view === "products" && (
        <div className="p-8">

          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="bg-[#1e293b] p-4 rounded shadow">

                    <img
                      src={`http://127.0.0.1:8000${product.image_url}`}
                      alt={product.name}
                      className="h-40 w-full object-contain mb-4 cursor-pointer"
                      onClick={() => {
                        setSelectedProduct(product);
                        fetchReviews(product.id);
                      }}
                    />

                    <h3>{product.name}</h3>
                    <p className="text-green-400">₹{product.price}</p>

                    {renderStars(getAverageRating(product.reviews || []))}

                    <p>
                      {product.stock > 0
                        ? `Stock: ${product.stock}`
                        : "Out of Stock"}
                    </p>

                    <button
                      onClick={() => addToCart(product.id)}
                      disabled={product.stock === 0}
                      className="w-full mt-3 py-2 bg-gradient-to-r from-[#2563eb] to-[#06b6d4] rounded"
                    >
                      {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                    </button>

                  </div>
                ))}
              </div>

              {/* PAGINATION */}
              <div className="flex justify-center mt-8 gap-6 items-center">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-4 py-2 bg-blue-600 rounded"
                >
                  Previous
                </button>

                <span>Page {page} of {totalPages}</span>

                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-4 py-2 bg-blue-600 rounded"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ORDERS VIEW */}
      {view === "orders" && (
        <div className="p-8">
          <h2 className="text-2xl font-semibold mb-6 text-[#38bdf8]">
            My Order History
          </h2>

          {orders.length === 0 ? (
            <p>No orders found.</p>
          ) : (
            orders.map((order) => (
              <div key={order.order_id} className="bg-[#1e293b] p-6 rounded mb-4">

                <div className="flex justify-between">
                  <span>Order #{order.order_id}</span>
                  <span className="text-green-400">{order.status}</span>
                </div>

                <p>Total: ₹{order.total_amount}</p>

                {/* 🔥 UPDATED: Payment Logic — Proceed to Pay (only for PLACED orders) */}
                {order.status === "PLACED" && (
                  <button
                    onClick={() => handleProceedToPay(order.order_id)}
                    disabled={payingOrderId === order.order_id}
                    className="mt-4 px-6 py-2 bg-gradient-to-r from-[#16a34a] to-[#15803d] rounded text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {payingOrderId === order.order_id
                      ? "Processing..."
                      : "Proceed to Pay 💳"}
                  </button>
                )}
                {/* 🔥 END: Payment Logic */}

              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}