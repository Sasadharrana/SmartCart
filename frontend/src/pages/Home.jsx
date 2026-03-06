import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#0f172a] text-white">

      {/* LOGO SECTION */}
      <div className="text-center mb-14">
        <img
          src={logo}
          alt="SmartCart Logo"
          className="h-40 mx-auto mb-6 drop-shadow-2xl"
        />

        <h1 className="text-4xl font-bold tracking-wider text-[#e2e8f0]">
        </h1>

        <p className="mt-3 text-[#94a3b8] text-lg">
          Your Smart Shopping Destination
        </p>
      </div>

      {/* LOGIN / REGISTER CARD */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-2xl shadow-2xl p-10 w-96 text-center">

        <button
          onClick={() => navigate("/login")}
          className="w-full bg-gradient-to-r from-[#2563eb] to-[#06b6d4] text-white py-3 rounded-lg mb-4 hover:opacity-90 transition duration-300"
        >
          Login
        </button>

        <button
          onClick={() => navigate("/register")}
          className="w-full border border-[#2563eb] text-[#38bdf8] py-3 rounded-lg hover:bg-[#1e40af] hover:text-white transition duration-300"
        >
          Register
        </button>

      </div>

      {/* FOOTER */}
      <p className="mt-12 text-sm text-[#64748b]">
        © 2026 SmartCart. All rights reserved.
      </p>

    </div>
  );
}