import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { FiHome, FiPackage, FiPlusCircle, FiLogOut } from "react-icons/fi";

export default function SellerDashboard() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({
    total_products: 0,
    total_revenue: 0
  });

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: ""
  });

  const [image, setImage] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  // ================= FETCH PRODUCTS =================
  const fetchProducts = async () => {
    try {
      const res = await API.get("/products/seller");
      setProducts(res.data);
    } catch (error) {
      console.error("Product fetch error:", error.response?.data);
    }
  };

  // ================= FETCH STATS =================
  const fetchStats = async () => {
    try {
      const res = await API.get("/products/seller/stats");
      setStats(res.data);
    } catch (error) {
      console.error("Stats fetch error:", error.response?.data);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, []);

  // ================= ADD / UPDATE PRODUCT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("price", form.price);
      formData.append("stock", form.stock);

      if (image) {
        formData.append("image", image);
      }

      if (editingProduct) {
        await API.put(`/products/${editingProduct.id}`, formData);
        alert("Product Updated Successfully ✅");
      } else {
        await API.post("/products", formData);
        alert("Product Added Successfully ✅");
      }

      setForm({
        name: "",
        description: "",
        price: "",
        stock: ""
      });

      setImage(null);
      setEditingProduct(null);

      fetchProducts();
      fetchStats();
      setActiveTab("products");

    } catch (error) {
      console.error("Submit error:", error.response?.data || error.message);
      alert("Operation Failed ❌");
    }
  };

  // ================= EDIT PRODUCT =================
  const handleEdit = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock
    });
    setActiveTab("add");
  };

  // ================= DELETE PRODUCT =================
  const handleDelete = async (id) => {
    try {
      await API.delete(`/products/${id}`);
      fetchProducts();
      fetchStats();
    } catch (error) {
      console.error("Delete error:", error.response?.data);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-white">

      {/* ================= SIDEBAR ================= */}
      <div className="w-64 bg-[#1e293b] p-6 border-r border-[#334155]">
        <h2 className="text-2xl font-bold mb-10 text-[#38bdf8]">
          Seller Panel
        </h2>

        <nav className="space-y-4">

          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-3 w-full p-2 rounded ${
              activeTab === "dashboard" ? "bg-[#334155]" : "hover:bg-[#334155]"
            }`}
          >
            <FiHome /> Dashboard
          </button>

          <button
            onClick={() => setActiveTab("products")}
            className={`flex items-center gap-3 w-full p-2 rounded ${
              activeTab === "products" ? "bg-[#334155]" : "hover:bg-[#334155]"
            }`}
          >
            <FiPackage /> My Products
          </button>

          <button
            onClick={() => {
              setEditingProduct(null);
              setForm({
                name: "",
                description: "",
                price: "",
                stock: ""
              });
              setActiveTab("add");
            }}
            className={`flex items-center gap-3 w-full p-2 rounded ${
              activeTab === "add" ? "bg-[#334155]" : "hover:bg-[#334155]"
            }`}
          >
            <FiPlusCircle /> Add Product
          </button>

          <button
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/");
            }}
            className="flex items-center gap-3 w-full p-2 rounded hover:bg-red-600 mt-10"
          >
            <FiLogOut /> Logout
          </button>

        </nav>
      </div>

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 p-10">

        {/* ================= DASHBOARD ================= */}
        {activeTab === "dashboard" && (
          <>
            <h1 className="text-3xl font-bold mb-8">
              Dashboard Overview
            </h1>

            <div className="grid md:grid-cols-2 gap-8">

              <div className="bg-[#1e293b] p-8 rounded-xl shadow-lg">
                <p className="text-gray-400 mb-2">Total Products</p>
                <h2 className="text-4xl font-bold">
                  {stats.total_products}
                </h2>
              </div>

              <div className="bg-[#1e293b] p-8 rounded-xl shadow-lg">
                <p className="text-gray-400 mb-2">Total Revenue</p>
                <h2 className="text-4xl font-bold text-green-400">
                  ₹{stats.total_revenue}
                </h2>
              </div>

            </div>
          </>
        )}

        {/* ================= MY PRODUCTS ================= */}
        {activeTab === "products" && (
          <>
            <h1 className="text-2xl font-bold mb-6">
              My Products
            </h1>

            {products.length === 0 ? (
              <p className="text-gray-400">No products added yet.</p>
            ) : (
              <div className="bg-[#1e293b] rounded-xl overflow-hidden shadow-lg">
                <table className="w-full text-left">
                  <thead className="bg-[#334155]">
                    <tr>
                      <th className="p-4">Product</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Stock</th>
                      <th className="p-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        className="border-t border-[#334155] hover:bg-[#273449]"
                      >
                        <td className="p-4 flex items-center gap-4">
                          {product.image_url && (
                            <img
                              src={`http://127.0.0.1:8000${product.image_url}`}
                              className="h-12 w-12 object-cover rounded"
                              alt={product.name}
                            />
                          )}
                          {product.name}
                        </td>
                        <td className="p-4">₹{product.price}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            product.stock > 0
                              ? "bg-green-600"
                              : "bg-red-600"
                          }`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="p-4 flex gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="bg-blue-600 px-4 py-1 rounded hover:bg-blue-700"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => handleDelete(product.id)}
                            className="bg-red-600 px-4 py-1 rounded hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ================= ADD / UPDATE PRODUCT ================= */}
        {activeTab === "add" && (
          <>
            <h1 className="text-2xl font-bold mb-6">
              {editingProduct ? "Update Product" : "Add Product"}
            </h1>

            <form
              onSubmit={handleSubmit}
              className="bg-[#1e293b] p-8 rounded-xl shadow-lg max-w-lg"
            >

              <div className="space-y-4">

                <input
                  type="text"
                  placeholder="Product Name"
                  value={form.name}
                  className="w-full p-3 bg-[#0f172a] border border-[#334155] rounded"
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  required
                />

                <textarea
                  placeholder="Description"
                  value={form.description}
                  className="w-full p-3 bg-[#0f172a] border border-[#334155] rounded"
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  required
                />

                <input
                  type="number"
                  placeholder="Price"
                  value={form.price}
                  className="w-full p-3 bg-[#0f172a] border border-[#334155] rounded"
                  onChange={(e) =>
                    setForm({ ...form, price: e.target.value })
                  }
                  required
                />

                <input
                  type="number"
                  placeholder="Stock"
                  value={form.stock}
                  className="w-full p-3 bg-[#0f172a] border border-[#334155] rounded"
                  onChange={(e) =>
                    setForm({ ...form, stock: e.target.value })
                  }
                  required
                />

                <input
                  type="file"
                  onChange={(e) => setImage(e.target.files[0])}
                />

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#2563eb] to-[#06b6d4] py-3 rounded font-semibold hover:opacity-90"
                >
                  {editingProduct ? "Update Product" : "Add Product"}
                </button>

              </div>
            </form>
          </>
        )}

      </div>
    </div>
  );
}