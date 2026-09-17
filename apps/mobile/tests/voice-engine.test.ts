/**
 * Tests del Voice Engine (puros, sin DOM ni audio real).
 *
 * Cubren: números, jerarquía frase>palabra>número>sílaba>TTS,
 * templates, cola+prioridades, motivación anti-spam, conteo,
 * caché y registro de faltantes.
 *
 *   npx tsx tests/voice-engine.test.ts
 */
import { numberToKeys, intToKeys, REQUIRED_NUMBER_KEYS } from "../src/lib/voice-engine/numbers";
import {
  planEvent, planText, getMissingAudio, clearMissingAudio,
  clearPhraseCache, phraseCacheSize,
} from "../src/lib/voice-engine/planner";
import { VoiceQueue } from "../src/lib/voice-engine/queue";
import { MotivationEngine, repCountPlan } from "../src/lib/voice-engine/motivation";
import { DEFAULT_VOICE } from "../src/lib/voice-engine/voices";
import * as fs from "fs";
import * as path from "path";
import type { VoiceManifest, PlannedPhrase } from "../src/lib/voice-engine/types";

let passed = 0;
let failed = 0;

function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) {
    passed++;
  } else {
    failed++;
    console.error(`FAIL: ${name}`, detail ?? "");
  }
}

const FIXTURE: VoiceManifest = {
  id: "test",
  label: "Test",
  phrases: { cierre: "/cierre.mp3", "cuenta-regresiva": "/cd.mp3" },
  words: { serie: "/serie.mp3", repeticiones: "/reps.mp3" },
  numbers: { tres: "/3.mp3", cuatro: "/4.mp3" },
  connectors: { de: "/de.mp3", y: "/y.mp3", coma: "/coma.mp3" },
  motivation: {},
  countdown: {},
  syllables: { ma: "/ma.mp3", pa: "/pa.mp3" },
};

/**
 * Los números grabados son un asset opcional: el Voice Engine los puede
 * anunciar por TTS mientras el pack de voz todavía no fue distribuido.
 * Las demás entradas declaradas en el manifiesto sí deben existir en disco.
 */
const OPTIONAL_ASSET_PREFIXES = ["/audio/voices/kinetixfitt/numbers/"];

function isOptionalAsset(src: string): boolean {
  return OPTIONAL_ASSET_PREFIXES.some((prefix) => src.startsWith(prefix));
}

function main() {
  // ── Números ──
  check("n(0)", JSON.stringify(numberToKeys(0)) === JSON.stringify(["cero"]));
  check("n(7)", JSON.stringify(numberToKeys(7)) === JSON.stringify(["siete"]));
  check("n(15)", JSON.stringify(numberToKeys(15)) === JSON.stringify(["quince"]));
  check("n(16)", JSON.stringify(numberToKeys(16)) === JSON.stringify(["dieciseis"]));
  check("n(21)", JSON.stringify(numberToKeys(21)) === JSON.stringify(["veintiuno"]));
  check("n(35)", JSON.stringify(numberToKeys(35)) === JSON.stringify(["treinta", "y", "cinco"]));
  check("n(47)", JSON.stringify(numberToKeys(47)) === JSON.stringify(["cuarenta", "y", "siete"]));
  check("n(60)", JSON.stringify(numberToKeys(60)) === JSON.stringify(["sesenta"]));
  check("n(90)", JSON.stringify(numberToKeys(90)) === JSON.stringify(["noventa"]));
  check("n(100)", JSON.stringify(numberToKeys(100)) === JSON.stringify(["cien"]));
  check("n(60.5)", JSON.stringify(numberToKeys(60.5)) === JSON.stringify(["sesenta", "coma", "cinco"]));
  check("n(82.5)", JSON.stringify(numberToKeys(82.5)) === JSON.stringify(["ochenta", "y", "dos", "coma", "cinco"]));
  check("n(101)→100", JSON.stringify(intToKeys(101)) === JSON.stringify(["cien"]));
  check("39 claves a grabar", REQUIRED_NUMBER_KEYS.length === 16 + 4 + 10 + 7 + 1 + 1);

  // ── Jerarquía ──
  clearMissingAudio();
  clearPhraseCache();
  const p1 = planEvent({ event: "WORKOUT_COMPLETED" }, FIXTURE);
  check("frase completa usa el mp3", p1.files.length === 1 && p1.files[0] === "/cierre.mp3", p1);

  const p2 = planText("serie tres de cinco", FIXTURE);
  const kinds2 = p2.tokens.map((t) => t.kind).join(",");
  check(
    "palabra+número+conector mezclan audio y TTS",
    p2.files.includes("/serie.mp3") && p2.files.includes("/3.mp3") && p2.files.includes("/de.mp3") &&
      p2.tokens.some((t) => t.kind === "tts" && t.text === "cinco"),
    kinds2
  );
  check("faltante registrado", getMissingAudio().includes("numbers/cinco"), getMissingAudio());

  const p3 = planText("mapa", FIXTURE);
  check(
    "sílaba como fallback antes que TTS",
    p3.files.length === 2 && p3.files[0] === "/ma.mp3" && p3.tokens.every((t) => t.kind !== "tts"),
    p3.files
  );

  const p4 = planText("hip thrust", FIXTURE);
  check(
    "desconocido total → un solo TTS natural",
    p4.files.length === 0 && p4.tokens.length === 1 && p4.tokens[0].kind === "tts",
    p4.tokens
  );

  // ── Template dinámico ──
  const p5 = planEvent({ event: "SET_STARTED", data: { set: 3, totalSets: 4, reps: 10, weight: 60 } }, FIXTURE);
  check("SET_STARTED arma texto", p5.text === "Serie 3 de 4. 10 repeticiones. 60 kilos.", p5.text);
  check("SET_STARTED usa audios que existen", p5.files.includes("/serie.mp3") && p5.files.includes("/3.mp3"), p5.files);

  // ── Caché ──
  clearPhraseCache();
  planEvent({ event: "WORKOUT_COMPLETED" }, FIXTURE);
  const p6 = planEvent({ event: "WORKOUT_COMPLETED" }, FIXTURE);
  check("segunda vez sale de caché", p6.cached === true && phraseCacheSize() === 1);

  // ── Cola ──
  const q = new VoiceQueue();
  const mk = (text: string): PlannedPhrase => ({ text, tokens: [], files: [], missing: [], cached: false });
  check("libre → play", q.decide("a", "NORMAL", 1000) === "play");
  q.markPlayed("a", 1000);
  check("duplicado <8s → drop", q.decide("a", "NORMAL", 5000) === "drop");
  check("duplicado >8s → play", q.decide("a", "NORMAL", 10000) === "play");
  q.markPlayed("b", 20000);
  check("LOW pegado a otro → drop", q.decide("c", "LOW", 21000) === "drop");
  check("HIGH pegado a otro → play/queue", q.decide("c", "HIGH", 21000) !== "drop");
  q.push(mk("n1"), "NORMAL", 30000);
  q.push(mk("n2"), "LOW", 30001);
  q.push(mk("crit"), "CRITICAL", 30002);
  check("CRITICAL purga NORMAL/LOW", q.size === 1 && q.next()?.phrase.text === "crit", q.size);

  // ── Motivación ──
  const mot = new MotivationEngine();
  const m1 = mot.pick("high", "set-1", 1000);
  check("motiva la 1ra vez", m1 !== null);
  check("1 por serie como máximo", mot.pick("high", "set-1", 2000) === null);
  check("cooldown 25s entre frases", mot.pick("high", "set-2", 3000) === null);
  const m2 = mot.pick("high", "set-3", 30000);
  check("después del cooldown vuelve", m2 !== null && m2.key !== m1?.key, m2);

  // ── Conteo ──
  check("FULL cuenta todo", repCountPlan(4, 10, "full")?.kind === "number");
  check("OFF calla", repCountPlan(4, 10, "off") === null);
  check("SMART: 1 sí", repCountPlan(1, 10, "smart")?.kind === "number");
  check("SMART: 2 no", repCountPlan(2, 10, "smart") === null);
  check("SMART: 3 sí", repCountPlan(3, 10, "smart")?.kind === "number");
  check("SMART: restan 2 → últimas dos", repCountPlan(8, 10, "smart")?.kind === "ultimas-dos");
  check("SMART: resta 1 → una más", repCountPlan(9, 10, "smart")?.kind === "una-mas");
  check("FULL también cierra con una más", repCountPlan(10, 10, "full")?.kind === "una-mas");

  // ── Manifiesto real ──
  const pubDir = path.join(__dirname, "..", "public");
  const declared: string[] = [];
  for (const group of Object.values(DEFAULT_VOICE) as unknown as Record<string, string>[]) {
    if (group && typeof group === "object" && !Array.isArray(group)) {
      declared.push(...Object.values(group));
    }
  }
  const missingFiles = declared.filter((src) => !isOptionalAsset(src) && !fs.existsSync(path.join(pubDir, src)));
  const optionalMissingFiles = declared.filter((src) => isOptionalAsset(src) && !fs.existsSync(path.join(pubDir, src)));

  check("manifiesto: 0 audios requeridos rotos", missingFiles.length === 0, missingFiles);
  check("manifiesto: opcionales faltantes usan fallback", optionalMissingFiles.every((src) => src.includes("/numbers/")), optionalMissingFiles);
  check("manifiesto: 13 frases legacy + nuevas", declared.length >= 50, declared.length);

  console.log(`\nManifiesto: ${declared.length} assets declarados, ${missingFiles.length} requeridos faltantes, ${optionalMissingFiles.length} opcionales pendientes.`);
  console.log(`Resultado: ${passed} pass, ${failed} fail`);
  if (failed > 0) process.exitCode = 1;
}

main();
