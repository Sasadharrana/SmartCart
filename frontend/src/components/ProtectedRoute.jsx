import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/login" />;
  }

  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;

    if (decoded.exp < currentTime) {
      localStorage.clear();
      return <Navigate to="/login" />;
    }

  } catch (error) {
    localStorage.clear();
    return <Navigate to="/login" />;
  }

  if (role !== allowedRole) {
    return <Navigate to="/login" />;
  }

  return children;
}