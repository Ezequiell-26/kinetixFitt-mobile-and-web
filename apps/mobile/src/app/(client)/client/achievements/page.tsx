"use client";
import {
  AchievementsGrid,
  LevelDisplay,
  AchievementUnlockNotification,
  AchievementStats,
} from "@/components/achievements-display";
import { useAchievements, type NewUnlock } from "@/hooks/use-achievements";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Flame,
  Target,
  Star,
  Zap,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import type { AchievementCategory } from "@/lib/achievements";

const CATEGORY_FILTERS: { value: "all" | AchievementCategory; label: string; icon: typeof Trophy }[] = [
  { value: "all", label: "Todos", icon: Trophy },
  { value: "workouts", label: "Entrenamientos", icon: Flame },
  { value: "consistency", label: "Constancia", icon: Calendar },
  { value: "strength", label: "Fuerza", icon: Zap },
  { value: "volume", label: "Volumen", icon: TrendingUp },
  { value: "social", label: "Social", icon: Target },
  { value: "milestones", label: "Hitos", icon: Star },
];

export default function AchievementsPage() {
  // `getSession` es server, pero la página necesita ser cliente por el hook.
  // Usamos client-side rendering: el layout ya protege la ruta con redirect.
  const {
    achievements,
    challenges,
    xp,
    level,
    progressPercent,
    xpForNext,
    stats,
    pendingUnlocks,
    dismissUnlock,
  } = useAchievements();

  const [filter, setFilter] = useState<"all" | AchievementCategory>("all");

  const filteredAchievements =
    filter === "all"
      ? achievements
      : achievements.filter((a) => a.category === filter);

  const current = pendingUnlocks[0];

  return (
    <div className="max-w-[1100px] mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Trophy size={16} />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">
              Gamificación
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Mis logros
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Tu progreso, nivel y desafíos activos
          </p>
        </div>
      </motion.div>

      {/* Level + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <LevelDisplay xp={xp} />
        </div>
        <div className="space-y-4">
          <AchievementStats
            totalAchievements={stats.total}
            unlockedAchievements={stats.unlocked}
            xp={xp}
            level={level.level}
          />
        </div>
      </div>


      {/* Challenges */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Flame size={20} className="text-orange-400" />
            Desafíos activos
          </h2>
          <span className="text-xs text-zinc-500">
            {challenges.filter((c) => c.completed).length}/{challenges.length}{" "}
            completados
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {challenges.map((challenge, i) => {
            const current = challenge.requirement.current ?? 0;
            const progress = Math.min(100, (current / challenge.requirement.value) * 100);
            const daysLeft = Math.max(
              0,
              Math.ceil((challenge.endsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            );

            return (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`relative p-4 rounded-2xl border overflow-hidden ${
                  challenge.completed
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-zinc-800 bg-zinc-900/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl shrink-0">{challenge.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-sm truncate">
                        {challenge.name}
                      </h3>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                          challenge.type === "weekly"
                            ? "bg-blue-500/10 text-blue-400"
                            : "bg-purple-500/10 text-purple-400"
                        }`}
                      >
                        {challenge.type === "weekly" ? "Semanal" : "Mensual"}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {challenge.description}
                    </p>

                    {/* Progress */}
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-500">
                          {current.toLocaleString()}/{challenge.requirement.value.toLocaleString()}
                        </span>
                        <span className="font-bold text-primary">
                          +{challenge.xp} XP
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${
                            challenge.completed
                              ? "bg-emerald-500"
                              : "bg-gradient-to-r from-primary to-primary/60"
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px] text-zinc-500">
                        {challenge.completed
                          ? "✓ Completado"
                          : `${daysLeft} día${daysLeft === 1 ? "" : "s"} restantes`}
                      </span>

                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Achievements */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Star size={20} className="text-yellow-400" />
            Logros
          </h2>
          <span className="text-xs text-zinc-500">
            {stats.unlocked}/{stats.total} desbloqueados
          </span>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {CATEGORY_FILTERS.map((cat) => {
            const active = filter === cat.value;
            const count =
              cat.value === "all"
                ? achievements.length
                : achievements.filter((a) => a.category === cat.value).length;
            const unlocked =
              cat.value === "all"
                ? stats.unlocked
                : achievements.filter(
                    (a) => a.category === cat.value && a.unlocked
                  ).length;

            return (
              <button
                key={cat.value}
                onClick={() => setFilter(cat.value)}
                className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                  active
                    ? "bg-primary text-black border-primary"
                    : "bg-zinc-900/40 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white"
                }`}
              >
                <cat.icon size={14} />
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    active ? "bg-black/20 text-black" : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {unlocked}/{count}
                </span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={filter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AchievementsGrid achievements={filteredAchievements} />
          </motion.div>
        </AnimatePresence>
      </section>

      {/* Achievement unlock popup */}
      <AnimatePresence>
        {current && (
          <AchievementUnlockNotification
            achievement={current.achievement}
            onClose={dismissUnlock}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Nota: esta página es 100% cliente porque depende del hook useAchievements.
// El layout padre (ClientLayout) ya protege la ruta con getSession/redirect
// en el servidor antes de renderizar cualquier cliente, así que la protección
// de autenticación sigue intacta.
