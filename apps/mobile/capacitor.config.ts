import { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor — KINETIXFITT móvil (Android/iOS).
 *
 * Los builds nativos son wrappers online contra la app móvil desplegada.
 * El webDir contiene únicamente un shell mínimo para evitar empaquetar
 * imágenes, audio y vídeos de ejercicios dentro del APK/IPA.
 */
const serverUrl = process.env.CAPACITOR_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: "com.kinetixfitt.app",
  appName: "KINETIXFITT",
  webDir: "native-shell",
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          cleartext: false,
        },
      }
    : {}),
  android: {
    allowMixedContent: false,
  },
};

export default config;
