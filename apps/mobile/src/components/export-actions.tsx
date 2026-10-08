"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ExportActions() {
  const [status, setStatus] = useState<string | null>(null);

  async function exportData() {
    setStatus("Exportando…");
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type: "all", format: "csv" }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(body?.error || "No se pudieron exportar tus datos.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `kinetixfitt-progreso-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setStatus("Exportación lista.");
    } catch (cause) {
      setStatus(cause instanceof Error ? cause.message : "No se pudo exportar.");
    }
  }

  return (
    <Card className="border-dashed">
      <CardContent className="flex gap-2 pt-4">
        <Button variant="outline" size="sm" className="flex-1" onClick={exportData}>
          {status || "Descargar datos"}
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={() => window.print()}>
          Imprimir PDF
        </Button>
      </CardContent>
    </Card>
  );
}
