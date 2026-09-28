import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "KinetixFitt — Entrenamiento, progreso y coaching en un solo lugar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#05080B", color: "white", padding: 58, fontFamily: "Arial, sans-serif", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 560, height: 560, right: -120, top: -180, borderRadius: 9999, background: "radial-gradient(circle, rgba(52,211,153,.18), transparent 67%)" }} />
      <div style={{ position: "absolute", width: 520, height: 520, left: -230, bottom: -240, borderRadius: 9999, background: "radial-gradient(circle, rgba(90,130,255,.10), transparent 67%)" }} />
      <div style={{ position: "absolute", inset: 0, opacity: .45, backgroundImage: "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 16, zIndex: 1 }}>
        <div style={{ width: 48, height: 48, borderRadius: 15, background: "#34D399", display: "flex", alignItems: "center", justifyContent: "center", color: "#081119", fontSize: 24, fontWeight: 900 }}>K</div>
        <div style={{ display: "flex", flexDirection: "column" }}><div style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-.04em" }}>KINETIX<span style={{ color: "#34D399" }}>FITT</span></div><div style={{ marginTop: 3, fontSize: 11, fontWeight: 800, letterSpacing: ".22em", color: "#8193A5" }}>FITNESS PLATFORM</div></div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", zIndex: 1, marginTop: 8 }}>
        <div style={{ padding: "7px 14px", borderRadius: 999, border: "1px solid rgba(52,211,153,.25)", background: "rgba(52,211,153,.08)", color: "#34D399", fontSize: 12, fontWeight: 900, letterSpacing: ".14em" }}>TRAINING · PROGRESS · COACHING</div>
        <div style={{ marginTop: 23, fontSize: 68, lineHeight: .96, fontWeight: 900, letterSpacing: "-.055em", display: "flex", flexDirection: "column" }}><span>Entrená con estructura.</span><span style={{ color: "#34D399" }}>Progresá con criterio.</span></div>
        <div style={{ marginTop: 20, maxWidth: 820, fontSize: 20, lineHeight: 1.45, color: "#9AA7B2", fontWeight: 500 }}>Programación, sesiones, métricas, seguimiento y herramientas conectadas para atletas y coaches.</div>
      </div>
      <div style={{ display: "flex", gap: 10, zIndex: 1 }}>
        {["Programación", "Progreso", "KinetixFitt AI", "Comunidad"].map((item) => <div key={item} style={{ padding: "11px 15px", borderRadius: 999, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.035)", color: "#C4CDD4", fontSize: 13, fontWeight: 800 }}>{item}</div>)}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 5, background: "#34D399" }} />
    </div>,
    size,
  );
}
