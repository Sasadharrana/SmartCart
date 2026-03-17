import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import {
  FiHome,
  FiPackage,
  FiPlusCircle,
  FiLogOut,
  FiTrendingUp,
  FiAlertCircle
} from "react-icons/fi";

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

export default function SellerDashboard() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({
    total_products: 0,
    total_revenue: 0
  });

  const [showLowStock, setShowLowStock] = useState(false); // ✅ NEW

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: ""
  });

  const [image, setImage] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  const [page, setPage] = useState(1);
  const limit = 5;

  const [chartData, setChartData] = useState([]);

  const fetchProducts = async () => {
    try {
      const res = await API.get(`/products/seller?page=${page}&limit=${limit}`);
      setProducts(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await API.get("/products/seller/stats");
      setStats(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchRevenue = async () => {
  try {
    const res = await API.get("/orders/analytics/revenue/monthly");

    const formatted = res.data.map(item => ({
      name: item.month,
      revenue: item.revenue
    }));

    setChartData(formatted);
  } catch (error) {
    console.error("Revenue fetch error:", error);
  }
};

  useEffect(() => {
  fetchProducts();
  fetchStats();
  fetchRevenue(); // ✅ ADD THIS LINE
}, [page]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    Object.keys(form).forEach((key) => {
      formData.append(key, form[key]);
    });

    if (image) formData.append("image", image);

    if (editingProduct) {
      await API.put(`/products/${editingProduct.id}`, formData);
      alert("Updated ✅");
    } else {
      await API.post("/products", formData);
      alert("Added ✅");
    }

    setForm({ name: "", description: "", price: "", stock: "" });
    setImage(null);
    setEditingProduct(null);
    fetchProducts();
    fetchStats();
    setActiveTab("products");
  };

  const handleEdit = (p) => {
    setEditingProduct(p);
    setForm(p);
    setActiveTab("add");
  };

  const handleDelete = async (id) => {
    await API.delete(`/products/${id}`);
    fetchProducts();
    fetchStats();
  };

  // ✅ Low stock filter
  const lowStockProducts = products.filter(p => p.stock < 5);

  
  return (
    <div className="flex min-h-screen bg-[#0f172a] text-white">

      {/* SIDEBAR */}
      <div className="w-64 bg-[#1e293b] p-6 border-r border-[#334155]">
        <h2 className="text-2xl font-bold mb-10 text-cyan-400">
          Seller Panel
        </h2>

        <nav className="space-y-4">
          <button onClick={() => setActiveTab("dashboard")} className="flex gap-3 w-full p-2 rounded hover:bg-[#334155]">
            <FiHome /> Dashboard
          </button>

          <button onClick={() => setActiveTab("products")} className="flex gap-3 w-full p-2 rounded hover:bg-[#334155]">
            <FiPackage /> Products
          </button>

          <button onClick={() => setActiveTab("add")} className="flex gap-3 w-full p-2 rounded hover:bg-[#334155]">
            <FiPlusCircle /> Add Product
          </button>

          <button onClick={() => {
            localStorage.removeItem("token");
            navigate("/");
          }} className="flex gap-3 w-full p-2 rounded hover:bg-red-600 mt-10">
            <FiLogOut /> Logout
          </button>
        </nav>
      </div>

      {/* MAIN */}
      <div className="flex-1 p-10">

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <>
            <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

            <div className="grid md:grid-cols-3 gap-6">

              <div className="bg-[#1e293b] p-6 rounded-xl flex justify-between">
                <div>
                  <p>Products</p>
                  <h2 className="text-3xl">{stats.total_products}</h2>
                </div>
                <FiPackage size={28} />
              </div>

              <div className="bg-[#1e293b] p-6 rounded-xl flex justify-between">
                <div>
                  <p>Revenue</p>
                  <h2 className="text-3xl text-green-400">₹{stats.total_revenue}</h2>
                </div>
                <FiTrendingUp size={28} />
              </div>

              {/* ✅ CLICKABLE LOW STOCK */}
              <div
                onClick={() => setShowLowStock(true)}
                className="bg-[#1e293b] p-6 rounded-xl flex justify-between cursor-pointer hover:scale-105 transition"
              >
                <div>
                  <p>Low Stock</p>
                  <h2 className="text-3xl text-red-400">
                    {lowStockProducts.length}
                  </h2>
                </div>
                <FiAlertCircle size={28} />
              </div>

            </div>

            {/* ✅ CHART */}
            <div className="mt-10 bg-[#1e293b] p-6 rounded-xl">
              <h2 className="mb-4 text-xl">Stock Overview</h2>

              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="stock" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* ✅ LOW STOCK POPUP */}
            {showLowStock && (
              <div className="mt-6 bg-[#1e293b] p-6 rounded-xl">
                <h2 className="text-xl mb-4">Low Stock Products ⚠️</h2>

                {lowStockProducts.length === 0 ? (
                  <p>No low stock items</p>
                ) : (
                  lowStockProducts.map(p => (
                    <div key={p.id} className="flex justify-between border-b py-2">
                      <span>{p.name}</span>
                      <span className="text-red-400">Stock: {p.stock}</span>
                    </div>
                  ))
                )}

                <button
                  onClick={() => setShowLowStock(false)}
                  className="mt-4 bg-gray-700 px-4 py-2 rounded"
                >
                  Close
                </button>
              </div>
            )}
          </>
        )}



        {/* PRODUCTS */}
        {activeTab === "products" && (
          <>
            <h1 className="text-2xl mb-6">My Products</h1>

            <div className="bg-[#1e293b] rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#334155]">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">Stock</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-t border-[#334155]">
                      <td className="p-3 flex gap-3 items-center">
                        {p.image_url && (
                          <img src={`http://127.0.0.1:8000${p.image_url}`} className="w-10 h-10 rounded" />
                        )}
                        {p.name}
                      </td>

                      <td className="p-3">₹{p.price}</td>

                      <td className="p-3">
                        <span className={`px-2 py-1 rounded ${p.stock > 0 ? "bg-green-600" : "bg-red-600"}`}>
                          {p.stock}
                        </span>
                      </td>

                      <td className="p-3 flex gap-2">
                        <button onClick={() => handleEdit(p)} className="bg-blue-600 px-3 py-1 rounded">Edit</button>
                        <button onClick={() => handleDelete(p.id)} className="bg-red-600 px-3 py-1 rounded">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between mt-4">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="bg-gray-700 px-4 py-2 rounded">
                Prev
              </button>

              <span>Page {page}</span>

              <button
                disabled={products.length < limit}
                onClick={() => setPage(page + 1)}
                className="bg-gray-700 px-4 py-2 rounded"
              >
                Next
              </button>
            </div>
          </>
        )}

        {/* ADD */}
        {activeTab === "add" && (
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            <input className="w-full p-2 bg-gray-800" placeholder="Name"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

            <textarea className="w-full p-2 bg-gray-800" placeholder="Description"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

            <input type="number" className="w-full p-2 bg-gray-800" placeholder="Price"
              value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />

            <input type="number" className="w-full p-2 bg-gray-800" placeholder="Stock"
              value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />

            <input type="file" onChange={(e) => setImage(e.target.files[0])} />

            <button className="bg-blue-600 px-4 py-2 rounded">
              {editingProduct ? "Update" : "Add"}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}