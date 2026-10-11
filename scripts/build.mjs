/**
 * Build plugin entry modules: `plugins/<id>/src/main.ts` → the manifest's
 * `main` (default `main.js`), one self-contained ES module per plugin.
 *
 *   bun scripts/build.mjs              build every plugin that has a src/
 *   bun scripts/build.mjs <plugin-dir> build one plugin (e.g. `.` inside it)
 *   bun scripts/build.mjs --check      fail if a committed bundle differs
 *
 * Bundles are built from the repository root, so the output does not depend
 * on where the command runs; CI rebuilds with the Bun version in
 * .bun-version and requires the committed main.js to match its source.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..");
const args = process.argv.slice(2);
const check = args.includes("--check");
const targets = args.filter((arg) => arg !== "--check");

const pluginDirs = targets.length
  ? targets.map((target) => resolve(process.cwd(), target))
  : readdirSync(join(ROOT, "plugins"))
      .filter((folder) => !folder.startsWith("."))
      .map((folder) => join(ROOT, "plugins", folder))
      .filter((dir) => existsSync(join(dir, "src/main.ts")));

// Bun writes module-path comments relative to the working directory; build
// from the repository root so every invocation emits identical bytes.
process.chdir(ROOT);
let stale = 0;
for (const dir of pluginDirs) {
  const entry = join(dir, "src/main.ts");
  if (!existsSync(entry)) {
    console.error(`${relative(ROOT, dir) || dir}: no src/main.ts to build`);
    process.exit(1);
  }
  const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
  const outPath = join(dir, typeof manifest.main === "string" ? manifest.main : "main.js");
  const result = await Bun.build({ entrypoints: [entry], format: "esm", target: "browser" });
  if (!result.success) {
    for (const message of result.logs) console.error(message);
    process.exit(1);
  }
  const text = await result.outputs[0].text();
  const label = relative(ROOT, outPath);
  if (check) {
    if (!existsSync(outPath) || readFileSync(outPath, "utf8") !== text) {
      console.error(`stale: ${label} does not match its source — run \`bun run build\` and commit it`);
      stale += 1;
    }
  } else {
    writeFileSync(outPath, text);
    console.log(`built ${label} (${text.length} bytes)`);
  }
}
if (stale) process.exit(1);
if (check) console.log(`OK — ${pluginDirs.length} bundle(s) match their source.`);
