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
  "[tabindex]:not([tabindex=\"-1\"])"
].join(",");

export function NotificationsBell(){
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  async function load(){
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setNotifs(data);
      }
    } catch {}
  }

  useEffect(() => {
    let alive = true;
    const tick = () => {
      if (document.hidden || !navigator.onLine) return;
      if (alive) load();
    };
    load();
    const t = setInterval(tick, 30000);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("online", tick);
    return () => {
      alive = false;
      clearInterval(t);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("online", tick);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      triggerRef.current?.focus();
      return;
    }

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

  const unread = notifs.filter(n => !n.read).length;

  async function markAll(){
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      setNotifs(notifs.map(n => ({ ...n, read: true })));
    } catch {}
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition"
        aria-label={unread > 0 ? `Notificaciones, ${unread} sin leer` : "Notificaciones"}
        aria-expanded={open}
        aria-controls={NOTIFICATIONS_PANEL_ID}
        aria-haspopup="dialog"
      >
        <Bell size={18} className="text-zinc-300" aria-hidden="true" />
        {unread > 0 && (
          <span aria-hidden="true" className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-black text-[11px] font-black rounded-full flex items-center justify-center animate-pulse">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden="true" />
          <Card
            ref={panelRef}
            id={NOTIFICATIONS_PANEL_ID}
            role="dialog"
            aria-label="Notificaciones"
            aria-modal="true"
            className="absolute right-0 top-12 w-[340px] max-w-[90vw] z-40 shadow-2xl border-zinc-800 bg-zinc-950 max-h-[70vh] overflow-hidden flex flex-col"
          >
            <div className="p-3.5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <p className="font-bold text-sm text-white">Notificaciones</p>
              {unread > 0 && (
                <button type="button" onClick={markAll} className="text-xs text-primary hover:underline font-medium">
                  Marcar leídas
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-zinc-900" aria-live="polite">
              {notifs.length === 0 ? (
                <p className="text-xs text-zinc-500 p-8 text-center">No hay notificaciones todavía</p>
              ) : (
                notifs.map(n => {
                  const content = (
                    <div
                      key={n.id}
                      className={`p-3 flex gap-3 hover:bg-zinc-900/60 transition ${
                        !n.read ? "bg-primary/[0.04]" : ""
                      }`}
                      onClick={() => setOpen(false)}
                    >
                      <div
                        aria-hidden="true"
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          !n.read ? "bg-primary" : "bg-transparent"
                        }`}
                      />
                      <div className="flex-1 min-w-0 text-xs">
                        <p className="font-bold text-white truncate">{n.title}</p>
                        <p className="text-zinc-400 truncate mt-0.5">{n.body}</p>
                        <div className="flex items-center justify-between mt-1.5 text-[10px] text-zinc-500">
                          <span>
                            {new Date(n.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                          </span>
                          <Badge variant="muted" className="text-[9px] py-0 px-1.5">
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
        </>
      )}
    </div>
  );
}
