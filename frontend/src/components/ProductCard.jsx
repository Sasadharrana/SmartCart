export default function ProductCard({ product, onAddToCart }) {
  return (
    <div className="bg-white shadow-md rounded-lg p-4 hover:shadow-xl transition">
      <img
        src={`http://127.0.0.1:8000${product.image_url}`}
        alt={product.name}
        className="h-40 w-full object-cover rounded"
      />

      <h2 className="font-semibold mt-2">{product.name}</h2>
      <p className="text-gray-600">₹{product.price}</p>
      <p className="text-sm text-gray-500">Stock: {product.stock}</p>

      <button
        onClick={() => onAddToCart(product.id)}
        disabled={product.stock === 0}
        className={`px-4 py-1 rounded mt-2 w-full ${
          product.stock === 0
            ? "bg-gray-400"
            : "bg-blue-600 text-white"
        }`}
      >
        {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
      </button>
    </div>
  );
}