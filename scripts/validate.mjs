/**
 * Registry validation — run on every pull request. Fails loudly with every
 * problem it finds rather than stopping at the first.
 *
 * The host contract comes from types/host-capabilities.json — generated from
 * the latest ReadAware release together with types/plugin-api.d.ts — so these
 * checks follow the release instead of a hand-kept list.
 *
 * Checks:
 *  - registry.json parses, has a `plugins` array, no duplicate ids
 *  - every registry entry has id/name/version, a valid id shape, and
 *    known permissions only
 *  - every manifest (and template/manifest.json) declares `requires` that the
 *    latest release satisfies, with the permission each capability needs, a
 *    `minAppVersion` no newer than that release, and `networkAccess` origins
 *    exactly when it uses `service:network` — what the app checks at install
 *  - every entry's folder exists with a manifest.json whose id/version/name
 *    match the registry listing; the entry module and any extra `files` exist
 *  - theme/font declarations (`ui:themes`) pass the same grammars the app
 *    enforces at install: strict color syntax, complete reader palettes,
 *    known app tokens, and font files that exist AND are fetchable (listed
 *    in the registry entry's `files`)
 *  - every folder under plugins/ is listed in the registry (no orphans)
 *  - manifest examples in README.md, AGENTS.md and template/README.md pass
 *    the same contract checks, so the docs cannot drift from the release
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import semver from "semver";

const ROOT = new URL("..", import.meta.url).pathname;
const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;
const RELEASE = JSON.parse(readFileSync(join(ROOT, "types/host-capabilities.json"), "utf8"));
const KNOWN_PERMISSIONS = new Set(RELEASE.permissions);
const SEMVER = { includePrerelease: true };
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
const APP_THEME_TOKENS = new Set(RELEASE.themeTokens.app);
const READER_PALETTE_KEYS = RELEASE.themeTokens.readerPalette;
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

/** The checks the app runs before activating a plugin, against the latest release. */
function checkHostContract(where, manifest) {
  const app = RELEASE.appVersion;
  const declared = new Set(manifest.permissions ?? []);
  for (const permission of declared) {
    if (!KNOWN_PERMISSIONS.has(permission)) problem(`${where}: unknown permission "${permission}"`);
  }
  if (manifest.minAppVersion != null) {
    if (typeof manifest.minAppVersion !== "string" || !semver.valid(manifest.minAppVersion)) {
      problem(`${where}: minAppVersion must be a version such as "${app}"`);
    } else if (semver.gt(manifest.minAppVersion, app)) {
      problem(`${where}: minAppVersion ${manifest.minAppVersion} is newer than the latest release ${app}`);
    }
  }
  const requires = manifest.requires;
  if (typeof requires !== "object" || requires === null || Array.isArray(requires)) {
    problem(`${where}: manifest.requires must be an object (versions: types/host-capabilities.json)`);
  } else {
    for (const [family, entries] of Object.entries(requires)) {
      const catalog = RELEASE.capabilities[family];
      if (!catalog) {
        problem(`${where}: requires.${family} is not a capability family in ReadAware ${app}`);
        continue;
      }
      for (const [id, range] of Object.entries(entries ?? {})) {
        const capability = catalog[id];
        const name = `requires.${family}.${id}`;
        if (!capability) {
          problem(`${where}: ${name} is not available in ReadAware ${app}`);
          continue;
        }
        if (typeof range !== "string" || !semver.validRange(range, SEMVER)) {
          problem(`${where}: ${name} must be a semver range such as "^${capability.version}"`);
          continue;
        }
        if (!semver.satisfies(capability.version, range, SEMVER)) {
          problem(
            semver.gtr(capability.version, range, SEMVER)
              ? `${where}: ${name} "${range}" targets an older contract; ReadAware ${app} ships ${capability.version} — update the code for it and require "^${semver.major(capability.version)}.${semver.minor(capability.version)}.0"`
              : `${where}: ${name} "${range}" needs a newer ReadAware than ${app}, which ships ${capability.version}`,
          );
        }
        if (capability.permissions.length && !capability.permissions.some((permission) => declared.has(permission))) {
          problem(`${where}: ${name} needs the ${capability.permissions.join(" or ")} permission`);
        }
      }
    }
  }
  const origins = manifest.networkAccess?.origins;
  if (declared.has("service:network")) {
    const canonical = (origin) => {
      try {
        const url = new URL(origin);
        return ["http:", "https:"].includes(url.protocol) && [url.origin, `${url.origin}/`].includes(origin);
      } catch {
        return false;
      }
    };
    const valid =
      Array.isArray(origins) &&
      origins.length <= 32 &&
      ((origins.length === 1 && origins[0] === "*") || origins.every((origin) => typeof origin === "string" && canonical(origin)));
    if (!valid) problem(`${where}: service:network needs networkAccess.origins — canonical http(s) origins, or ["*"]`);
  } else if (manifest.networkAccess != null) {
    problem(`${where}: networkAccess is only allowed with the service:network permission`);
  }
}

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
  if (!Number.isSafeInteger(manifest.schemaVersion) || manifest.schemaVersion < 1) {
    problem(`plugins/${entry.id}: manifest.schemaVersion must be a positive integer`);
  }
  const declared = JSON.stringify([...(manifest.permissions ?? [])].sort());
  const listed = JSON.stringify([...(entry.permissions ?? [])].sort());
  if (declared !== listed) {
    problem(`plugins/${entry.id}: registry permissions must equal manifest.permissions`);
  }
  checkSettingsAccess(entry.id, manifest);
  checkHostContract(`plugins/${entry.id}`, manifest);

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
  if (!seen.has(folder)) {
    problem(`plugins/${folder}/ exists but is not listed in registry.json`);
  }
}

// The template is what new plugins start from: it must pass the same contract.
try {
  const template = JSON.parse(readFileSync(join(ROOT, "template/manifest.json"), "utf8"));
  checkSettingsAccess("template", template);
  checkHostContract("template", template);
} catch (error) {
  problem(`template/manifest.json is missing or invalid: ${error.message}`);
}

// Manifest examples in the docs are copied verbatim; hold them to the same contract.
for (const doc of ["README.md", "AGENTS.md", "template/README.md"]) {
  const text = readFileSync(join(ROOT, doc), "utf8");
  for (const [index, block] of [...text.matchAll(/```json\n([\s\S]*?)```/g)].entries()) {
    let example;
    try {
      example = JSON.parse(block[1]);
    } catch {
      continue; // fragments such as a single field are illustrations, not manifests
    }
    if (example && typeof example === "object" && "requires" in example) {
      checkSettingsAccess(`${doc} example ${index + 1}`, example);
      checkHostContract(`${doc} example ${index + 1}`, example);
    }
  }
}

if (problems.length > 0) {
  console.error(`Validation failed with ${problems.length} problem(s):\n`);
  for (const message of problems) console.error(`  - ${message}`);
  process.exit(1);
}
console.log(`OK — ${registry.plugins.length} plugin(s) validated.`);
