"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60dvh] flex flex-col items-center justify-center gap-4 px-6 text-center" role="alert">
      <div className="grid h-14 w-14 place-items-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-amber-300">
        <AlertTriangle size={24} />
      </div>
      <div>
        <p className="text-lg font-black text-white">No pudimos cargar esta sección</p>
        <p className="mt-1 max-w-sm text-sm leading-6 text-[#8193A5]">
          La aplicación encontró un problema. Podés intentar cargar la pantalla nuevamente sin perder tu sesión.
        </p>
      </div>
      {process.env.NODE_ENV === "development" && error?.message && (
        <pre className="max-w-full overflow-auto rounded-xl border border-[#1C3142] bg-[#081119] p-3 text-left text-[11px] text-zinc-500">{error.message}</pre>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button onClick={reset} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-black text-[#081119] transition hover:bg-primary-hover">
          <RefreshCw size={15} /> Reintentar
        </button>
        <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#1C3142] bg-[#0B151E] px-5 text-sm font-bold text-white transition hover:border-primary/30">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
