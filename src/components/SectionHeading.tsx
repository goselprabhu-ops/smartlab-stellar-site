import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  as?: "h1" | "h2";
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
  as: As = "h2",
}: SectionHeadingProps) {
  const alignClass = align === "center" ? "text-center mx-auto" : "text-left";
  return (
    <div className={cn("max-w-2xl", alignClass, className)}>
      {eyebrow && (
        <div className={cn("mb-4 inline-flex items-center gap-2", align === "center" && "justify-center")}>
          <span className="h-px w-8 bg-accent" />
          <span className="font-display text-xs font-medium uppercase tracking-[0.2em] text-accent">
            {eyebrow}
          </span>
        </div>
      )}
      <As className="text-balance font-display text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
        {title}
      </As>
      {description && (
        <p className="mt-5 text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}
