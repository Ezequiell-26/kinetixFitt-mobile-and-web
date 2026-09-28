import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Sistema de botones KinetixFitt.
 * Mantiene jerarquía clara, targets táctiles grandes y feedback de interacción.
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline" | "accent" | "success" | "danger";
  size?: "sm" | "md" | "lg" | "xl" | "icon";
}

export function Button({ className, variant = "default", size = "md", ...props }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 " +
    "active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none select-none " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#081119] " +
    "min-h-[44px] whitespace-nowrap";
  const variants = {
    default: "bg-surface text-white hover:bg-surface-elevated border border-subtle rounded-xl",
    accent:
      "bg-primary text-[#081119] font-bold hover:bg-primary-hover rounded-2xl " +
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.38),0_8px_32px_rgb(var(--primary) / 0.18)] " +
      "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_8px_40px_rgb(var(--primary) / 0.26)] " +
      "hover:-translate-y-px",
    ghost: "bg-transparent text-zinc-400 hover:text-white hover:bg-white/[0.04] rounded-xl",
    outline:
      "border border-[#1C3142] text-zinc-100 hover:bg-white/[0.035] hover:border-white/[0.12] rounded-xl bg-transparent",
    success:
      "bg-[#C6F91E] text-[#081119] font-bold hover:bg-[#D8FF4A] rounded-2xl " +
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.32),0_6px_24px_rgb(var(--primary) / 0.16)]",
    danger:
      "bg-red-500/10 text-red-300 border border-red-500/25 hover:bg-red-500/20 hover:border-red-500/40 rounded-xl font-bold",
  };
  const sizes = {
    sm: "h-11 px-4 text-[13px] tracking-wide",
    md: "h-12 px-6 text-sm tracking-wide",
    lg: "h-[52px] px-8 text-[15px] font-bold tracking-wide",
    xl: "h-14 px-8 text-base font-black tracking-wide",
    icon: "h-11 w-11",
  };
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}
