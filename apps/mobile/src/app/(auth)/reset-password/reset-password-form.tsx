"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const t = searchParams.get("token");
    if (!t) {
      setError("Token no proporcionado. Solicita un nuevo reseteo.");
    } else {
      setToken(t);
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (!token) {
      setError("Token inválido");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al resetear contraseña");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="max-w-md w-full p-8 bg-zinc-900 rounded-lg border border-zinc-800">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-lime-400 mb-4">
              ¡Contraseña actualizada!
            </h2>
            <p className="text-zinc-400 mb-4">
              Tu contraseña ha sido cambiada exitosamente.
            </p>
            <p className="text-zinc-500 text-sm">Redirigiendo al login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="max-w-md w-full p-8 bg-zinc-900 rounded-lg border border-zinc-800">
        <h2 className="text-2xl font-bold text-lime-400 mb-6 text-center">
          Resetear Contraseña
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Nueva Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:outline-none focus:border-lime-400"
              placeholder="Mínimo 6 caracteres"
              disabled={loading || !token}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Confirmar Contraseña
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:outline-none focus:border-lime-400"
              placeholder="Repite la contraseña"
              disabled={loading || !token}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-900/30 border border-red-800 rounded-md text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full py-3 bg-lime-400 hover:bg-lime-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-zinc-900 font-semibold rounded-md transition-colors"
          >
            {loading ? "Procesando..." : "Actualizar Contraseña"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/forgot-password"
            className="text-sm text-zinc-400 hover:text-lime-400 transition-colors"
          >
            ¿Necesitas otro token de reseteo?
          </Link>
        </div>

        <div className="mt-4 text-center">
          <Link
            href="/login"
            className="text-sm text-zinc-400 hover:text-lime-400 transition-colors"
          >
            Volver al login
          </Link>
        </div>
      </div>
    </div>
  );
}
