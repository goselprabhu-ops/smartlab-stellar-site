import { Link } from "@tanstack/react-router";
import logoUrl from "@/assets/logo.png";

interface LogoProps {
  variant?: "light" | "dark";
  className?: string;
}

export function Logo({ className = "" }: LogoProps) {
  return (
    <Link to="/" className={`inline-flex items-center ${className}`} aria-label="Smart Lab Online">
      <img
        src={logoUrl}
        alt="Smart Lab Online"
        className="h-10 w-auto md:h-11"
        loading="eager"
        decoding="async"
      />
    </Link>
  );
}
