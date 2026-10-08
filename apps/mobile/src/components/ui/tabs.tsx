"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

export type TabItem = {
  id: string;
  label: string;
  badge?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
};

export function Tabs({
  tabs,
  defaultId,
  className,
  children
}: {
  tabs: TabItem[];
  defaultId?: string;
  className?: string;
  children: (activeId: string) => React.ReactNode;
}) {
  const [active, setActive] = useState(defaultId || tabs[0]?.id);
  return (
    <div className={cn("space-y-4", className)}>
      <div
        role="tablist"
        className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#0B1117] border border-slate-800/80 overflow-x-auto scrollbar-none shadow-inner"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {tabs.map((t) => {
          const isActive = active === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${t.id}`}
              onClick={() => setActive(t.id)}
              className={cn(
                "relative shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 select-none whitespace-nowrap",
                isActive
                  ? "bg-primary text-black shadow-[0_2px_12px_rgba(52,211,153,0.35)] scale-[1.01]"
                  : "text-zinc-400 hover:text-white hover:bg-slate-800/50"
              )}
            >
              {Icon && <Icon size={15} className={isActive ? "text-black" : "text-zinc-400"} />}
              <span>{t.label}</span>
              {t.badge && (
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-0.5",
                    isActive ? "bg-black/20 text-black" : "bg-primary/20 text-primary"
                  )}
                >
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div id={`tabpanel-${active}`} role="tabpanel" aria-labelledby={active}>{children(active)}</div>
    </div>
  );
}

