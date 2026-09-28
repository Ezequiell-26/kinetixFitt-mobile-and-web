"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  ACHIEVEMENTS,
  WEEKLY_CHALLENGES,
  MONTHLY_CHALLENGES,
  type Achievement,
  type Challenge,
  type AchievementCategory,
  getLevelFromXP,
  getProgressToNextLevel,
  getXPForNextLevel,
} from "@/lib/achievements";

/**
 * Estado del atleta en el sistema de gamificación.
 *
 * Por ahora usa un store local (localStorage) para persistir progreso
 * mientras no haya endpoints de XP en el backend. Cuando exista
 * `GET /api/me/gamification`, reemplazar load/save por fetch al API.
 */
export interface GamificationState {
  xp: number;
  stats: {
    workouts_completed: number;
    streak_days: number;
    max_bench: number;
    max_squat: number;
    max_deadlift: number;
    bench_bodyweight_ratio: number;
    total_volume_kg: number;
    checkins_sent: number;
    referrals: number;
    days_active: number;
    weight_goal_reached: number;
    weekly_volume_kg: number;
    weekly_sessions: number;
    weekly_prs: number;
    monthly_workouts: number;
    monthly_volume_kg: number;
    monthly_checkins: number;
  };
  unlockedIds: string[];
  challengeProgress: Record<string, number>;
}

const STORAGE_KEY = "ec_gamification_v1";

function storageKeyForUser(userId: string): string {
  return `${STORAGE_KEY}:${userId}`;
}

const DEFAULT_STATE: GamificationState = {
  xp: 0,
  stats: {
    workouts_completed: 0,
    streak_days: 0,
    max_bench: 0,
    max_squat: 0,
    max_deadlift: 0,
    bench_bodyweight_ratio: 0,
    total_volume_kg: 0,
    checkins_sent: 0,
    referrals: 0,
    days_active: 0,
    weight_goal_reached: 0,
    weekly_volume_kg: 0,
    weekly_sessions: 0,
    weekly_prs: 0,
    monthly_workouts: 0,
    monthly_volume_kg: 0,
    monthly_checkins: 0,
  },
  unlockedIds: [],
  challengeProgress: {},
};

function loadState(userId: string): GamificationState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(storageKeyForUser(userId));
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATE,
      ...parsed,
      stats: { ...DEFAULT_STATE.stats, ...(parsed.stats || {}) },
      unlockedIds: Array.isArray(parsed.unlockedIds) ? parsed.unlockedIds : [],
      challengeProgress:
        parsed.challengeProgress && typeof parsed.challengeProgress === "object"
          ? parsed.challengeProgress
          : {},
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(userId: string, state: GamificationState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKeyForUser(userId), JSON.stringify(state));
  } catch {
    // Ignorar: storage lleno o bloqueado.
  }
}

export interface NewUnlock {
  achievement: Achievement;
  xpGained: number;
}

/**
 * Hook para leer y actualizar el estado de gamificación.
 * Devuelve achievements con su progreso calculado, lista de
 * challenges, XP, nivel y función para incrementar stats.
 */
export function useAchievements() {
  const [state, setState] = useState<GamificationState>(DEFAULT_STATE);
  const [pendingUnlocks, setPendingUnlocks] = useState<NewUnlock[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // El backend es la fuente de identidad. La cookie httpOnly no es legible
  // desde el cliente, por eso resolvemos el id vía /api/auth/me.
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) {
          if (!cancelled) setIsHydrated(true);
          return;
        }

        const payload = (await response.json()) as { user?: { id?: string } | null };
        const resolvedUserId = payload.user?.id;
        if (!resolvedUserId) {
          if (!cancelled) setIsHydrated(true);
          return;
        }

        if (!cancelled) {
          setUserId(resolvedUserId);
          setState(loadState(resolvedUserId));
          setIsHydrated(true);
        }
      } catch {
        if (!cancelled) setIsHydrated(true);
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persistir únicamente después de resolver la identidad para impedir
  // fugas de progreso entre cuentas del mismo navegador.
  useEffect(() => {
    if (!userId || !isHydrated) return;
    saveState(userId, state);
  }, [isHydrated, state, userId]);

  /**
   * Logros con el progreso actual calculado desde stats.
   */
  const achievements: Achievement[] = useMemo(() => {
    return ACHIEVEMENTS.map((a) => {
      const current = (state.stats as Record<string, number>)[a.requirement.type] ?? 0;
      const unlocked = state.unlockedIds.includes(a.id);
      return {
        ...a,
        unlocked,
        requirement: { ...a.requirement, current },
      };
    });
  }, [state]);

  /**
   * Challenges con progreso y vencimiento dinámico.
   */
  const challenges: Challenge[] = useMemo(() => {
    const now = new Date();
    // Semana actual termina el próximo domingo 23:59.
    const daysUntilSunday = 6 - now.getDay();
    const weeklyEnd = new Date(now);
    weeklyEnd.setHours(23, 59, 59, 999);
    weeklyEnd.setDate(now.getDate() + daysUntilSunday);

    // Mes actual termina el último día del mes.
    const monthlyEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const build = (
      list: typeof WEEKLY_CHALLENGES,
      type: "weekly" | "monthly",
      endsAt: Date
    ): Challenge[] =>
      list.map((c) => {
        const currentVal =
          state.challengeProgress[c.id] ??
          ((state.stats as Record<string, number>)[c.requirement.type] ?? 0);
        return {
          ...c,
          type,
          endsAt,
          completed: currentVal >= c.requirement.value,
          requirement: { ...c.requirement, current: currentVal },
        };
      });

    return [
      ...build(WEEKLY_CHALLENGES, "weekly", weeklyEnd),
      ...build(MONTHLY_CHALLENGES, "monthly", monthlyEnd),
    ];
  }, [state]);

  const level = useMemo(() => getLevelFromXP(state.xp), [state.xp]);
  const progressPercent = useMemo(() => getProgressToNextLevel(state.xp), [state.xp]);
  const xpForNext = useMemo(() => getXPForNextLevel(state.xp), [state.xp]);

  /**
   * Incrementa una stat del atleta y desbloquea logros si se cumple
   * la condición. Devuelve la lista de nuevos logros desbloqueados.
   */
  const incrementStat = useCallback(
    <K extends keyof GamificationState["stats"]>(
      key: K,
      amount: number | ((current: GamificationState["stats"][K]) => GamificationState["stats"][K])
    ): NewUnlock[] => {
      const newUnlocks: NewUnlock[] = [];

      setState((prev) => {
        const current = prev.stats[key] as number;
        const next =
          typeof amount === "function"
            ? (amount as (c: number) => number)(current)
            : current + (amount as number);

        const newStats = { ...prev.stats, [key]: next };
        const newUnlocked = [...prev.unlockedIds];
        let xpGained = 0;

        // Evaluar todos los logros.
        ACHIEVEMENTS.forEach((a) => {
          if (newUnlocked.includes(a.id)) return;
          const progress = (newStats as Record<string, number>)[a.requirement.type] ?? 0;
          if (progress >= a.requirement.value) {
            newUnlocked.push(a.id);
            xpGained += a.xp;
            newUnlocks.push({ achievement: a, xpGained: a.xp });
          }
        });

        return {
          ...prev,
          stats: newStats,
          unlockedIds: newUnlocked,
          xp: prev.xp + xpGained,
        };
      });

      if (newUnlocks.length > 0) {
        setPendingUnlocks((p) => [...p, ...newUnlocks]);
      }
      return newUnlocks;
    },
    []
  );

  /**
   * Descarta la notificación de logro más antigua (FIFO).
   */
  const dismissUnlock = useCallback(() => {
    setPendingUnlocks((p) => p.slice(1));
  }, []);

  const filters: { value: "all" | AchievementCategory; label: string }[] = useMemo(
    () => [
      { value: "all", label: "Todos" },
      { value: "workouts", label: "Entrenamientos" },
      { value: "consistency", label: "Constancia" },
      { value: "strength", label: "Fuerza" },
      { value: "volume", label: "Volumen" },
      { value: "social", label: "Social" },
      { value: "milestones", label: "Hitos" },
    ],
    []
  );

  const stats = useMemo(
    () => ({
      total: ACHIEVEMENTS.length,
      unlocked: state.unlockedIds.length,
      locked: ACHIEVEMENTS.length - state.unlockedIds.length,
    }),
    [state.unlockedIds.length]
  );

  return {
    achievements,
    challenges,
    xp: state.xp,
    level,
    progressPercent,
    xpForNext,
    stats,
    filters,
    pendingUnlocks,
    incrementStat,
    dismissUnlock,
  };
}
