import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * WhatsAppButton — floating WhatsApp CTA.
 * Uses wa.me deep-link with a prefilled message. No SDK, no key.
 */
interface WhatsAppButtonProps {
  phone?: string;     // E.164 without +, e.g. "919876543210"
  message?: string;
  floating?: boolean;
  label?: string;
  className?: string;
}

const DEFAULT_PHONE = "919876543210"; // Smart Lab Online advisory line (placeholder)

export function WhatsAppButton({
  phone = DEFAULT_PHONE,
  message = "Hi Smart Lab Online team — I'd like to know more about your plans.",
  floating = false,
  label = "Chat on WhatsApp",
  className,
}: WhatsAppButtonProps) {
  const href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  if (floating) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className={cn(
          "fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-medium text-white shadow-elegant transition-transform hover:-translate-y-0.5",
          className,
        )}
      >
        <MessageCircle className="size-5" />
        <span className="hidden sm:inline">WhatsApp us</span>
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-[#25D366]/40 bg-[#25D366]/10 px-4 py-2 text-sm font-medium text-[#128C7E] transition-colors hover:bg-[#25D366]/20 dark:text-[#25D366]",
        className,
      )}
    >
      <MessageCircle className="size-4" /> {label}
    </a>
  );
}
