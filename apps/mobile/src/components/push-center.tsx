"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, Dumbbell, ClipboardCheck, MessageCircle, Loader2, AlertCircle } from "lucide-react";

type PreferenceType = "workout_reminder" | "checkin_reminder" | "coach_message";

type PreferenceResponse = {
  enabled?: boolean;
  types?: string[];
  channels?: { push?: boolean };
};

function base64UrlToUint8Array(base64UrlData: string) {
  const padding = "=".repeat((4 - (base64UrlData.length % 4)) % 4);
  const base64 = (base64UrlData + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}

async function getServiceWorkerRegistration() {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.getRegistration("/") ?? navigator.serviceWorker.register("/sw.js");
}

export function PushCenter() {
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("default");
  const [enabled, setEnabled] = useState(false);
  const [preferences, setPreferences] = useState<Record<PreferenceType, boolean>>({
    workout_reminder: true,
    checkin_reminder: true,
    coach_message: true,
  });
  const [busy, setBusy] = useState(false);
  const [savingType, setSavingType] = useState<PreferenceType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      try {
        const response = await fetch("/api/notification-preferences", { credentials: "same-origin", cache: "no-store" });
        if (response.ok) {
          const data = (await response.json()) as PreferenceResponse;
          const types = new Set(data.types ?? []);
          if (mounted) {
            setPreferences({
              workout_reminder: types.has("workout_reminder"),
              checkin_reminder: types.has("checkin_reminder"),
              coach_message: types.has("coach_message"),
            });
            setEnabled(Boolean(data.enabled && data.channels?.push !== false));
          }
        }
      } catch {
        // Push remains usable even if preference hydration temporarily fails.
      }

      if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        if (mounted) setPerm("unsupported");
        return;
      }
      if (mounted) setPerm(Notification.permission);
      if (Notification.permission !== "granted") return;

      try {
        const registration = await getServiceWorkerRegistration();
        const subscription = await registration?.pushManager.getSubscription();
        if (mounted && subscription) setEnabled(true);
      } catch {
        // Server preference is still retained.
      }
    }

    void hydrate();
    return () => { mounted = false; };
  }, []);

  async function persistPreferences(next: Record<PreferenceType, boolean>, pushEnabled = enabled) {
    const types = (Object.entries(next) as [PreferenceType, boolean][])
      .filter(([, active]) => active)
      .map(([type]) => type);

    const response = await fetch("/api/notification-preferences", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enabled: pushEnabled,
        channels: { push: pushEnabled },
        types,
      }),
    });
    if (!response.ok) throw new Error("No se pudieron guardar las preferencias");
  }

  async function togglePreference(type: PreferenceType) {
    if (savingType || !enabled) return;
    const next = { ...preferences, [type]: !preferences[type] };
    setPreferences(next);
    setSavingType(type);
    setError(null);
    try {
      await persistPreferences(next);
    } catch (cause) {
      setPreferences(preferences);
      setError(cause instanceof Error ? cause.message : "No se pudo guardar la preferencia");
    } finally {
      setSavingType(null);
    }
  }

  async function enable() {
    setError(null);
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setError("Este navegador no admite notificaciones push.");
      return;
    }

    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      setPerm(permission);
      if (permission !== "granted") return;

      const keyResponse = await fetch("/api/push/public-key", { credentials: "same-origin", cache: "no-store" });
      if (!keyResponse.ok) throw new Error("Push no configurado en el servidor");
      const { publicKey } = (await keyResponse.json()) as { publicKey?: string };
      if (!publicKey) throw new Error("Falta la clave pública VAPID");

      const registration = await getServiceWorkerRegistration();
      if (!registration) throw new Error("No se pudo registrar el Service Worker");

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64UrlToUint8Array(publicKey),
        });
      }

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });
      if (!response.ok) throw new Error("No se pudo guardar la suscripción");

      await persistPreferences(preferences, true);
      setEnabled(true);
      try {
        await registration.showNotification("KINETIXFITT", {
          body: "Notificaciones activadas. Te avisaremos de entrenos, check-ins y mensajes.",
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
          data: { url: "/client/dashboard" },
        });
      } catch {
        // Subscription is valid even when a direct test notification is blocked.
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudieron activar las notificaciones");
      setEnabled(false);
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setError(null);
    try {
      const registration = await getServiceWorkerRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) await subscription.unsubscribe();
      await persistPreferences(preferences, false);
      setEnabled(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudieron desactivar las notificaciones");
    } finally {
      setBusy(false);
    }
  }

  const unavailable = perm === "unsupported";

  return (
    <Card className={enabled ? "border-emerald-500/20 bg-emerald-500/5" : "border-zinc-800"}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell size={16} className={enabled ? "text-emerald-400" : "text-zinc-400"} aria-hidden="true" />
          Push Notificaciones
          <Badge variant={enabled ? "accent" : "muted"}>{enabled ? "Activas" : "Inactivas"}</Badge>
        </CardTitle>
        <p className="text-xs text-zinc-500">Controlá qué avisos querés recibir y mantené el resto en silencio.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-2 text-xs">
          {([
            ["workout_reminder", <Dumbbell key="workout" size={14} className="text-primary" aria-hidden="true" />, "Entreno de hoy"],
            ["checkin_reminder", <ClipboardCheck key="checkin" size={14} className="text-primary" aria-hidden="true" />, "Check-in pendiente"],
            ["coach_message", <MessageCircle key="message" size={14} className="text-primary" aria-hidden="true" />, "Nuevo mensaje de tu coach"],
          ] as const).map(([type, icon, label]) => (
            <label key={type} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-3">
              <span className="flex items-center gap-2">{icon} {label}</span>
              <span className="flex items-center gap-2">
                {savingType === type && <Loader2 size={12} className="animate-spin text-zinc-500" aria-hidden="true" />}
                <input
                  type="checkbox"
                  checked={preferences[type]}
                  onChange={() => void togglePreference(type)}
                  disabled={!enabled || savingType !== null}
                  aria-label={label}
                  className="accent-primary"
                />
              </span>
            </label>
          ))}
        </div>

        {error && (
          <p className="flex items-center gap-2 rounded-xl border border-red-400/15 bg-red-400/5 p-3 text-xs text-red-300" role="alert">
            <AlertCircle size={14} aria-hidden="true" /> {error}
          </p>
        )}

        {unavailable ? (
          <p className="text-xs text-center text-zinc-500">Este navegador no admite notificaciones push.</p>
        ) : enabled ? (
          <div className="space-y-2">
            <p className="flex items-center justify-center gap-1 text-center text-xs text-emerald-400"><Check size={12} aria-hidden="true" /> Notificaciones activas incluso con la app cerrada</p>
            <Button variant="ghost" className="w-full text-xs" onClick={() => void disable()} disabled={busy}>
              {busy ? <Loader2 size={13} className="mr-2 animate-spin" aria-hidden="true" /> : null}
              Desactivar notificaciones
            </Button>
          </div>
        ) : (
          <Button variant="accent" className="w-full" onClick={() => void enable()} disabled={busy}>
            {busy ? <Loader2 size={14} className="mr-2 animate-spin" aria-hidden="true" /> : <Bell size={14} className="mr-2" aria-hidden="true" />}
            {busy ? "Activando…" : "Activar notificaciones"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}