import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextDir = path.join(APP_ROOT, ".next");
const standaloneApp = path.join(nextDir, "standalone", "apps", "mobile");

function copyRequired(source, destination) {
  if (!fs.existsSync(source)) {
    throw new Error(`Required build asset not found: ${source}`);
  }
  fs.rmSync(destination, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true });
}

if (!fs.existsSync(path.join(standaloneApp, "server.js"))) {
  throw new Error(
    `Next standalone server was not generated at ${path.join(standaloneApp, "server.js")}. Check output: "standalone".`,
  );
}

copyRequired(
  path.join(nextDir, "static"),
  path.join(standaloneApp, ".next", "static"),
);

const publicDir = path.join(APP_ROOT, "public");
if (fs.existsSync(publicDir)) {
  copyRequired(publicDir, path.join(standaloneApp, "public"));
}

console.log("[standalone] copied .next/static and public into the runnable standalone package");
