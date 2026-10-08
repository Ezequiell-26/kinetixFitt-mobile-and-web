import { cn } from "../utils";

/**
 * Skeleton — placeholder animado para estados de carga.
 * Theme-aware: usa bg-subtle que se adapta al modo claro/oscuro.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-subtle/60",
        className
      )}
      {...props}
    />
  );
}

/**
 * SkeletonCard — Card completo skeleton
 */
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-subtle bg-surface/40 p-4 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
    </div>
  );
}

/**
 * SkeletonMetricCard — Card de métrica (4 en dashboard)
 */
function SkeletonMetricCard() {
  return (
    <div className="rounded-2xl border border-subtle bg-surface/40 p-4 space-y-2">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-2 w-full mt-3" />
    </div>
  );
}

/**
 * SkeletonClientRow — Fila de cliente en lista (trainer)
 */
function SkeletonClientRow() {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl border border-subtle bg-surface/40">
      <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-2.5 w-48" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

/**
 * SkeletonToolCard — Card de herramienta en grid
 */
function SkeletonToolCard() {
  return (
    <div className="rounded-2xl border border-subtle bg-surface/40 p-3 space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="w-6 h-6 rounded-lg" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-20 w-full" />
    </div>
  );
}

/**
 * SkeletonHeroCard — Hero card del dashboard (entrenamiento del día)
 */
function SkeletonHeroCard() {
  return (
    <div className="rounded-3xl border border-subtle bg-surface/40 p-7 space-y-6 min-h-[380px]">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48 rounded-full" />
        <Skeleton className="h-6 w-16" />
      </div>
      <Skeleton className="h-12 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="space-y-2 mt-6">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>
      <Skeleton className="h-14 w-full rounded-2xl mt-auto" />
    </div>
  );
}

/**
 * SkeletonList — Lista de N skeletons
 */
function SkeletonList({
  count = 5,
  variant = "row"
}: {
  count?: number;
  variant?: "row" | "card" | "tool" | "metric";
}) {
  const Component =
    variant === "card" ? SkeletonCard :
    variant === "tool" ? SkeletonToolCard :
    variant === "metric" ? SkeletonMetricCard :
    SkeletonClientRow;

  return (
    <div className={variant === "metric" ? "grid grid-cols-2 lg:grid-cols-4 gap-3" : "space-y-3"}>
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </div>
  );
}

/**
 * SkeletonGrid — Grid de skeletons
 */
function SkeletonGrid({
  count = 6,
  cols = 3
}: {
  count?: number;
  cols?: 2 | 3 | 4;
}) {
  const gridClass =
    cols === 2 ? "grid-cols-2" :
    cols === 4 ? "grid-cols-2 lg:grid-cols-4" :
    "grid-cols-3";

  return (
    <div className={`grid ${gridClass} gap-2.5`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonToolCard key={i} />
      ))}
    </div>
  );
}

export {
  Skeleton,
  SkeletonCard,
  SkeletonMetricCard,
  SkeletonClientRow,
  SkeletonToolCard,
  SkeletonHeroCard,
  SkeletonList,
  SkeletonGrid,
};
