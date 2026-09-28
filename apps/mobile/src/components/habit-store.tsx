"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, Star, Trophy, ShoppingBag } from "lucide-react";
import { useAchievements } from "@/hooks/use-achievements";

const REWARDS = [
  {id:"plan", name:"Plan Nutrición", cost:500, icon:Gift, desc:"Beneficio configurado por el coach"},
  {id:"video", name:"Video Análisis", cost:300, icon:Star, desc:"Revisión 1:1 configurada por el coach"},
  {id:"descuento", name:"10% Off", cost:1000, icon:Trophy, desc:"Beneficio comercial configurable"},
  {id:"merch", name:"Merch KINETIXFITT", cost:2000, icon:ShoppingBag, desc:"Producto sujeto a disponibilidad"},
];

export function HabitStore(){
  const { xp } = useAchievements();

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-zinc-900 to-zinc-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift size={18} className="text-primary" /> Recompensas
          <Badge variant="accent">{xp} XP</Badge>
        </CardTitle>
        <p className="text-xs text-zinc-500">
          Tu XP se muestra desde la cuenta. Los canjes quedan bloqueados hasta conectar un catálogo y un endpoint de recompensas reales.
        </p>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        {REWARDS.map((reward) => {
          const Icon = reward.icon;
          const canAfford = xp >= reward.cost;
          return (
            <div
              key={reward.id}
              className={`rounded-xl border p-3 text-center ${
                canAfford ? "border-zinc-800 bg-zinc-900" : "border-zinc-800 bg-zinc-900/50 opacity-70"
              }`}
            >
              <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl ${
                canAfford ? "bg-primary text-black" : "bg-zinc-800 text-zinc-500"
              }`}>
                <Icon size={18} />
              </div>
              <p className="mt-1 text-xs font-bold">{reward.name}</p>
              <p className="text-[11px] text-zinc-500">{reward.desc}</p>
              <p className="mt-1 text-xs font-mono">{reward.cost} XP</p>
              <div className="mt-2 rounded-lg bg-zinc-800 px-2 py-1.5 text-[10px] font-semibold text-zinc-400">
                Canje no disponible todavía
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
