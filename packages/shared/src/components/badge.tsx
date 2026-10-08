import { cn } from "../utils";

/**
 * Badge system — theme-aware con variantes semánticas.
 * En modo oscuro: fondos translúcidos con bordes de color sutil.
 * En modo claro: fondos suaves con texto oscuro para contraste AA.
 */
export function Badge({
  variant = "default",
  className,
  ...p
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "accent" | "success" | "warn" | "danger" | "muted";
}) {
  const v = {
    default: "bg-zinc-500/10 text-zinc-300 border-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
    accent: "bg-primary/10 text-primary border-primary/25",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warn: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    danger: "bg-red-500/10 text-red-400 border-red-500/20",
    muted: "bg-zinc-800/60 text-zinc-500 border-zinc-700/50",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 text-[11px] font-bold tracking-widest uppercase rounded-full border",
        v[variant],
        className
      )}
      {...p}
    />
  );
}
