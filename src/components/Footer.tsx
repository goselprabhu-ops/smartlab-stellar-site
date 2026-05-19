import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Mail, MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative mt-32 bg-gradient-hero text-cream">
      <div className="divider-gold" />
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo variant="light" />
            <p className="mt-5 max-w-md text-sm text-cream/70">
              An AI-powered learning ecosystem that transforms studying into measurable
              academic progress for students of Classes 6–12 CBSE.
            </p>
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-accent">
              Explore
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-cream/80">
              <li><Link to="/features" className="hover:text-accent">Features</Link></li>
              <li><Link to="/pricing" className="hover:text-accent">Pricing</Link></li>
              <li><Link to="/about" className="hover:text-accent">About</Link></li>
              <li><Link to="/contact" className="hover:text-accent">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-accent">
              Reach us
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-cream/80">
              <li>
                <a
                  href="mailto:support@smartlabonline.com"
                  className="inline-flex items-center gap-2 hover:text-accent"
                >
                  <Mail className="h-4 w-4" /> support@smartlabonline.com
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/919000000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-accent"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp +91 9XXXXXXXXX
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-cream/10 pt-6 text-xs text-cream/50 sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} SmartLab Online. All rights reserved.</span>
          <span>Built for Classes 6–12 CBSE · Strongest fit Grades 8–10</span>
        </div>
      </div>
    </footer>
  );
}
