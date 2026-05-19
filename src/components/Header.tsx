import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, ChevronDown } from "lucide-react";
import { Logo } from "./Logo";
import { CtaButton } from "./CtaButton";
import { ThemeToggle } from "./ThemeToggle";

type NavItem = { to: string; label: string; description?: string };

const PRODUCT: NavItem[] = [
  { to: "/features",                     label: "Features overview",   description: "Everything inside Smart Lab Online." },
  { to: "/ai-learning",                  label: "AI Learning",         description: "How our adaptive engine works." },
  { to: "/product/ai-tutor",             label: "AI Tutor",            description: "Socratic, 24/7, CBSE-aware." },
  { to: "/product/study-path",           label: "Smart Study Path",    description: "A daily plan that rebuilds itself." },
  { to: "/product/personalized-learning",label: "Personalized Learning", description: "Curriculum tuned to every student." },
  { to: "/product/test-engine",          label: "Test Engine",         description: "Adaptive tests with AI grading." },
  { to: "/product/progress-tracking",    label: "Progress Tracking",   description: "Mastery, concept by concept." },
  { to: "/product/analytics",            label: "Analytics",           description: "Heatmaps & AI insights." },
  { to: "/product/student-dashboard",    label: "Student Dashboard",   description: "The calm home screen." },
  { to: "/product/parent-dashboard",     label: "Parent Dashboard",    description: "Visibility, not surveillance." },
  { to: "/courses",                      label: "Courses",             description: "Full CBSE coverage, Classes 6–12." },
];

const COMPANY: NavItem[] = [
  { to: "/about",   label: "About",   description: "Our mission and team." },
  { to: "/schools", label: "Schools", description: "For institutions and educators." },
  { to: "/blog",    label: "Blog",    description: "Field notes on learning." },
  { to: "/contact", label: "Contact", description: "Talk to our team." },
];

const TOP: Array<{ to: string; label: string } | { label: string; menu: NavItem[] }> = [
  { label: "Product", menu: PRODUCT },
  { label: "Company", menu: COMPANY },
  { to: "/pricing", label: "Pricing" },
  { to: "/demo",    label: "Book demo" },
];

function MenuDropdown({ label, items }: { label: string; items: NavItem[] }) {
  return (
    <div className="group relative">
      <button className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
        {label} <ChevronDown className="size-3.5 opacity-60 transition-transform group-hover:rotate-180" />
      </button>
      <div className={`invisible absolute left-1/2 top-full z-50 ${items.length > 5 ? "w-[640px]" : "w-72"} -translate-x-1/2 pt-3 opacity-0 transition-all group-hover:visible group-hover:opacity-100`}>
        <div className="elev-4 overflow-hidden rounded-2xl border bg-popover p-2 text-popover-foreground">
          <div className={items.length > 5 ? "grid grid-cols-2 gap-1" : ""}>
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="block rounded-lg px-3 py-2.5 hover:bg-muted"
                activeProps={{ className: "bg-muted" }}
              >
                <div className="text-sm font-medium">{item.label}</div>
                {item.description && (
                  <div className="text-xs text-muted-foreground">{item.description}</div>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          {TOP.map((item) =>
            "menu" in item ? (
              <MenuDropdown key={item.label} label={item.label} items={item.menu} />
            ) : (
              <Link
                key={item.to}
                to={item.to}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Link to="/login" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Sign in
          </Link>
          <CtaButton size="md">Start free</CtaButton>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="rounded-md p-2 text-foreground md:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border/40 md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-4">
            {[...PRODUCT, ...COMPANY, { to: "/pricing", label: "Pricing" }, { to: "/demo", label: "Book demo" }].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                activeProps={{ className: "text-foreground bg-muted" }}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex items-center gap-2 px-1">
              <ThemeToggle />
              <Link to="/login" className="flex-1 rounded-md border px-3 py-2 text-center text-sm font-medium">
                Sign in
              </Link>
              <CtaButton size="md" className="flex-1 justify-center">Start free</CtaButton>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
