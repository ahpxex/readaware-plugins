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
 *  - theme/font declarations (`ui:themes`) pass the same grammars the app
 *    enforces at install: strict color syntax, complete reader palettes,
 *    known app tokens, and font files that exist AND are fetchable (listed
 *    in the registry entry's `files`)
 *  - every folder under plugins/ is listed in the registry (no orphans)
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;
const KNOWN_PERMISSIONS = new Set([
  "ui:themes",
  "library:read",
  "library:write",
  "reading:read",
  "reading:write",
  "annotations:read",
  "annotations:write",
  "conversations:read",
  "agent:tools",
  "service:network",
  "service:llm",
  "service:clipboard",
]);
const SETTINGS_PATH_PATTERN =
  /^[a-z][a-zA-Z0-9-]*(?:\.[a-z][a-zA-Z0-9-]*)*(?:\.\*)?$/;

function checkSettingsAccess(id, manifest) {
  const access = manifest.settingsAccess;
  if (access == null) return;
  if (typeof access !== "object" || Array.isArray(access)) {
    problem(`plugins/${id}: settingsAccess must be an object`);
    return;
  }
  for (const operation of Object.keys(access)) {
    if (!["discover", "read", "write"].includes(operation)) {
      problem(`plugins/${id}: unknown settingsAccess operation "${operation}"`);
      continue;
    }
    const paths = access[operation];
    if (
      !Array.isArray(paths) ||
      paths.some(
        (path) =>
          typeof path !== "string" ||
          path === "*" ||
          !SETTINGS_PATH_PATTERN.test(path),
      )
    ) {
      problem(
        `plugins/${id}: settingsAccess.${operation} needs exact paths or section.* groups`,
      );
    }
  }
}

// ── Theme/font grammars — mirror of the app's plugin-theme.ts validators ──
const HEX_COLOR = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const FUNC_COLOR = /^(?:rgb|rgba|hsl|hsla)\(\s*[\d.,%\s/-]+\)$/;
const isThemeColor = (value) =>
  typeof value === "string" &&
  value.length <= 64 &&
  (HEX_COLOR.test(value) || FUNC_COLOR.test(value));
const FONT_PATH = /^(?!\.)[A-Za-z0-9._-]+(\/(?!\.)[A-Za-z0-9._-]+)*\.(woff2|woff|ttf|otf)$/i;
const APP_THEME_TOKENS = new Set([
  "paper", "paperWarm", "border", "fg", "fgMuted", "fgSubtle", "inverseFg",
  "surface", "fill", "fillStrong", "borderStrong", "mainSurface", "scrollbar",
]);
const READER_PALETTE_KEYS = ["bg", "text", "selection", "rule", "faint", "muted"];
const FONT_SIZES = new Set([
  "xx-small", "x-small", "small", "medium", "large", "x-large", "xx-large", "xxx-large",
]);
const FONT_WEIGHTS = new Set(["light", "regular", "medium", "bold"]);
const LINE_SPACINGS = new Set(["compact", "comfortable", "relaxed"]);
const PARAGRAPH_SPACINGS = new Set(["tight", "normal", "loose"]);

/**
 * Validate a manifest's `themes`/`fonts` declarations the way the app will,
 * so a PR fails here instead of at install time. `listedFiles` is the set of
 * files an install actually fetches (entry module + registry `files`) —
 * every declared font file must be in it or the installed plugin would be
 * missing its faces.
 */
function checkThemeContributions(id, manifest, listedFiles) {
  const where = `plugins/${id}`;
  if (manifest.themes == null && manifest.fonts == null) return;
  if (!(manifest.permissions ?? []).includes("ui:themes")) {
    problem(`${where}: themes/fonts require the "ui:themes" permission`);
  }

  const fontIds = new Set();
  for (const font of Array.isArray(manifest.fonts) ? manifest.fonts : []) {
    const label = `${where} font "${font?.id ?? "?"}"`;
    if (typeof font?.id !== "string" || !ID_PATTERN.test(font.id)) {
      problem(`${label}: invalid font id`);
      continue;
    }
    if (fontIds.has(font.id)) problem(`${label}: duplicate font id`);
    fontIds.add(font.id);
    if (typeof font.family !== "string" || font.family.trim() === "") {
      problem(`${label}: missing family name`);
    }
    if (font.kind != null && !["sans", "serif", "cjk"].includes(font.kind)) {
      problem(`${label}: kind must be "sans", "serif", or "cjk"`);
    }
    if (!Array.isArray(font.files) || font.files.length === 0) {
      problem(`${label}: needs at least one file`);
      continue;
    }
    for (const file of font.files) {
      if (typeof file?.path !== "string" || !FONT_PATH.test(file.path)) {
        problem(`${label}: invalid file path "${file?.path}"`);
        continue;
      }
      if (!existsSync(join(ROOT, "plugins", id, file.path))) {
        problem(`${label}: file "${file.path}" does not exist`);
      }
      if (!listedFiles.has(file.path)) {
        problem(
          `${label}: file "${file.path}" must be listed in the registry entry's "files" so installs fetch it`,
        );
      }
      if (
        file.weight != null &&
        (!Number.isInteger(file.weight) || file.weight < 1 || file.weight > 1000)
      ) {
        problem(`${label}: weight must be an integer between 1 and 1000`);
      }
      if (file.style != null && !["normal", "italic"].includes(file.style)) {
        problem(`${label}: style must be "normal" or "italic"`);
      }
    }
  }

  const themeIds = new Set();
  for (const theme of Array.isArray(manifest.themes) ? manifest.themes : []) {
    const label = `${where} theme "${theme?.id ?? "?"}"`;
    if (typeof theme?.id !== "string" || !ID_PATTERN.test(theme.id)) {
      problem(`${label}: invalid theme id`);
      continue;
    }
    if (themeIds.has(theme.id)) problem(`${label}: duplicate theme id`);
    themeIds.add(theme.id);
    const nameOk =
      (typeof theme.name === "string" && theme.name.trim() !== "") ||
      (typeof theme.name === "object" && typeof theme.name?.default === "string");
    if (!nameOk) problem(`${label}: needs a name (string or { default, translations })`);
    if (!["light", "dark"].includes(theme.polarity)) {
      problem(`${label}: polarity must be "light" or "dark"`);
    }
    if (theme.app == null && theme.reader == null) {
      problem(`${label}: must declare an app part, a reader part, or both`);
    }
    for (const [token, value] of Object.entries(theme.app ?? {})) {
      if (!APP_THEME_TOKENS.has(token)) problem(`${label}: unknown app token "${token}"`);
      else if (!isThemeColor(value)) problem(`${label}: app token "${token}" is not a valid color`);
    }
    if (theme.reader != null) {
      for (const key of READER_PALETTE_KEYS) {
        if (!isThemeColor(theme.reader.palette?.[key])) {
          problem(`${label}: reader palette "${key}" is missing or not a valid color`);
        }
      }
      const typography = theme.reader.typography ?? {};
      const family = typography.fontFamily;
      if (family != null) {
        const selfRef = typeof family === "string" && family.startsWith("plugin:");
        const declared = selfRef && fontIds.has(family.slice("plugin:".length));
        const external =
          typeof family === "string" &&
          (family.startsWith("curated:") || family.startsWith("system:"));
        if (!declared && !external) {
          problem(`${label}: typography fontFamily must be "plugin:<declared fontId>", "curated:<id>", or "system:<family>"`);
        }
      }
      if (typography.fontSize != null && !FONT_SIZES.has(typography.fontSize)) {
        problem(`${label}: invalid typography fontSize`);
      }
      if (typography.fontWeight != null && !FONT_WEIGHTS.has(typography.fontWeight)) {
        problem(`${label}: invalid typography fontWeight`);
      }
      if (typography.lineSpacing != null && !LINE_SPACINGS.has(typography.lineSpacing)) {
        problem(`${label}: invalid typography lineSpacing`);
      }
      if (
        typography.paragraphSpacing != null &&
        !PARAGRAPH_SPACINGS.has(typography.paragraphSpacing)
      ) {
        problem(`${label}: invalid typography paragraphSpacing`);
      }
    }
  }
}

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
  checkSettingsAccess(entry.id, manifest);

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

  checkThemeContributions(
    entry.id,
    manifest,
    new Set([main, ...(entry.files ?? []).filter((file) => typeof file === "string")]),
  );
}

const pluginsDir = join(ROOT, "plugins");
for (const folder of existsSync(pluginsDir) ? readdirSync(pluginsDir) : []) {
  if (folder.startsWith(".")) continue;
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
