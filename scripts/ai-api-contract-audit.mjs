#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const API_ROOTS = [
  path.join(ROOT, 'apps', 'mobile', 'src', 'app', 'api'),
  path.join(ROOT, 'apps', 'web', 'src', 'app', 'api'),
  path.join(ROOT, 'apps', 'web', 'app', 'api'),
];
const routeFiles = [];
const missingRoots = [];
const issues = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name === 'route.ts' || entry.name === 'route.tsx') routeFiles.push(full);
  }
}

for (const root of API_ROOTS) {
  if (fs.existsSync(root)) walk(root);
  else missingRoots.push(path.relative(ROOT, root).replaceAll(path.sep, '/'));
}

for (const file of routeFiles) {
  const rel = path.relative(ROOT, file).replaceAll(path.sep, '/');
  const src = fs.readFileSync(file, 'utf8');
  const methods = [...src.matchAll(/export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS)/g)].map(m => m[1]);
  const mutation = methods.some(m => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(m));
  const hasZod = /from\s+['"]zod['"]|\bz\.[A-Za-z]+\(/.test(src);
  const hasAuthSignal = /auth|getServerSession|getSession|session|authorization|jwt|currentUser|require.*User/i.test(src);
  const hasOwnershipSignal = /owner|ownership|trainerId|athleteId|userId|clientId|authorize|forbidden|403/i.test(src);
  const hasExternalSignal = /fetch\(|axios|stripe|supabase|upstash|s3|nodemailer|web-push/i.test(src);
  const hasTryCatch = /\btry\s*\{/.test(src);

  if (methods.length === 0) issues.push(`${rel}: route file exports no recognized HTTP method`);
  if (mutation && !hasZod) issues.push(`${rel}: mutating route has no obvious Zod validation`);
  if (mutation && !hasAuthSignal) issues.push(`${rel}: mutating route has no obvious authentication boundary`);
  if (hasExternalSignal && !hasTryCatch) issues.push(`${rel}: external/provider signal without obvious try/catch boundary`);
  if (hasAuthSignal && !hasOwnershipSignal && !/auth/i.test(rel)) issues.push(`${rel}: protected-looking route lacks an obvious ownership/authorization signal`);
}

if (routeFiles.length === 0) {
  issues.push('No App Router API route files were discovered. Audit configuration/path may be broken.');
}

const report = {
  routeCount: routeFiles.length,
  routes: routeFiles.map(f => path.relative(ROOT, f).replaceAll(path.sep, '/')).sort(),
  missingRoots,
  issues,
  pass: issues.length === 0,
  note: 'This is a heuristic audit. It never replaces route-level tests or human/security review.'
};

console.log(JSON.stringify(report, null, 2));
if (process.argv.includes('--strict') && issues.length) process.exit(1);
