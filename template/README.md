# Plugin template

A commented TypeScript skeleton for a ReadAware plugin.

## Start

1. Copy this folder somewhere and rename it to your plugin id
   (lowercase letters, digits, hyphens — the folder name must equal
   `manifest.json`'s `id`).
2. Edit `manifest.json` (id, name, description, permissions — declare only
   what the code uses) and `src/main.ts`.
3. Build: `bun run build` (emits `main.js`, the module the app loads;
   `bun run check` typechecks against the contract).
4. Install locally: ReadAware → Settings → Plugins → Install plugin…,
   point it at your folder. Reinstall to pick up changes.

The whole authoring contract is `../types/plugin-api.d.ts` — mount points,
view vocabulary, data domains, events, and the sandbox's rules (no DOM APIs;
fetch bodies must be strings or binary). Delete the mount points you don't
need in `main.ts`, and drop the permissions they used from the manifest.

## Publish

See the repository README: add your folder under `plugins/`, list it in
`registry.json`, run `node scripts/validate.mjs` and `npx tsc --noEmit`,
open a PR.
