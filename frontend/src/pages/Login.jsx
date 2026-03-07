import { useState, useEffect } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loginError, setLoginError] = useState("");

  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const navigate = useNavigate();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  useEffect(() => {
    let valid = true;

    // Email validation (only if touched)
    if (emailTouched) {
      if (!email) {
        setEmailError("Please enter your email");
        valid = false;
      } else if (!emailRegex.test(email)) {
        setEmailError("Please enter a valid email address");
        valid = false;
      } else {
        setEmailError("");
      }
    }

    // Password validation (only if touched)
    if (passwordTouched) {
      if (!password) {
        setPasswordError("Please enter your password");
        valid = false;
      } else if (password.length < 6) {
        setPasswordError("Please enter a valid password");
        valid = false;
      } else {
        setPasswordError("");
      }
    }

    if (!email || !password) valid = false;

    setIsValid(valid);
  }, [email, password, emailTouched, passwordTouched]);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setLoginError("");

      const res = await API.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("role", res.data.role);

      if (res.data.role === "buyer") navigate("/buyer");
      if (res.data.role === "seller") navigate("/seller");
      if (res.data.role === "admin") navigate("/admin");

    } catch (err) {
      setLoginError(
        "Invalid email or password. Please enter valid email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow w-96">

        <h2 className="text-2xl font-bold mb-6 text-center">
          Login
        </h2>

        {loginError && (
          <p className="text-red-600 text-sm mb-4">
            {loginError}
          </p>
        )}

        {/* Email */}
        <input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setLoginError("");
          }}
          onBlur={() => setEmailTouched(true)}
          className="w-full border p-2 mb-1 rounded"
        />

        {emailTouched && emailError && (
          <p className="text-red-500 text-xs mb-3">
            {emailError}
          </p>
        )}

        {/* Password */}
        <div className="relative mb-1">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setLoginError("");
            }}
            onBlur={() => setPasswordTouched(true)}
            className="w-full border p-2 rounded pr-10"
          />

          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2 cursor-pointer text-gray-600"
          >
            {showPassword ? "Hide" : "Show"}
          </span>
        </div>

        {passwordTouched && passwordError && (
          <p className="text-red-500 text-xs mb-3">
            {passwordError}
          </p>
        )}

        {/* Forgot Password Link */}
        <p
          onClick={() => navigate("/forgot-password")}
          className="text-sm text-blue-600 cursor-pointer hover:underline mb-4"
        >
          Forgot Password?
        </p>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={!isValid || loading}
          className={`w-full py-2 rounded text-white flex justify-center items-center ${
            isValid && !loading
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            "Login"
          )}
        </button>

      </div>
    </div>
  );
}