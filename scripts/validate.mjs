/**
 * Registry validation — run on every pull request. Fails loudly with every
 * problem it finds rather than stopping at the first.
 *
 * Checks:
 *  - registry.json parses, has a `plugins` array, no duplicate ids
 *  - every registry entry has id/name/version, a valid id shape, and
 *    known permissions only
 *  - every entry's folder exists with a manifest.json whose id/version/name
 *    match the registry listing; the entry module and any extra `files` exist
 *  - every folder under plugins/ is listed in the registry (no orphans)
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;
const KNOWN_PERMISSIONS = new Set([
  "books:read",
  "books:write",
  "collections:read",
  "collections:write",
  "annotations:read",
  "annotations:write",
  "reading:read",
  "vocabulary:read",
  "vocabulary:write",
  "conversations:read",
  "agent:tools",
  "service:network",
  "service:llm",
  "service:dictionary",
  "service:clipboard",
]);

const problems = [];
const problem = (message) => problems.push(message);

let registry;
try {
  registry = JSON.parse(readFileSync(join(ROOT, "registry.json"), "utf8"));
} catch (error) {
  console.error(`registry.json is not valid JSON: ${error.message}`);
  process.exit(1);
}
if (!Array.isArray(registry.plugins)) {
  console.error("registry.json must have a top-level plugins array");
  process.exit(1);
}

const seen = new Set();
for (const entry of registry.plugins) {
  const label = `registry entry "${entry?.id ?? "?"}"`;
  if (typeof entry !== "object" || entry === null) {
    problem("registry.plugins contains a non-object entry");
    continue;
  }
  for (const field of ["id", "name", "version"]) {
    if (typeof entry[field] !== "string" || entry[field].trim() === "") {
      problem(`${label}: missing required field "${field}"`);
    }
  }
  if (typeof entry.id !== "string" || !ID_PATTERN.test(entry.id)) {
    problem(`${label}: id must be lowercase letters, digits, and hyphens (max 64 chars)`);
    continue;
  }
  if (seen.has(entry.id)) problem(`${label}: duplicate id`);
  seen.add(entry.id);

  for (const permission of entry.permissions ?? []) {
    if (!KNOWN_PERMISSIONS.has(permission)) {
      problem(`${label}: unknown permission "${permission}"`);
    }
  }

  const dir = join(ROOT, "plugins", entry.id);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    problem(`${label}: plugins/${entry.id}/ folder is missing`);
    continue;
  }

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
  } catch (error) {
    problem(`plugins/${entry.id}/manifest.json is missing or invalid: ${error.message}`);
    continue;
  }
  if (manifest.id !== entry.id) {
    problem(`plugins/${entry.id}: manifest.id "${manifest.id}" does not match the folder`);
  }
  if (manifest.version !== entry.version) {
    problem(
      `plugins/${entry.id}: manifest.version "${manifest.version}" does not match registry "${entry.version}"`,
    );
  }
  if (manifest.name !== entry.name) {
    problem(
      `plugins/${entry.id}: manifest.name "${manifest.name}" does not match registry "${entry.name}"`,
    );
  }
  const declared = JSON.stringify([...(manifest.permissions ?? [])].sort());
  const listed = JSON.stringify([...(entry.permissions ?? [])].sort());
  if (declared !== listed) {
    problem(`plugins/${entry.id}: registry permissions must equal manifest.permissions`);
  }

  const main = typeof manifest.main === "string" ? manifest.main : "main.js";
  for (const file of [main, ...(entry.files ?? [])]) {
    if (
      typeof file !== "string" ||
      file.includes("..") ||
      file.startsWith("/") ||
      file.includes("\\")
    ) {
      problem(`plugins/${entry.id}: illegal file reference "${file}"`);
      continue;
    }
    if (!existsSync(join(dir, file))) {
      problem(`plugins/${entry.id}: listed file "${file}" does not exist`);
    }
  }
}

for (const folder of readdirSync(join(ROOT, "plugins"))) {
  if (folder.startsWith(".")) continue;
  if (!seen.has(folder)) {
    problem(`plugins/${folder}/ exists but is not listed in registry.json`);
  }
}

if (problems.length > 0) {
  console.error(`Validation failed with ${problems.length} problem(s):\n`);
  for (const message of problems) console.error(`  - ${message}`);
  process.exit(1);
}
console.log(`OK — ${registry.plugins.length} plugin(s) validated.`);
