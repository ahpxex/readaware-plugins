# Plugin template

A commented TypeScript skeleton for a ReadAware plugin, with a test.

## Start

1. In a checkout of this repository, run `bun install`, then copy this folder
   to `plugins/<your-plugin-id>/`. The folder name must equal the
   `manifest.json` `id` (lowercase letters, digits, hyphens).
2. Rename `package.json`'s `name` to `readaware-plugin-<your-plugin-id>` and
   replace this README with one about your plugin. Edit `manifest.json` — id, name, description, `schemaVersion`,
   permissions, and `requires` — and `src/main.ts`. Delete the mount points
   you don't need, then the permissions and `requires` entries they used.
   Capability versions for `requires` are in `types/host-capabilities.json`.
3. Inside your folder: `bun run build` emits `main.js` (the module the app
   loads), `bun test` runs `src/*.test.ts`, and `bun run typecheck` typechecks.
   `bun run check` at the repository root runs everything CI runs.
4. Install locally: ReadAware → Settings → Plugins → Install plugin…, choose
   your folder. Reinstall to pick up a new build.

Types come from `@readaware/plugin-api` — `types/plugin-api.d.ts`, mapped in
the repository's `tsconfig.json`. To work outside this repository, copy
`types/plugin-api.d.ts` next to your project and map the same name in your own
`tsconfig.json` `paths`.

The sandbox has no DOM APIs (bundle a pure-JS parser if you need one), and
network-service bodies must be strings or binary. [`AGENTS.md`](../AGENTS.md)
is the complete authoring guide.

## Publish

From the repository root: list the plugin in `registry.json`, run
`bun run check`, and open a pull request (see the repository README).
