#!/usr/bin/env node
/**
 * KinetixFitt repository audit for coding agents.
 *
 * Goals:
 * - create a fresh, evidence-based snapshot before an AI changes code;
 * - inventory apps, packages, routes, schemas, tests and workflows;
 * - verify durable AI governance/ledger files exist;
 * - detect common regression/hallucination signals without requiring dependencies;
 * - distinguish observed facts from inferred/unknown state;
 * - never mutate product source code.
 *
 * Usage:
 *   node scripts/ai-repo-audit.mjs
 *   node scripts/ai-repo-audit.mjs --json
 *   node scripts/ai-repo-audit.mjs --strict
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const args = new Set(process.argv.slice(2));
const strict = args.has("--strict");
const jsonOnly = args.has("--json");

const IGNORE_DIRS = new Set([
  ".git", "node_modules", ".next", "dist", "build", "coverage", ".turbo", ".cache", ".vercel", "vendor", "target"
]);

const SOURCE_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".prisma", ".sql", ".yml", ".yaml", ".md"
]);

const HIGH_RISK_DIRS = [
  "/api/", "/prisma/", "/middleware", "/auth/", "/payments/", "/uploads/", "/storage/", "/native/", "/electron/", "/capacitor/", "/.github/workflows/"
];

const MUST_READ = [
  "AGENTS.md",
  ".ai/INDEX.md",
  ".ai/PROJECT_STATE.md",
  ".ai/AI_ENGINEERING_SYSTEM.md",
  ".ai/AI_CONTROL_CENTER.md",
  ".ai/FEATURE_LEDGER.md",
  ".ai/INTEGRATION_REGISTRY.md",
  ".ai/PERFORMANCE_BASELINES.md",
];

function exists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

function read(relPath) {
  try {
    return fs.readFileSync(path.join(ROOT, relPath), "utf8");
  } catch {
    return null;
  }
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (SOURCE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) out.push(full);
  }
  return out;
}

function rel(file) {
  return path.relative(ROOT, file).split(path.sep).join("/");
}

function git(command, gitArgs = []) {
  try {
    return execFileSync("git", [command, ...gitArgs], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 10000,
    }).trim();
  } catch {
    return null;
  }
}

function jsonFile(relPath) {
  const text = read(relPath);
  if (!text) return null;
  try { return JSON.parse(text); } catch { return null; }
}

function collectPackages() {
  const packageFiles = [];
  for (const candidate of ["package.json", "apps/mobile/package.json", "apps/web/package.json"]) {
    if (exists(candidate)) packageFiles.push(candidate);
  }
  const packagesDir = path.join(ROOT, "packages");
  if (fs.existsSync(packagesDir)) {
    for (const entry of fs.readdirSync(packagesDir, { withFileTypes: true })) {
      if (entry.isDirectory() && exists(`packages/${entry.name}/package.json`)) packageFiles.push(`packages/${entry.name}/package.json`);
    }
  }
  return packageFiles.map((file) => {
    const pkg = jsonFile(file) ?? {};
    return {
      file,
      name: pkg.name ?? null,
      version: pkg.version ?? null,
      scripts: Object.keys(pkg.scripts ?? {}),
      dependencies: Object.keys(pkg.dependencies ?? {}),
      devDependencies: Object.keys(pkg.devDependencies ?? {}),
    };
  });
}

function collectRoutes(files) {
  return files.filter((file) => /(^|\/)route\.(ts|tsx|js|jsx)$/.test(file) || /(^|\/)(page|layout)\.(ts|tsx|js|jsx)$/.test(file)).map(rel).sort();
}

function collectTests(files) {
  return files.filter((file) => /(test|spec)\.(ts|tsx|js|jsx)$/.test(file) || /(^|\/)tests?\//.test(rel(file))).map(rel).sort();
}

function collectSchemas(files) {
  return files.filter((file) => /(^|\/)schema\.prisma$|\.sql$/.test(file)).map(rel).sort();
}

function collectWorkflows() {
  const dir = path.join(ROOT, ".github", "workflows");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((name) => /\.(yml|yaml)$/.test(name)).sort();
}

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/.*$/gm, "$1")
    .replace(/^\s*#.*$/gm, "");
}

function grepSignals(files) {
  const signals = [];
  const patterns = [
    { key: "TODO", re: /\bTODO\b/g },
    { key: "FIXME", re: /\bFIXME\b/g },
    { key: "mock", re: /\b(mock|mocked|mocking)\b/gi },
    { key: "fake", re: /\b(fake|falso|simulado|demo login)\b/gi },
    { key: "placeholder", re: /placeholder/gi },
    { key: "any", re: /\bas\s+any\b|:\s*any\b/g },
    { key: "dangerous eval", re: /\beval\s*\(|new Function\s*\(/g },
    { key: "shell interpolation", re: /exec\s*\([^)]*\$\{|execSync\s*\([^)]*\$\{/g },
  ];
  for (const file of files) {
    const text = read(rel(file));
    if (!text) continue;
    const normalizedPath = `/${rel(file)}`;
    const highRisk = HIGH_RISK_DIRS.some((part) => normalizedPath.includes(part));
    const codeOnly = stripComments(text);
    for (const pattern of patterns) {
      const source = ["dangerous eval", "shell interpolation", "fake"].includes(pattern.key) ? codeOnly : text;
      const matches = source.match(pattern.re);
      if (matches?.length) signals.push({ file: rel(file), signal: pattern.key, count: matches.length, highRisk });
    }
  }
  return signals;
}

function collectEnvNames(files) {
  const names = new Set();
  for (const file of files) {
    const text = read(rel(file));
    if (!text) continue;
    for (const match of text.matchAll(/process\.env\.([A-Z][A-Z0-9_]*)/g)) names.add(match[1]);
    for (const match of text.matchAll(/process\.env\[\s*["'`]([A-Z][A-Z0-9_]*)["'`]\s*\]/g)) names.add(match[1]);
  }
  return [...names].sort();
}

function collectTrackedSecrets() {
  const output = git("ls-files", ["-z"]);
  if (!output) return [];
  return output.split("\0")
    .filter(Boolean)
    .filter((file) => /(^|\/)(\.env($|\.)|.*\.(pem|key|p12|pfx)$)/i.test(file))
    .filter((file) => !/(^|\/)\.env\.(example|sample|template)$/i.test(file));
}

function requiredChecks() {
  const missing = MUST_READ.filter((file) => !exists(file));
  const rootPkg = jsonFile("package.json") ?? {};
  const scripts = rootPkg.scripts ?? {};
  const checks = [
    { name: "root package.json", ok: exists("package.json") },
    { name: "AI constitution", ok: exists("AGENTS.md") },
    { name: "AI control system", ok: exists(".ai/AI_CONTROL_CENTER.md") },
    { name: "AI engineering system", ok: exists(".ai/AI_ENGINEERING_SYSTEM.md") },
    { name: "feature ledger", ok: exists(".ai/FEATURE_LEDGER.md") },
    { name: "integration registry", ok: exists(".ai/INTEGRATION_REGISTRY.md") },
    { name: "performance baselines", ok: exists(".ai/PERFORMANCE_BASELINES.md") },
    { name: "project state", ok: exists(".ai/PROJECT_STATE.md") },
    { name: "CI workflow", ok: exists(".github/workflows/ci.yml") },
    { name: "mobile package", ok: exists("apps/mobile/package.json") },
    { name: "web package", ok: exists("apps/web/package.json") },
    { name: "root typecheck script", ok: Boolean(scripts.typecheck) },
    { name: "root test script", ok: Boolean(scripts.test) },
    { name: "AI strict audit script", ok: Boolean(scripts["ai:audit:strict"]) },
  ];
  return { missing, checks };
}

const allFiles = walk(ROOT);
const packages = collectPackages();
const routes = collectRoutes(allFiles);
const tests = collectTests(allFiles);
const schemas = collectSchemas(allFiles);
const workflows = collectWorkflows();
const signals = grepSignals(allFiles);
const envNames = collectEnvNames(allFiles.filter((file) => /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(file)));
const trackedSensitive = collectTrackedSecrets();
const required = requiredChecks();

const branch = git("branch", ["--show-current"]) || "UNKNOWN_OR_DETACHED";
const commit = git("rev-parse", ["HEAD"]) || "UNKNOWN";
const status = git("status", ["--short"]) || "GIT_UNAVAILABLE";

const highRiskSignals = signals.filter((item) => item.highRisk && ["fake", "dangerous eval", "shell interpolation"].includes(item.signal));
const errors = [
  ...trackedSensitive.map((file) => `Tracked sensitive-looking file: ${file}`),
  ...highRiskSignals.map((item) => `High-risk signal ${item.signal} in ${item.file}`),
];

const snapshot = {
  generatedAt: new Date().toISOString(),
  evidence: "E2_STATIC",
  git: { branch, commit, workingTree: status, clean: status === "" },
  governance: { mustRead: MUST_READ, missing: required.missing },
  inventory: {
    sourceFileCount: allFiles.length,
    packages,
    routes,
    testFiles: tests,
    schemas,
    workflows,
    envNames,
  },
  durableMemory: {
    featureLedger: ".ai/FEATURE_LEDGER.md",
    integrationRegistry: ".ai/INTEGRATION_REGISTRY.md",
    performanceBaselines: ".ai/PERFORMANCE_BASELINES.md",
  },
  signals,
  errors,
  strictPass: errors.length === 0 && required.checks.every((check) => check.ok),
  notes: [
    "This audit is static evidence only; it does not prove provider, deployment, database, device, or production runtime behavior.",
    "Run repository quality gates after changes.",
    "Treat stale documentation as context, not proof.",
    "Comment-only mentions do not create high-risk fake/eval/shell findings; source-code findings remain blocking.",
    "Tracked .env.example/.env.sample/.env.template files are configuration templates, not secret material, and are excluded from the tracked-secret blocker.",
  ],
};

if (jsonOnly) {
  process.stdout.write(JSON.stringify(snapshot, null, 2) + "\n");
} else {
  console.log("KinetixFitt AI repository audit");
  console.log("================================");
  console.log(`Branch: ${branch}`);
  console.log(`Commit: ${commit}`);
  console.log(`Working tree: ${snapshot.git.clean ? "clean" : status}`);
  console.log(`Source/config files scanned: ${allFiles.length}`);
  console.log(`Packages: ${packages.length}`);
  console.log(`Routes/pages/layouts: ${routes.length}`);
  console.log(`Test files: ${tests.length}`);
  console.log(`Schemas/migrations: ${schemas.length}`);
  console.log(`CI workflows: ${workflows.length}`);
  console.log(`Environment variables referenced: ${envNames.length}`);
  console.log("");
  console.log("Governance");
  for (const check of required.checks) console.log(`${check.ok ? "[OK]" : "[FAIL]"} ${check.name}`);
  if (required.missing.length) console.log(`Missing: ${required.missing.join(", ")}`);
  console.log("\nRisk signals");
  if (!signals.length) console.log("[OK] No static signals matched the audit patterns.");
  else {
    for (const item of signals.slice(0, 100)) console.log(`[${item.highRisk ? "HIGH" : "INFO"}] ${item.signal}: ${item.file} (${item.count})`);
    if (signals.length > 100) console.log(`... ${signals.length - 100} additional signals omitted from terminal output.`);
  }
  console.log("\nBlocking findings");
  if (!errors.length) console.log("[OK] No blocking findings.");
  else for (const error of errors) console.log(`[BLOCK] ${error}`);
  console.log("\nResult");
  if (snapshot.strictPass) console.log("[PASS] Static AI guard passed. This is not runtime verification.");
  else console.log(`[BLOCK] ${errors.length} blocking finding(s). Fix or explicitly resolve before declaring the repository verified.`);
}

process.exitCode = strict && !snapshot.strictPass ? 1 : 0;
