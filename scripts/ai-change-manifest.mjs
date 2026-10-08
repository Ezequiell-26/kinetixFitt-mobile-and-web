#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const MANIFEST = path.join(ROOT, '.ai', 'CHANGE_MANIFEST.json');
const args = new Set(process.argv.slice(2));

function die(message) {
  console.error(`AI CHANGE MANIFEST: ${message}`);
  process.exit(1);
}

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) { die(`cannot read ${file}: ${error.message}`); }
}

function runGit(...gitArgs) {
  try { return execFileSync('git', gitArgs, { cwd: ROOT, encoding: 'utf8' }).trim(); }
  catch (error) { die(`git ${gitArgs.join(' ')} failed: ${error.message}`); }
}

function globToRegExp(glob) {
  const escaped = glob.split('**').map(part => part.split('*').map(s => s.replace(/[.+^${}()|[\]\\]/g, '\\$&')).join('[^/]*')).join('.*');
  return new RegExp(`^${escaped}$`);
}

function matches(file, patterns = []) {
  return patterns.some(pattern => globToRegExp(pattern).test(file));
}

const manifest = readJson(MANIFEST);
if (manifest.version !== 1) die(`unsupported manifest version: ${manifest.version}`);
if (!Array.isArray(manifest.allowedPaths) || manifest.allowedPaths.length === 0) die('allowedPaths must be a non-empty array');
if (!Array.isArray(manifest.requiredChecks) || manifest.requiredChecks.length === 0) die('requiredChecks must be a non-empty array');

const baseRef = process.env.AI_CHANGE_BASE || 'HEAD^1';
const headRef = process.env.AI_CHANGE_HEAD || 'HEAD';
let changes;
if (args.has('--working-tree')) {
  changes = runGit('status', '--porcelain', '--untracked-files=all')
    .split('\n').filter(Boolean)
    .map(line => ({
      status: line.slice(0, 2).trim() || '??',
      file: line.slice(3),
    }));
} else {
  changes = runGit('diff', '--name-status', `${baseRef}..${headRef}`)
    .split('\n').filter(Boolean)
    .map(line => {
      const parts = line.split('\t');
      return {
        status: parts[0],
        file: parts.length > 2 && /^[RC]/.test(parts[0]) ? parts[parts.length - 1] : parts[1],
      };
    });
}
const changed = changes.map(change => change.file).filter(Boolean);
const deleted = new Set(changes.filter(change => change.status === 'D').map(change => change.file));

const ignored = changed.filter(file => matches(file, ['.git/**']));
const effective = changed.filter(file => !ignored.includes(file));
const outside = effective.filter(file => !matches(file, manifest.allowedPaths));
const forbidden = effective.filter(file => !deleted.has(file) && matches(file, manifest.forbiddenPaths ?? []));
const highRisk = effective.filter(file => matches(file, manifest.highRiskPathsRequireExplicitApproval ?? []));
const explicitApproval = manifest.approvedHighRisk === true;

const report = {
  version: manifest.version,
  task: manifest.task,
  baseRef,
  headRef,
  changedFiles: effective,
  outsideAllowedPaths: outside,
  forbiddenFiles: forbidden,
  highRiskFiles: highRisk,
  highRiskApproved: explicitApproval,
  requiredChecks: manifest.requiredChecks,
  pass: outside.length === 0 && forbidden.length === 0 && (highRisk.length === 0 || explicitApproval)
};

console.log(JSON.stringify(report, null, 2));

if (!report.pass) {
  if (outside.length) console.error(`Files outside allowedPaths: ${outside.join(', ')}`);
  if (forbidden.length) console.error(`Forbidden files changed: ${forbidden.join(', ')}`);
  if (highRisk.length && !explicitApproval) console.error(`High-risk files changed without approvedHighRisk=true: ${highRisk.join(', ')}`);
  process.exit(1);
}
