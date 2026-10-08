import * as React from "react";
import { cn } from "../utils";

/**
 * Card system — radio 20px consistente, theme-aware, jerarquía por elevación.
 * Usa clases CSS semánticas (.surface-card) que adaptan colores y sombras
 * automáticamente al modo claro/oscuro via globals.css.
 * En modo oscuro: bg-obsidiana + hairline iluminado superior.
 * En modo claro: bg-white + sombra suave + borde sutil.
 */
export function Card({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "surface-card rounded-[20px] overflow-hidden",
        "transition-all duration-200",
        className
      )}
      {...p}
    />
  );
}
export function CardHeader({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 sm:p-5 pb-3", className)} {...p} />;
}
export function CardContent({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 sm:p-5 pt-0", className)} {...p} />;
}
export function CardTitle({ className, ...p }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("font-display font-semibold text-zinc-100 text-[15px] text-balance", className)}
      {...p}
    />
  );
}
export function CardDesc({ className, ...p }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-zinc-500 leading-relaxed", className)} {...p} />;
}
