import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Star } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { getWhatsAppHref } from "@/lib/whatsapp";

const resources = [
  {id:"1", title:"Guía de Técnica: Sentadilla Perfecta", type:"Video", duration:"8 min", premium:true, thumb:"/exercises/free/Barbell_Bench_Press_-_Medium_Grip.webp"},
  {id:"2", title:"E-book: Nutrición para Hipertrofia", type:"PDF", duration:"24 pág", premium:true, thumb:"/exercises/free/Ab_Roller.webp"},
  {id:"3", title:"Checklist: Preparación de Comidas", type:"Guía", duration:"5 min", premium:false, thumb:"/exercises/free/Air_Bike.webp"},
  {id:"4", title:"Audio: Motivación Pre-Entreno", type:"Audio", duration:"12 min", premium:true, thumb:"/exercises/free/Alternate_Hammer_Curl.webp"},
];

export default function ResourcesPage(){
  const whatsappHref = getWhatsAppHref("Hola KinetixFitt, necesito ayuda con mis recursos.");
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div><h1 className="text-2xl font-display font-bold">Recursos VIP</h1><p className="text-sm text-zinc-500">Videos, guías y e-books exclusivos de KinetixFitt</p></div>
        <Badge variant="accent">VIP</Badge>
      </div>

      <Card className="bg-gradient-to-br from-primary/10 to-zinc-900 border-primary/20">
        <CardContent className="pt-4 flex gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-black"><Star size={20} fill="currentColor" /></div>
          <div><p className="font-bold">Acceso VIP completo</p><p className="text-xs text-zinc-500">{resources.length} recursos visibles • catálogo actual • acceso según tu plan</p></div>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {resources.map(r=>(
          <Card key={r.id} className="overflow-hidden hover:border-zinc-700 transition group">
            <div className="flex gap-3 p-3">
              <div className="w-20 h-20 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0 relative">
                <OptimizedImage src={r.thumb} alt={r.title} fill className="w-full h-full" sizes="80px" quality={80} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex gap-2 items-center"><Badge variant={r.premium?"accent":"muted"}>{r.type}</Badge><span className="text-xs text-zinc-500">{r.duration}</span>{r.premium && <span className="text-xs text-primary">• VIP</span>}</div>
                <p className="font-semibold text-sm mt-1 line-clamp-2">{r.title}</p>
                <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-zinc-500"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-zinc-600" />Contenido en preparación</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>¿Necesitás ayuda?</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          <Link href="/client/messages" className="flex-1"><Button variant="accent" className="w-full">Chatear con tu coach</Button></Link>
          {whatsappHref ? <a href={whatsappHref} target="_blank" rel="noreferrer" className="flex-1"><Button variant="outline" className="w-full">WhatsApp</Button></a> : null}
        </CardContent>
      </Card>
    </div>
  );
}
