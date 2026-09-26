"use client";
import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type Notif = {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  link: string | null;
  createdAt: string;
};

const NOTIFICATIONS_PANEL_ID = "kinetixfitt-notifications-panel";
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex=\"-1\"])",
].join(",");

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(false);

  async function load(signal?: AbortSignal) {
    try {
      const res = await fetch("/api/notifications", { signal });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && !signal?.aborted) setNotifs(data);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    const tick = () => {
      if (document.hidden || !navigator.onLine) return;
      void load(controller.signal);
    };
    void load(controller.signal);
    const t = setInterval(tick, 30000);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("online", tick);
    return () => {
      controller.abort();
      clearInterval(t);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("online", tick);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      if (wasOpenRef.current) triggerRef.current?.focus();
      wasOpenRef.current = false;
      return;
    }

    wasOpenRef.current = true;
    const panel = panelRef.current;
    if (!panel) return;
    const focusables = () => Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    focusables()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const unread = notifs.filter((n) => !n.read).length;

  async function markAll() {
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) return;
      setNotifs((current) => current.map((n) => ({ ...n, read: true })));
    } catch {}
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="relative rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 transition hover:border-zinc-700"
        aria-label={unread > 0 ? `Notificaciones, ${unread} sin leer` : "Notificaciones"}
        aria-expanded={open}
        aria-controls={NOTIFICATIONS_PANEL_ID}
        aria-haspopup="dialog"
      >
        <Bell size={18} className="text-zinc-300" aria-hidden="true" />
        {unread > 0 && (
          <span aria-hidden="true" className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-black text-black animate-pulse">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden="true" />
          <div ref={panelRef}>
            <Card
              id={NOTIFICATIONS_PANEL_ID}
              role="dialog"
              aria-label="Notificaciones"
              aria-modal="true"
              className="absolute right-0 top-12 z-40 flex max-h-[70vh] w-[340px] max-w-[90vw] flex-col overflow-hidden border-zinc-800 bg-zinc-950 shadow-2xl"
            >
            <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 p-3.5">
              <p className="text-sm font-bold text-white">Notificaciones</p>
              {unread > 0 && (
                <button type="button" onClick={markAll} className="text-xs font-medium text-primary hover:underline">
                  Marcar leídas
                </button>
              )}
            </div>

            <div className="flex-1 divide-y divide-zinc-900 overflow-y-auto" aria-live="polite">
              {notifs.length === 0 ? (
                <p className="p-8 text-center text-xs text-zinc-500">No hay notificaciones todavía</p>
              ) : (
                notifs.map((n) => {
                  const content = (
                    <div
                      key={n.id}
                      className={`flex gap-3 p-3 transition hover:bg-zinc-900/60 ${!n.read ? "bg-primary/[0.04]" : ""}`}
                      onClick={() => setOpen(false)}
                    >
                      <div
                        aria-hidden="true"
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${!n.read ? "bg-primary" : "bg-transparent"}`}
                      />
                      <div className="min-w-0 flex-1 text-xs">
                        <p className="truncate font-bold text-white">{n.title}</p>
                        <p className="mt-0.5 truncate text-zinc-400">{n.body}</p>
                        <div className="mt-1.5 flex items-center justify-between text-[10px] text-zinc-500">
                          <span>{new Date(n.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}</span>
                          <Badge variant="muted" className="px-1.5 py-0 text-[9px]">
                            {n.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );

                  return n.link ? (
                    <Link key={n.id} href={n.link}>
                      {content}
                    </Link>
                  ) : (
                    content
                  );
                })
              )}
            </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
