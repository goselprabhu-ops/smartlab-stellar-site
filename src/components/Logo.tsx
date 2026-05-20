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
        className="h-[3.75rem] w-auto md:h-[4.5rem] lg:h-[5.25rem]"
        loading="eager"
        decoding="async"
      />
    </Link>
  );
}
