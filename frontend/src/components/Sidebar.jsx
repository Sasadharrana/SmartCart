import { Link, useNavigate } from "react-router-dom";

export default function Sidebar({ role }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="w-64 bg-[#1e293b] text-[#e2e8f0] p-6 min-h-screen border-r border-[#334155]">

      <h2 className="text-2xl font-bold mb-8 text-[#38bdf8]">
        SmartCart
      </h2>

      {/* ================= BUYER MENU ================= */}
      {role === "buyer" && (
        <>
          <Link
            to="/buyer"
            className="block mb-4 hover:text-[#38bdf8]"
          >
            My Orders
          </Link>

          <Link
            to="/cart"
            className="block mb-4 hover:text-[#38bdf8]"
          >
            Cart
          </Link>
        </>
      )}

      {/* ================= SELLER MENU ================= */}
      {role === "seller" && (
        <>
          <Link
            to="/seller"
            className="block mb-4 hover:text-[#38bdf8]"
          >
            Dashboard
          </Link>
        </>
      )}

      {/* ================= ADMIN MENU ================= */}
      {role === "admin" && (
        <>
          <Link
            to="/admin"
            className="block mb-4 hover:text-[#38bdf8]"
          >
            Admin Panel
          </Link>
        </>
      )}

      {/* ================= LOGOUT ================= */}
      <button
        onClick={handleLogout}
        className="mt-10 bg-red-600 text-white px-4 py-2 rounded w-full"
      >
        Logout
      </button>
    </div>
  );
}