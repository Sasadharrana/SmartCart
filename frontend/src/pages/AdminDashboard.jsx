import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import toast from "react-hot-toast";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [logs, setLogs] = useState([]);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);

  const [userSearch, setUserSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const ITEMS_PER_PAGE = 5;
  const [userPage, setUserPage] = useState(1);
  const [productPage, setProductPage] = useState(1);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);

      const usersRes = await API.get("/admin/users");
      const productsRes = await API.get("/admin/products");
      const ordersRes = await API.get("/admin/orders/details");

      setUsers(usersRes.data || []);
      setProducts(productsRes.data || []);
      setOrders(ordersRes.data || []);
    } catch (err) {
      console.error("ADMIN FETCH ERROR:", err);
      toast.error("Failed to fetch admin data");
    } finally {
      setLoading(false);
    }
  };

  // ================= ACTIVITY LOG =================
  const addLog = (message) => {
    const newLog = {
      id: Date.now(),
      message,
      time: new Date().toLocaleString(),
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  // ================= ORDER STATUS UPDATE =================
  const updateOrderStatus = async (orderId, status) => {
    try {
      await API.put(`/admin/orders/${orderId}/status`, { status });
      toast.success("Order status updated");
      addLog(`Order #${orderId} changed to ${status}`);
      fetchAll();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update order");
    }
  };

  // ================= SEARCH =================
  const filteredUsers = users.filter((u) =>
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const paginatedUsers = filteredUsers.slice(
    (userPage - 1) * ITEMS_PER_PAGE,
    userPage * ITEMS_PER_PAGE
  );

  const paginatedProducts = filteredProducts.slice(
    (productPage - 1) * ITEMS_PER_PAGE,
    productPage * ITEMS_PER_PAGE
  );

  const totalRevenue = orders.reduce(
    (sum, order) => sum + (order.total_amount || 0),
    0
  );

  // ================= MONTHLY REVENUE =================
  const monthlyRevenue = useMemo(() => {
    const map = {};
    orders.forEach((order) => {
      if (!order.created_at) return;
      const month = new Date(order.created_at).toLocaleString("default", {
        month: "short",
      });
      map[month] = (map[month] || 0) + order.total_amount;
    });
    return Object.keys(map).map((m) => ({
      month: m,
      revenue: map[m],
    }));
  }, [orders]);

  // ================= ORDER STATUS ANALYTICS =================
  const orderStatusData = useMemo(() => {
    const map = {};
    orders.forEach((order) => {
      map[order.status] = (map[order.status] || 0) + 1;
    });
    return Object.keys(map).map((status) => ({
      name: status,
      value: map[status],
    }));
  }, [orders]);

  const COLORS = ["#38bdf8", "#22c55e", "#facc15", "#f97316", "#ef4444"];

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-[#e2e8f0]">

      {/* SIDEBAR */}
      <div className="w-64 bg-[#1e293b] border-r border-[#334155] p-6">
        <h2 className="text-2xl font-bold mb-8 text-[#38bdf8]">
          Admin Panel
        </h2>

        {["dashboard", "users", "products", "orders", "logs"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="w-full text-left px-4 py-2 mb-2 rounded hover:bg-[#334155]"
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* MAIN */}
      <div className="flex-1 p-10">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#38bdf8]">
            Admin Panel
          </h2>

          <button
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/");
            }}
            className="bg-gradient-to-r from-[#2563eb] to-[#06b6d4] px-4 py-2 rounded text-white"
          >
            Logout
          </button>
        </div>

        {loading && <p>Loading...</p>}

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <>
            <div className="grid grid-cols-4 gap-6 mb-10">
              <Card title="Users" value={users.length} />
              <Card title="Products" value={products.length} />
              <Card title="Orders" value={orders.length} />
              <Card title="Revenue" value={`₹${totalRevenue}`} green />
            </div>

            <div className="grid grid-cols-2 gap-10">

              {/* Monthly Revenue */}
              <div className="bg-[#1e293b] p-6 rounded">
                <h3 className="mb-4">Monthly Revenue</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={monthlyRevenue}>
                    <XAxis dataKey="month" stroke="#ccc" />
                    <YAxis stroke="#ccc" />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#22c55e" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Order Status Chart */}
              <div className="bg-[#1e293b] p-6 rounded">
                <h3 className="mb-4">Order Status Analytics</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={80}
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

            </div>
          </>
        )}

        {/* USERS */}
        {activeTab === "users" && (
          <>
            <input
              placeholder="Search users..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="mb-4 p-2 rounded bg-[#0f172a] border border-[#334155]"
            />

            {paginatedUsers.map((u) => (
              <div key={u.id} className="bg-[#1e293b] p-4 mb-2 rounded">
                {u.email} — {u.role}
              </div>
            ))}

            <Pagination
              page={userPage}
              total={filteredUsers.length}
              setPage={setUserPage}
            />
          </>
        )}

        {/* PRODUCTS */}
        {activeTab === "products" && (
          <>
            <input
              placeholder="Search products..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="mb-4 p-2 rounded bg-[#0f172a] border border-[#334155]"
            />

            {paginatedProducts.map((p) => (
              <div key={p.id} className="bg-[#1e293b] p-4 mb-2 rounded">
                {p.name} — ₹{p.price}
              </div>
            ))}

            <Pagination
              page={productPage}
              total={filteredProducts.length}
              setPage={setProductPage}
            />
          </>
        )}

        {/* ORDERS */}
        {activeTab === "orders" && (
          <>
            {orders.map((order) => (
              <div key={order.order_id} className="bg-[#1e293b] p-4 mb-4 rounded">
                <div className="flex justify-between mb-2">
                  <span>Order #{order.order_id}</span>
                  <span>{order.status}</span>
                </div>

                <div>Total: ₹{order.total_amount}</div>

                <select
                  value={order.status}
                  onChange={(e) =>
                    updateOrderStatus(order.order_id, e.target.value)
                  }
                  className="mt-2 bg-[#0f172a] border border-[#334155] p-1 rounded"
                >
                  <option value="PLACED">PLACED</option>
                  <option value="PAID">PAID</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            ))}
          </>
        )}

        {/* LOGS */}
        {activeTab === "logs" && (
          <>
            <h2 className="mb-4 text-xl font-bold">Admin Activity Logs</h2>
            {logs.length === 0 && <p>No activities yet</p>}
            {logs.map((log) => (
              <div key={log.id} className="bg-[#1e293b] p-3 mb-2 rounded">
                <p>{log.message}</p>
                <small className="text-[#94a3b8]">{log.time}</small>
              </div>
            ))}
          </>
        )}

      </div>
    </div>
  );
}

function Card({ title, value, green }) {
  return (
    <div className="bg-[#1e293b] p-6 rounded shadow">
      <h3 className="text-[#94a3b8]">{title}</h3>
      <p className={`text-2xl font-bold ${green ? "text-[#22c55e]" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function Pagination({ page, total, setPage }) {
  const totalPages = Math.ceil(total / 5);

  return (
    <div className="flex gap-4 mt-4">
      <button
        disabled={page === 1}
        onClick={() => setPage(page - 1)}
        className="px-3 py-1 bg-blue-600 rounded"
      >
        Prev
      </button>
      <span>Page {page} of {totalPages}</span>
      <button
        disabled={page === totalPages}
        onClick={() => setPage(page + 1)}
        className="px-3 py-1 bg-blue-600 rounded"
      >
        Next
      </button>
    </div>
  );
}