# ReadAware Plugins

The community plugin registry for [ReadAware](https://readaware.app) — an
AI-native reading app. Plugins listed here appear in the app under
**Settings → Plugins → Marketplace** and install with one click.

Submissions work like Raycast's extension repo: **your plugin lives in this
repository** and lands via pull request.

**Building with a coding agent?** Hand it this repository and
[`AGENTS.md`](AGENTS.md) — the complete authoring guide in one file.

## What the app supports

`types/` describes one ReadAware release, generated from that release's
source and named in its header:

- `types/plugin-api.d.ts` — the whole plugin contract, self-contained. Import
  it as `@readaware/plugin-api` (mapped in `tsconfig.json`), types only.
- `types/host-capabilities.json` — every capability the release offers with
  its version and required permission, the icon names contributions accept,
  and the built-in shortcut chords. Choose `requires` ranges from it.

Both are refreshed for every app release; the validator checks every manifest
against them, so a plugin that passes CI activates on that release.

## Submitting a plugin

TypeScript is the authoring path: `src/main.ts` is bundled into the
self-contained `main.js` the app loads (plain JavaScript in `src/main.ts`
works too). Use Bun — the version in `.bun-version`.

1. Fork this repository and run `bun install`.
2. Copy `template/` to `plugins/<your-plugin-id>/` — the folder name must
   equal the manifest `id`. Edit `manifest.json` and `src/main.ts`.
3. Build with `bun run build` (all plugins) or `bun run build` inside your
   folder (just yours), and commit both `src/` and the built `main.js`.
4. Add a matching entry to `registry.json` (sorted by id; `permissions` equal
   to the manifest's; `files` for any extra assets).
5. Run `bun run check` — validate, typecheck, tests, and a rebuild that must
   match the committed `main.js`. CI runs exactly this on your PR.
6. Open a pull request describing what the plugin does and which permissions
   it needs and why.

Updates are the same flow: bump `version` in both `manifest.json` and
`registry.json` in one PR.

To try a plugin before publishing, open ReadAware → Settings → Plugins →
Install plugin… and choose your plugin folder; reinstall after each build.

`template/` is a commented TypeScript skeleton with a test.
`plugins/theme-schedule/` here, and the bundled first-party plugins in the app
repository (`plugins/` there: dictionary, rss-reader, tts, sentence-reader,
editorial-themes, webdav-sync), are the living examples of the full surface.

## manifest.json

Every manifest includes a positive integer `schemaVersion` for the plugin's
private KV and document data. Change it only when that data shape changes, and
export `migrate(storageOnlyContext, { fromVersion, toVersion, direction })` for
upgrades and supported downgrades.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "0.1.0",
  "schemaVersion": 1,
  "minAppVersion": "0.6.5",
  "requires": {
    "contributions": { "commands": "^1.1.0" },
    "services": { "storage": "^2.6.0", "network": "^2.2.0" }
  },
  "description": "One sentence about what it does.",
  "author": "you",
  "permissions": ["service:network"],
  "networkAccess": { "origins": ["https://api.example.com"] },
  "main": "main.js",
  "settings": [
    {
      "kind": "number",
      "id": "articleLimit",
      "label": "Articles per feed",
      "helperText": "Shown under the field in the Plugins panel.",
      "value": 30,
      "min": 5,
      "max": 100
    }
  ]
}
```

- `id` — lowercase letters, digits, hyphens (max 64 chars); must equal the
  folder name.
- `requires` — every domain, contribution, service and schema the code uses,
  each with a semver range the target release satisfies. Copy the versions
  from `types/host-capabilities.json`; a range the release has outgrown (for
  example `storage: "^1.0.0"` after storage 2.0) makes the app refuse to
  activate the plugin, and the validator reports it.
- `permissions` — only what you use. Data permissions are
  `<domain>:read` / `<domain>:write` per domain (write implies read):
  `library` (books, source text, and collections), `reading` (navigation,
  progress, and reading time), `annotations`, `conversations` (read-only).
  `agent:tools` registers tools
  on the reading agent; `ui:themes` unlocks the declarative `themes`/`fonts`
  fields below; `sync:transport` lets the plugin provide a sync backend (a
  ciphertext mailbox on a server of the plugin's choosing — the app keeps
  encryption, the event log, and merge, and the plugin only ever carries
  sealed envelopes; see `PluginSyncTransport` in the contract); services are
  `service:network`, `service:llm`
  (supports structured JSON output via `schema`), and `service:clipboard`.
  Users see every declared permission before installing.
- `networkAccess` — with `service:network`, the exact origins the plugin may
  reach (`https://host[:port]`, no paths), or `["*"]` for any; users see them
  before installing.
- `main` — the entry module, default `main.js`.
- `settings` — optional declarative settings (field kinds: `text`,
  `textarea`, `number`, `time`, `select`, `toggle`, `checkbox`, `choice`,
  `secret`). A `time` field is a time of day: the app renders two dropdowns
  (hours, minutes, `minuteStep` granularity) and stores 24-hour `HH:MM` —
  never ask users to type a time. The app renders them as the plugin's own section in Settings
  and persists the values as ONE object under your storage key `settings`
  — read them with `ctx.services.storage.get("settings")`, and re-read on the
  storage-changed notification if you cache them. Fields can show
  conditionally per variant (`visibleWhen: { field, equals }` — hidden
  fields keep their stored values, so one settings object carries a value
  set per variant), and a `select` may resolve its options at runtime:
  declare `dynamicOptions: true` and bind the source in `activate` with
  `ctx.contributions.settingsOptions.register(fieldId, async (values) => [...])` — when
  the source yields nothing the field falls back to free text input. Add
  `allowManualEntry: false` when the resolved list is the WHOLE set of
  acceptable values (a theme, an installed font): the "Enter manually…"
  escape and the text fallback are dropped, because typing a value the
  write path will reject helps nobody.
  Credentials use `kind: "secret"`: a host-rendered password input whose
  value goes to the encrypted secret store (the field id IS the
  `ctx.services.secrets` key your code reads back), never into plain settings.
  The reading agent can view and change ordinary settings too, so users
  can just ask it ("set the article limit to 50"); `secret` fields,
  password-mode text fields, and `agentHidden: true` stay out of the
  agent's sight.
- `schedules` — optional recurring tasks, e.g.
  `[{ "id": "refresh", "label": "Refresh feeds", "everyMinutes": 60 }]`
  (floor: 15 minutes). Declared here so users see them before installing;
  bind the work in `activate` with
  `ctx.services.schedules.bind("refresh", async () => { ... })`. The host runs it AT
  LEAST every `everyMinutes` while the app is open and catches up shortly
  after launch when overdue — never at exact times, and never while the
  app is closed.
- `minAppVersion` — the oldest ReadAware release you tested. Use the release
  named in `types/host-capabilities.json` (currently 0.6.5) unless you have
  tested older ones; it may not be newer than that release. `requires` is what
  the app actually enforces, so keep both truthful.

## Themes and bundled fonts (`ui:themes`)

A theme plugin is pure data — the manifest declares palettes and font files,
the app validates them and generates all CSS. Nothing applies until the user
selects the theme in Settings. A minimal theme-only plugin's `main.js` is
just `export default { activate() {} }`.

```json
{
  "permissions": ["ui:themes"],
  "fonts": [
    {
      "id": "my-serif",
      "family": "My Serif",
      "kind": "serif",
      "files": [{ "path": "assets/my-serif-400.woff2", "weight": 400 }]
    }
  ],
  "themes": [
    {
      "id": "dusk",
      "name": { "default": "Dusk", "translations": { "zh-Hans": "暮色" } },
      "polarity": "dark",
      "app": { "paper": "#14171e", "fg": "#e3e6ec" },
      "reader": {
        "palette": {
          "bg": "#161a22", "text": "#ccd2dd",
          "selection": "rgba(154, 162, 177, 0.28)",
          "rule": "rgba(204, 210, 221, 0.18)",
          "faint": "rgba(204, 210, 221, 0.07)",
          "muted": "rgba(204, 210, 221, 0.55)"
        },
        "typography": { "fontFamily": "plugin:my-serif", "fontSize": "large" }
      }
    }
  ]
}
```

- A theme has a light/dark `polarity` and two independent, optional parts:
  `app` (app-chrome token overrides — see `PluginAppThemeTokens` in the
  typings for the vocabulary) and `reader` (the six-color book-page palette,
  plus an optional typography preset applied once when the user selects the
  theme).
- Colors must be plain hex or `rgb()`/`rgba()`/`hsl()`/`hsla()` — keywords,
  `var()`, and `url()` are rejected.
- Font files (`.woff2`/`.woff`/`.ttf`/`.otf`) ship inside the plugin folder
  and **must be listed in the registry entry's `files`** so installs fetch
  them (binary files are supported). A theme references its own fonts as
  `plugin:<fontId>`.
- Set `minAppVersion` to the first app version with theme support — older
  apps reject the `ui:themes` permission at install.

## Changing appearance through Settings

Appearance is a section of the Settings Domain, not a separate capability.
Request exact paths in the manifest:

```json
{
  "settingsAccess": {
    "discover": ["appearance.theme", "reading.theme"],
    "write": ["appearance.theme", "reading.theme"]
  }
}
```

Discovery returns the validated option catalog, including themes supplied by
enabled plugins. Updates use the same validation and effects as Settings:

```js
const settings = ctx.domains.settings;
const appearance = await settings.queries.discover({ section: "appearance" });
const appThemes = appearance.find((entry) => entry.path === "appearance.theme")?.options;

await settings.commands.update([
  { path: "appearance.theme", value: "dark", target: { kind: "global" } },
]);
await settings.commands.update([
  { path: "reading.theme", value: "warm", target: { kind: "global" } },
]);
```

`ui:themes` remains the contribution permission for supplying new themes. It
does not grant permission to select them.

The first-party [`theme-schedule`](plugins/theme-schedule) plugin in this
repository is a complete worked example: a daytime and a night look, each
picking an app theme and a page color, switched on the device's own clock.

## Plugin API in one screen

`main.js` default-exports a lifecycle object. Everything goes through the
`ctx` handed to `activate`; every `register*` returns a disposable the app
cleans up on disable.

`activate()` is a read-and-declare pass. Registrations are staged until the
host health-checks and promotes the plugin; writes, secrets, network, LLM, UI
effects, and navigation are unavailable before that point. Put data changes in
`migrate()`, and start runtime work from a registered schedule, subscription,
command, provider, or action.

```js
export default {
  activate(ctx) {
    // Reader selection menu — runs silently (toast) or opens a dialog view
    ctx.contributions.selectionActions.register({
      id: "my-action",
      title: "Do something with the selection",
      icon: "sparkle",
      run: (input) => ({ toast: `Got: ${input.text.slice(0, 20)}…` }),
    });

    // Header buttons — reader: anchored popup; shelf: popup or a full page
    ctx.contributions.headerActions.register({
      id: "my-page",
      title: "My page",
      icon: "chart-line-up",
      surface: "shelf",
      presentation: "page",
      view: async () => ({ kind: "list", items: [] }),
    });

    // Command palette — optionally with a default key binding the user can
    // rebind in Settings → Shortcuts
    ctx.contributions.commands.register({
      id: "hello",
      title: "My Plugin: hello",
      defaultShortcut: { key: "h", mod: true, alt: true },
      run: () => ({ toast: "Hello" }),
    });

    // Data domains — reads, event subscriptions, and (with the write
    // permission) commands issued through the app's own event-sourced
    // write path, attributed to your plugin in the event log
    ctx.domains.annotations?.events.subscribe("highlight.created", ({ payload }) => {
      ctx.services.ui.showToast(`Highlighted: ${payload.text.slice(0, 24)}…`);
    });

    // Agent tools (requires "agent:tools") — the reading agent can call
    // these during chat, namespaced plugin_<id>_<name>
    ctx.contributions.agentTools?.register({
      name: "my_tool",
      description: "What the model should know about this tool.",
      parameters: { type: "object", properties: {} },
      execute: async () => ({ ok: true }),
    });
  },
};
```

Read-aloud voices: `ctx.contributions.voiceProviders.register` plugs a TTS engine
into the reader's read-aloud — implement `listVoices()` and
`synthesize({ text, voiceId })` returning encoded audio bytes (mp3/wav);
the app owns playback, sentence pacing, prefetch, and system-voice
fallback. A registered voice is adopted automatically (first provider
with voices wins; no host-side picker): the user enabling your plugin IS
the opt-in, and a failed synthesis call falls back to the system voice —
so registering unconditionally is fine. Pair it with `service:network`
for cloud or local engines and `secret` settings fields (read back via
`ctx.services.secrets`) for API keys — see the first-party `tts` plugin.

Command shortcuts: `defaultShortcut` is a chord (`key` plus optional `mod` —
⌘ on macOS, Ctrl elsewhere — `alt`, `shift`). Avoid the chords in
`builtInShortcuts` of `types/host-capabilities.json`: when two shortcuts share
a chord, pressing it runs neither until the user rebinds one in Settings →
Shortcuts. Every command is bindable there, with or without a default.

UI is declarative only — view kinds `markdown`, `list`, `table`, `tree`,
`image`, `editor`, `form`, `detail`, and the compositional `blocks`, rendered
by the app's design system. A list item or
form submit may return `{ view }` to chain deeper, `{ toast }` for a notice,
or `{ close: true }`. Icons are picked by name from `icons` in
`types/host-capabilities.json`; any other name renders as a puzzle piece.
Persistent state goes through `ctx.services.storage` (namespaced key-value;
`set()` and `remove()` return promises that settle once the write is durable,
so await them; `ctx.services.storage.onChange(fn)` fires when your namespace
is written from outside the plugin — its settings page, the agent — so cached
settings can be re-read).

The full contract is `types/plugin-api.d.ts`, generated from the release
named in its header (`packages/plugin-types` in the app repository).

## Review expectations

- Declare the minimum permissions; PRs asking for more than the code uses
  will be sent back.
- `main.js` must be built from the committed `src/` with `bun run build`
  (CI rebuilds and compares); keep it unminified so it stays readable.
- No obfuscated code, no analytics/tracking, no remote code loading.

Plugins run inside the app with the same access as the app itself —
installation is a trust decision users make per plugin, and this repo's
review is the community's first line of defense.
