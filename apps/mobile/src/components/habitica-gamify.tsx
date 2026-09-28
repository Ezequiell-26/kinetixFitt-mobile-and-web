"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sword, Flame, Trophy, Target } from "lucide-react";
import { useAchievements } from "@/hooks/use-achievements";

export function HabiticaGamify(){
  const { xp, level, progressPercent, xpForNext, challenges } = useAchievements();
  const weeklySessions = challenges
    .filter((challenge) => challenge.type === "weekly" && challenge.requirement.type === "weekly_sessions")
    .at(0)?.requirement.current ?? 0;

  return (
    <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/5 via-zinc-900 to-zinc-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sword size={16} className="text-violet-400" /> Hábitos RPG
        </CardTitle>
        <p className="text-xs text-zinc-500">
          Gamificación conectada al progreso registrado. Sin HP, oro ni recompensas ficticias.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-2">
            <Trophy size={14} className="mx-auto text-violet-400" />
            <p className="mt-1 font-black text-violet-300">Nv {level.level}</p>
            <p className="text-[11px] text-zinc-500">{xp} XP</p>
          </div>
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 p-2">
            <Flame size={14} className="mx-auto text-orange-400" />
            <p className="mt-1 font-black text-orange-300">{weeklySessions}</p>
            <p className="text-[11px] text-zinc-500">sesiones/sem</p>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/10 p-2">
            <Target size={14} className="mx-auto text-primary" />
            <p className="mt-1 font-black text-primary">{Math.round(progressPercent)}%</p>
            <p className="text-[11px] text-zinc-500">al próximo nivel</p>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold">Progreso de nivel</span>
            <Badge variant="accent">{xpForNext > 0 ? `${xpForNext} XP restantes` : "Nivel máximo"}</Badge>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
