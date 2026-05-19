import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
  icon?: React.ReactNode;
};

export const AuthField = forwardRef<HTMLInputElement, Props>(function AuthField(
  { label, hint, error, icon, type = "text", className, id, ...rest },
  ref,
) {
  const [show, setShow] = useState(false);
  const inputId = id ?? `f-${label.replace(/\s+/g, "-").toLowerCase()}`;
  const isPwd = type === "password";
  const effType = isPwd && show ? "text" : type;

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="text-xs font-medium text-foreground">
        {label}
      </label>
      <div
        className={cn(
          "group relative flex items-center rounded-lg border bg-background transition-soft",
          error
            ? "border-destructive ring-2 ring-destructive/15"
            : "border-input focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15",
        )}
      >
        {icon && <span className="pl-3 text-muted-foreground">{icon}</span>}
        <input
          ref={ref}
          id={inputId}
          type={effType}
          className={cn(
            "w-full flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground/70 disabled:opacity-60",
            isPwd && "pr-10",
            className,
          )}
          {...rest}
        />
        {isPwd && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-2 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
});
