# Building a ReadAware plugin — guide for coding agents

This file is everything needed to build, test, and publish a ReadAware plugin
from this repository alone. Follow it literally; when it and an older page
disagree, this file and `types/` win.

## Ground truth

| File | What it is |
| --- | --- |
| `types/plugin-api.d.ts` | The complete plugin contract of one ReadAware release (named in its header). Import it as `@readaware/plugin-api`, with `import type` only. |
| `types/host-capabilities.json` | That release's capabilities: each domain, contribution, service and schema with its `version` and the `permissions` that unlock it (any one; empty means every plugin has it), plus `permissions`, `icons`, `builtInShortcuts`, and `themeTokens`. |
| `template/` | A working skeleton with a test. Start every plugin from it. |
| `plugins/theme-schedule/` | A complete published plugin (settings, schedules, settings domain). |
| `scripts/validate.mjs` | The registry validator; it applies the app's install checks against `host-capabilities.json`. |

Both `types/` files are generated from the app release; never edit them. The
app may be newer than `appVersion` in `host-capabilities.json`, never assume
an API that file does not list.

## Workflow

```bash
bun install                                # once, at the repository root
cp -R template plugins/<id>                # folder name == manifest id
# edit plugins/<id>/manifest.json and plugins/<id>/src/main.ts
cd plugins/<id> && bun run build && cd -   # writes plugins/<id>/main.js
# add the registry.json entry (see Publishing)
bun run check                              # validate, typecheck, test, bundle check
```

`bun run check` is exactly what CI runs. Do not hand-edit `main.js` or any
other plugin's files. With the Bun version in `.bun-version`, `bun run build`
at the root rebuilds every plugin deterministically, so unchanged plugins stay
byte-identical.

To exercise the plugin in the app: ReadAware → Settings → Plugins → Install
plugin…, choose `plugins/<id>/`, and approve the permission prompt; the plugin
is then enabled. Reinstall after each build.

## The module

`src/main.ts` default-exports a `PluginModule`:

```ts
import type { PluginModule } from "@readaware/plugin-api";

const plugin: PluginModule = {
  activate(ctx) {
    /* register contributions; read state */
  },
  deactivate() {
    /* optional: release resources the host does not track */
  },
};

export default plugin;
```

- `activate(ctx)` is a read-and-declare pass. Register contributions and read
  state there; writes, secrets, network, LLM calls, UI effects and navigation
  are unavailable until the host has health-checked and promoted the plugin.
  Start real work from a command, action, provider, schedule or subscription.
- Every `register(...)` returns a disposable the host releases on disable.
- Optional namespaces (`ctx.domains.library`, `ctx.services.network`,
  `ctx.services.sync`, `ctx.contributions.agentTools`, …) exist only when the
  manifest declares the permission that unlocks them; check for `undefined`.
- Code runs in a Worker sandbox: no DOM, no `window`, no remote code loading.
  Bundle pure-JS dependencies. Network bodies are strings or binary.
- `ctx.services.storage` is your namespaced key-value store. `get()` is
  synchronous; `set()`/`remove()` return promises that settle once durable —
  await them. Declared settings arrive as one object under the key
  `"settings"`. Structured records: `ctx.services.storage.collection(name)`.
- Raise data-shape changes with `schemaVersion` and export
  `migrate(ctx, { fromVersion, toVersion, direction })`.
- Results returned by commands, actions and form submits: `{ toast }` (a
  string, or `{ kind: "error", code }` to show the host's localized message
  for a stable error code), `{ view }` to open a host-rendered view, or
  `{ close: true }`.
- Host calls reject with errors carrying a stable `code` (`sync/network`,
  `ui/unavailable`, …). Pass codes to `{ kind: "error", code }` instead of
  showing raw messages.

## The manifest

```json
{
  "id": "word-count",
  "name": "Word Count",
  "version": "0.1.0",
  "schemaVersion": 1,
  "minAppVersion": "0.6.5",
  "requires": {
    "contributions": { "selectionActions": "^1.2.0" }
  },
  "description": "Counts the words in the selected passage.",
  "author": "you",
  "permissions": [],
  "main": "main.js"
}
```

- `id`: lowercase letters, digits and hyphens, at most 64 characters, equal
  to the folder name.
- `requires`: one entry per capability the code touches, a semver range the
  release satisfies. Use `^<major>.<minor>.0` of the `version` in
  `host-capabilities.json`. Map code to entries:

  | Code uses | `requires` entry |
  | --- | --- |
  | `ctx.domains.<name>` | `domains.<name>` |
  | `ctx.contributions.<name>` | `contributions.<name>` |
  | `ctx.services.<name>` | `services.<name>` |
  | manifest `settings` fields | `schemas.settings` |
  | returning a `{ view }` | `schemas.views` |
  | manifest `themes` | `schemas.themes` |

  A range the release has outgrown (`"^1.0.0"` when it ships `2.x`) makes
  the app refuse to activate the plugin. The validator names the fix.
- `permissions`: exactly what the code uses, from `permissions` in
  `host-capabilities.json`. Every `requires` entry whose capability lists
  permissions needs one of them. Domain access is `<domain>:read` or
  `<domain>:write` (write implies read).
- `minAppVersion`: the `appVersion` in `host-capabilities.json`, unless the
  plugin was tested on older releases.
- `settingsAccess`: app settings reachable through `ctx.domains.settings`
  (declare `requires.domains.settings`), as exact paths or `section.*` groups
  per operation — `discover`, `read`, `write`; write implies read, read
  implies discover.
- `networkAccess`: required with `service:network` — canonical origins such
  as `"https://api.example.com"`, or `["*"]`. Not allowed without it.
- `settings`: declarative fields rendered as the plugin's settings page
  (`text`, `textarea`, `number`, `time`, `select`, `toggle`, `checkbox`,
  `choice`, `secret`). `secret` values go to `ctx.services.secrets` under the
  field id.
- `schedules`: `[{ "id", "label", "everyMinutes" }]` (at least 15), bound
  in `activate` with `ctx.services.schedules.bind(id, handler)`. Runs while
  the app is open only, never at exact times.

The README covers settings fields, themes and fonts in more depth.

## Commands and shortcuts

```ts
ctx.contributions.commands.register({
  id: "hello",
  title: "My Plugin: hello",
  defaultShortcut: { key: "h", mod: true, alt: true },
  run: () => ({ toast: "Hello" }),
});
```

- Commands appear in the command palette and in Settings → Shortcuts, where
  users can bind or rebind them with or without a default.
- `defaultShortcut` is `{ key, mod?, alt?, shift? }`; `key` is a
  `KeyboardEvent.key` value (lowercase letters), `mod` is ⌘ on macOS and Ctrl
  elsewhere.
- Pick a chord absent from `builtInShortcuts`. If two shortcuts share a chord,
  pressing it runs neither until the user rebinds one.
- Shortcuts do not fire while the user is typing in a text field.

## Views and icons

UI is declarative: return views of kind `markdown`, `list`, `table`, `tree`,
`image`, `editor`, `form`, `detail` or `blocks`; the app renders them with its
design system. Contribution and
list-item `icon` fields take a name from `icons` in `host-capabilities.json`;
any other name renders as a puzzle piece. `PluginView` in the contract lists
every field.

## Testing

Tests are `src/*.test.ts`, run by `bun test`. Activate the plugin against a
minimal fake `ctx` that records registrations, then call what was registered.
Stub only what the code touches — `template/src/main.test.ts` is the pattern.
Cover the success path, each error path, and that `activate()` itself has no
side effects.

## Worked example: a "Sync now" command

A command that runs one sync round on whichever backend the user configured
(the ReadAware relay or a transport plugin such as WebDAV Sync) and reports
the outcome. `plugins/sync-now/manifest.json`:

```json
{
  "id": "sync-now",
  "name": "Sync Now",
  "version": "0.1.0",
  "schemaVersion": 1,
  "minAppVersion": "0.6.5",
  "requires": {
    "contributions": { "commands": "^1.1.0" },
    "services": { "sync": "^1.2.0" }
  },
  "description": "A Sync now command with a keyboard shortcut.",
  "author": "you",
  "permissions": ["service:sync"],
  "main": "main.js"
}
```

`plugins/sync-now/src/main.ts`:

```ts
import type { PluginModule } from "@readaware/plugin-api";

const plugin: PluginModule = {
  activate(ctx) {
    // activate() only registers; the sync starts when the user runs the command.
    ctx.contributions.commands.register({
      id: "sync-now",
      title: "Sync now",
      keywords: "sync webdav",
      defaultShortcut: { key: "s", mod: true, shift: true },
      run: async () => {
        // Present only when the manifest declares service:sync.
        const sync = ctx.services.sync;
        if (!sync) return { toast: { kind: "error", code: "ui/unavailable" } };
        try {
          const receipt = await sync.requestSync();
          return { toast: receipt.status === "completed" ? "Sync finished." : "A sync is already running." };
        } catch (error) {
          // Host errors carry stable codes; the host shows its localized message.
          const code = (error as { code?: unknown }).code;
          return { toast: { kind: "error", code: typeof code === "string" ? code : "sync/failed" } };
        }
      },
    });
  },
};

export default plugin;
```

`requestSync()` resolves when the round has finished, with `status`
`"completed"` or `"already-running"` (a round was in progress and is not
queued again), and rejects with a coded error when no round can start or the
round fails. Its registry entry:

```json
{
  "id": "sync-now",
  "name": "Sync Now",
  "version": "0.1.0",
  "description": "A Sync now command with a keyboard shortcut.",
  "author": "you",
  "permissions": ["service:sync"],
  "minAppVersion": "0.6.5"
}
```

## Publishing

1. Add the plugin to `registry.json`'s `plugins` array, sorted by id: `id`,
   `name` and `version` equal to the manifest's, `description`, `author`,
   `permissions` equal to the manifest's, `minAppVersion`, and `files` listing
   every extra file the plugin loads (fonts, data) besides `main.js`.
2. Commit `manifest.json`, `src/`, the built `main.js`, any assets, and the
   registry entry.
3. Run `bun run check`, then open a pull request that says what the plugin
   does and why it needs each permission.
4. For an update, bump `version` in the manifest and the registry entry in the
   same pull request.

Review rejects permissions the code does not use, obfuscated or minified
code, analytics or tracking, and remote code loading.

## Common mistakes

- Copying `requires` versions from an old example instead of
  `host-capabilities.json`.
- Using a capability without the permission that unlocks it, or declaring a
  permission the code never uses.
- `service:network` without `networkAccess`, or with URLs that have paths.
- Importing the contract with a value import, or importing host modules —
  only `import type` from `@readaware/plugin-api` exists at build time.
- Doing work in `activate()` instead of in what it registers.
- Not awaiting `storage.set()` before reporting success.
- A `defaultShortcut` that collides with a built-in chord.
- Editing `types/`, another plugin, or `main.js` by hand.
