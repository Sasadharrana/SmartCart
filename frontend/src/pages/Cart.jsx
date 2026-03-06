import { useEffect, useState } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [orderId, setOrderId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [animateTotal, setAnimateTotal] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await API.get("/cart");
      setCartItems(res.data.items);
      setTotal(res.data.grand_total);

      setAnimateTotal(true);
      setTimeout(() => setAnimateTotal(false), 300);
    } catch (error) {
      toast.error("Failed to load cart");
    }
  };

  const increaseQuantity = async (cartId, currentQty, stock) => {
    if (currentQty >= stock) return;

    try {
      await API.put(`/cart/${cartId}?quantity=${currentQty + 1}`);
      fetchCart();
      toast.success("Quantity increased");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update quantity");
    }
  };

  const decreaseQuantity = async (cartId, currentQty) => {
    if (currentQty <= 1) return;

    try {
      await API.put(`/cart/${cartId}?quantity=${currentQty - 1}`);
      fetchCart();
      toast.success("Quantity decreased");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update quantity");
    }
  };

  const confirmDelete = async () => {
    try {
      await API.delete(`/cart/${deleteId}`);
      setDeleteId(null);
      fetchCart();
      toast.success("Item removed from cart");
    } catch {
      toast.error("Failed to remove item");
    }
  };

  const clearCart = async () => {
    try {
      await API.delete("/cart");
      fetchCart();
      toast.success("Cart cleared successfully");
    } catch {
      toast.error("Failed to clear cart");
    }
  };

  const placeOrder = async () => {
    try {
      const res = await API.post("/orders");
      setOrderId(res.data.order_id);
      setCartItems([]);
      setTotal(0);
      toast.success("Order created successfully 🎉");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Order failed");
    }
  };

  const proceedToPayment = async () => {
    try {
      await API.post(`/orders/${orderId}/pay`);
      toast.success("Payment successful 💳");
      setOrderId(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Payment failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar hideOrders />

      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Your Cart</h1>

        {cartItems.length === 0 && !orderId ? (
          <p>No items in cart.</p>
        ) : (
          <>
            {cartItems.map((item) => (
              <div
                key={item.cart_id}
                className="bg-white p-4 mb-4 rounded shadow flex justify-between items-center"
              >
                <div className="flex gap-4 items-center">
                  <img
                    src={`http://127.0.0.1:8000${item.image_url}`}
                    className="w-20 h-20 object-cover rounded"
                    alt={item.product_name}
                  />

                  <div>
                    <p className="font-semibold">
                      {item.product_name}
                    </p>
                    <p>Price: ₹{item.price}</p>

                    {item.stock === 0 && (
                      <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">
                        Out of Stock
                      </span>
                    )}

                    <p>Total: ₹{item.total_price}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      decreaseQuantity(item.cart_id, item.quantity)
                    }
                    className="bg-red-500 text-white px-3 py-1 rounded"
                  >
                    -
                  </button>

                  <span className="font-bold text-lg">
                    {item.quantity}
                  </span>

                  <button
                    disabled={item.quantity >= item.stock}
                    onClick={() =>
                      increaseQuantity(
                        item.cart_id,
                        item.quantity,
                        item.stock
                      )
                    }
                    className={`px-3 py-1 rounded text-white ${
                      item.quantity >= item.stock
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-500"
                    }`}
                  >
                    +
                  </button>

                  <button
                    onClick={() => setDeleteId(item.cart_id)}
                    className="bg-gray-700 text-white px-3 py-1 rounded"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            {cartItems.length > 0 && (
              <div className="bg-white p-4 rounded shadow mt-6">
                <h2
                  className={`text-xl font-bold transition-all duration-300 ${
                    animateTotal ? "scale-105 text-blue-600" : ""
                  }`}
                >
                  Grand Total: ₹{total}
                </h2>

                <div className="flex gap-4 mt-4">
                  <button
                    onClick={placeOrder}
                    className="bg-blue-600 text-white px-6 py-2 rounded"
                  >
                    Place Order
                  </button>

                  <button
                    onClick={clearCart}
                    className="bg-red-600 text-white px-6 py-2 rounded"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {orderId && (
          <div className="bg-green-100 p-6 mt-6 rounded shadow">
            <h2 className="text-lg font-bold">
              Order #{orderId} Created
            </h2>

            <button
              onClick={proceedToPayment}
              className="bg-green-600 text-white px-6 py-2 rounded mt-4"
            >
              Proceed to Payment
            </button>
          </div>
        )}
      </div>

      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow w-80">
            <h3 className="text-lg font-bold mb-4">
              Remove Item?
            </h3>
            <p className="mb-4">
              Are you sure you want to remove this item?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 bg-gray-400 text-white rounded"
              >
                Cancel
              </button>

              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}