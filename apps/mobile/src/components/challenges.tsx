"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, Clock3 } from "lucide-react";
import { useAchievements } from "@/hooks/use-achievements";

export function Challenges(){
  const { challenges } = useAchievements();

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-zinc-900 to-zinc-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy size={18} className="text-primary" /> Challenges
        </CardTitle>
        <p className="text-xs text-zinc-500">
          Desafíos personales calculados desde el progreso registrado de tu cuenta.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {challenges.map((challenge) => {
          const current = challenge.requirement.current ?? 0;
          const target = challenge.requirement.value;
          const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

          return (
            <div key={challenge.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-bold">
                    <Target size={12} className="text-primary" />
                    {challenge.icon} {challenge.name}
                    <Badge variant={challenge.completed ? "accent" : "muted"} className="text-[10px]">
                      {challenge.xp} XP
                    </Badge>
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">{challenge.description}</p>
                </div>
                <span className="rounded-full bg-zinc-800 px-2 py-1 text-xs font-mono">{pct}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                <span>{current} / {target}</span>
                <span className="inline-flex items-center gap-1">
                  <Clock3 size={11} /> {challenge.type === "weekly" ? "Esta semana" : "Este mes"}
                </span>
              </div>
            </div>
          );
        })}
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-500">
          El leaderboard global queda oculto hasta que exista una fuente de datos real y un endpoint con aislamiento por usuario.
        </div>
      </CardContent>
    </Card>
  );
}
