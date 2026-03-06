import { Link, useNavigate } from "react-router-dom";

export default function Navbar({ hideOrders }) {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // 🔥 Dynamic Home Redirect
  const handleHomeRedirect = () => {
    if (!token) {
      navigate("/");
      return;
    }

    if (role === "buyer") {
      navigate("/buyer");
    } else if (role === "seller") {
      navigate("/seller");
    } else if (role === "admin") {
      navigate("/admin");
    } else {
      navigate("/");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user_email");
    navigate("/login");
  };

  return (
    <nav className="bg-blue-600 text-white px-8 py-4 flex justify-between items-center">
      
      {/* Logo (Now Dynamic) */}
      <h1
        className="text-xl font-bold cursor-pointer"
        onClick={handleHomeRedirect}
      >
        SmartCart
      </h1>

      <div className="flex gap-6 items-center">

        {/* 🔥 Dynamic Home Link */}
        <button
          onClick={handleHomeRedirect}
          className="hover:underline"
        >
          Home
        </button>

        {/* ================= BUYER ================= */}
        {token && role === "buyer" && (
          <>
            <Link to="/cart" className="hover:underline">
              Cart
            </Link>

            {/* 🔥 My Orders hidden when hideOrders=true */}
            {!hideOrders && (
              <Link to="/buyer" className="hover:underline">
                My Orders
              </Link>
            )}
          </>
        )}

        {/* ================= SELLER ================= */}
        {token && role === "seller" && (
          <Link to="/seller" className="hover:underline">
            Add Product
          </Link>
        )}

        {/* ================= ADMIN ================= */}
        {token && role === "admin" && (
          <Link to="/admin" className="hover:underline">
            Admin Panel
          </Link>
        )}

        {/* ================= AUTH ================= */}
        {!token ? (
          <>
            <Link to="/login" className="hover:underline">
              Login
            </Link>
            <Link to="/register" className="hover:underline">
              Register
            </Link>
          </>
        ) : (
          <button
            onClick={handleLogout}
            className="bg-red-500 px-3 py-1 rounded hover:bg-red-600"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}