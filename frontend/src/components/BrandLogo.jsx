import logo from "../assets/logo.png";

export default function BrandLogo({ size = "h-16" }) {
  return (
    <div className="relative flex justify-center items-center">
      <img
        src={logo}
        alt="SmartCart"
        className={`${size} animate-pulse drop-shadow-[0_0_20px_#2563eb]`}
      />
    </div>
  );
}