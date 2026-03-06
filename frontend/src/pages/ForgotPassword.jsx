import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const res = await API.post("/auth/forgot-password", {
        email,
      });

      // For development we receive token directly
      const token = res.data.reset_token;

      setMessage("Reset link generated successfully!");

      // Auto redirect to reset page (since we return token in dev)
      setTimeout(() => {
        navigate(`/reset-password/${token}`);
      }, 1500);

    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow w-96">

        <h2 className="text-2xl font-bold mb-6 text-center">
          Forgot Password
        </h2>

        {message && (
          <p className="text-green-600 text-sm mb-4">
            {message}
          </p>
        )}

        {error && (
          <p className="text-red-600 text-sm mb-4">
            {error}
          </p>
        )}

        <input
          type="email"
          placeholder="Enter your registered email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-2 mb-4 rounded"
        />

        <button
          onClick={handleSubmit}
          disabled={loading || !email}
          className={`w-full py-2 rounded text-white ${
            loading
              ? "bg-gray-400"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Generating..." : "Send Reset Link"}
        </button>

      </div>
    </div>
  );
}