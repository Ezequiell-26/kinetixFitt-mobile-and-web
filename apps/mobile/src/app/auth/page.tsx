'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin ? { email, password } : { name, email, password, role: 'CLIENT' };
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null) as { ok?: boolean; role?: string; error?: string } | null;
      if (!response.ok) throw new Error(data?.error || 'No se pudo completar la operación.');

      setSuccess(isLogin ? 'Sesión iniciada. Redirigiendo…' : 'Cuenta creada. Redirigiendo…');
      const destination = data?.role === 'TRAINER' ? '/trainer/dashboard' : '/client/dashboard';
      router.replace(destination);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo completar la operación.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#081119] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(52,211,153,0.10),transparent_32%),radial-gradient(circle_at_85%_90%,rgba(52,211,153,0.07),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:44px_44px] opacity-40" />

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden lg:flex flex-col justify-between border-r border-white/[0.06] p-12 xl:p-16">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-black font-black shadow-[0_10px_40px_rgba(52,211,153,0.22)]">K</div>
              <div>
                <p className="text-sm font-black tracking-[0.18em]">KINETIXFITT</p>
                <p className="text-[10px] font-semibold tracking-[0.16em] text-[#8193A5]">TU MEJOR VERSIÓN</p>
              </div>
            </div>

            <div className="mt-24 max-w-xl">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.04] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                <Sparkles size={12} /> Training intelligence
              </p>
              <h1 className="text-5xl font-black leading-[0.96] tracking-[-0.04em] xl:text-7xl">
                Entrená con estructura.
                <span className="block text-primary">Progresá con criterio.</span>
              </h1>
              <p className="mt-7 max-w-lg text-base leading-7 text-[#9AAABB] xl:text-lg">
                Un entorno único para entrenamientos, seguimiento, comunicación con tu coach y progreso medible.
              </p>

              <div className="mt-10 grid max-w-lg gap-3 sm:grid-cols-3">
                {[
                  ['Planes', 'Entrenamientos organizados'],
                  ['Progreso', 'Datos registrados'],
                  ['Coach', 'Seguimiento 1:1'],
                ].map(([title, text]) => (
                  <div key={title} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 backdrop-blur-xl">
                    <p className="text-sm font-black text-white">{title}</p>
                    <p className="mt-1 text-[11px] leading-5 text-[#8193A5]">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#617384]">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={13} className="text-primary" /> Sesión protegida</span>
            <span>kinetixfitt.com</span>
          </div>
        </section>

        <section className="flex items-center justify-center p-5 sm:p-8">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-black font-black">K</div>
                <div>
                  <p className="text-sm font-black tracking-[0.16em]">KINETIXFITT</p>
                  <p className="text-[9px] tracking-[0.16em] text-[#8193A5]">TU MEJOR VERSIÓN</p>
                </div>
              </div>
            </div>

            <Card className="overflow-hidden border-white/[0.08] bg-[#0B151E]/90 shadow-[0_30px_100px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
              <CardHeader className="space-y-4 p-6 sm:p-8">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.04] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                  <Lock size={11} /> Acceso seguro
                </div>
                <div>
                  <CardTitle className="text-3xl font-black tracking-[-0.03em]">{isLogin ? 'Volvé a tu rutina.' : 'Empezá tu camino.'}</CardTitle>
                  <p className="mt-2 text-sm leading-6 text-[#8193A5]">
                    {isLogin ? 'Entrá a tu espacio KinetixFitt y continuá donde lo dejaste.' : 'Creá tu cuenta y completá tu perfil para comenzar.'}
                  </p>
                </div>
              </CardHeader>

              <CardContent className="p-6 pt-0 sm:p-8 sm:pt-0">
                <form onSubmit={submit} className="space-y-4">
                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs font-bold uppercase tracking-[0.12em] text-[#9AAABB]">Nombre</Label>
                      <div className="relative">
                        <UserRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#617384]" />
                        <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="h-12 border-white/[0.08] bg-[#081119] pl-10" required minLength={2} maxLength={100} />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-[0.12em] text-[#9AAABB]">Email</Label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#617384]" />
                      <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 border-white/[0.08] bg-[#081119] pl-10" required maxLength={255} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-xs font-bold uppercase tracking-[0.12em] text-[#9AAABB]">Contraseña</Label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#617384]" />
                      <Input id="password" type={showPassword ? 'text' : 'password'} autoComplete={isLogin ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 border-white/[0.08] bg-[#081119] pl-10 pr-12" required minLength={isLogin ? 6 : 8} maxLength={128} />
                      <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-[#617384] transition hover:text-white">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {!isLogin && (
                    <p className="text-[11px] leading-5 text-[#8193A5]">
                      Usá al menos 8 caracteres con mayúscula, minúscula y número.
                    </p>
                  )}

                  {error && <div role="alert" className="rounded-xl border border-red-400/20 bg-red-400/[0.05] p-3 text-sm leading-5 text-red-200">{error}</div>}
                  {success && <div role="status" className="rounded-xl border border-primary/20 bg-primary/[0.05] p-3 text-sm leading-5 text-primary">{success}</div>}

                  <Button type="submit" variant="accent" className="mt-2 h-12 w-full font-black" disabled={loading}>
                    {loading ? 'Procesando…' : isLogin ? <>Ingresar <ArrowRight size={17} /></> : <>Crear cuenta <ArrowRight size={17} /></>}
                  </Button>
                </form>

                {isLogin && (
                  <div className="mt-4 text-right">
                    <Link href="/forgot-password" className="text-xs font-semibold text-[#8193A5] transition hover:text-primary">¿Olvidaste tu contraseña?</Link>
                  </div>
                )}

                <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-[0.14em] text-[#617384]">
                  <div className="h-px flex-1 bg-white/[0.06]" />
                  <span>Cuenta KinetixFitt</span>
                  <div className="h-px flex-1 bg-white/[0.06]" />
                </div>

                <div className="space-y-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-[11px] leading-5 text-[#8193A5]">
                  <p className="flex gap-2"><Check size={13} className="mt-0.5 shrink-0 text-primary" /> Tus entrenamientos y progreso quedan asociados a tu cuenta.</p>
                  <p className="flex gap-2"><Check size={13} className="mt-0.5 shrink-0 text-primary" /> No almacenamos datos de tarjetas en KinetixFitt.</p>
                </div>
              </CardContent>

              <CardFooter className="border-t border-white/[0.06] bg-white/[0.015] p-6 sm:px-8">
                <button type="button" onClick={() => { setIsLogin((value) => !value); setError(null); setSuccess(null); }} className="w-full text-center text-sm font-semibold text-[#9AAABB] transition hover:text-white">
                  {isLogin ? '¿Todavía no tenés una cuenta? Crear cuenta' : '¿Ya tenés una cuenta? Ingresar'}
                </button>
              </CardFooter>
            </Card>

            <p className="mt-5 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-[#617384]">KINETIXFITT © 2026 · TU MEJOR VERSIÓN</p>
          </motion.div>
        </section>
      </div>
    </main>
  );
}
