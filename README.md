# ReadAware Plugins

The community plugin registry for [ReadAware](https://readaware.app) — an
AI-native reading app. Plugins listed here appear in the app under
**Settings → Plugins → Marketplace** and install with one click.

Submissions work like Raycast's extension repo: **your plugin lives in this
repository** and lands via pull request.

## Submitting a plugin

**TypeScript is the recommended authoring path** — copy `template/`, write
`src/main.ts` against the typed API in `types/plugin-api.d.ts`, and build
with `bun run build` (or `bun build src/main.ts --outfile main.js --format
esm`). What ships is always the built `main.js`; plain JavaScript is equally
accepted if you prefer it.

1. Fork this repository.
2. Copy `template/` to `plugins/<your-plugin-id>/` (or create the folder by
   hand) containing at least:
   - `manifest.json` — see the format below
   - `main.js` — a single self-contained ES module (the build output when
     authoring in TypeScript; keep `src/` committed so the code is reviewable)
3. Add a matching entry to `registry.json` (keep the array sorted by id).
4. Run `node scripts/validate.mjs` and `npx tsc --noEmit` locally — CI runs
   the same checks on your PR.
5. Open a pull request describing what the plugin does and which permissions
   it needs and why.

Updates are the same flow: bump `version` in both `manifest.json` and
`registry.json` in one PR.

Start from `template/` — a commented TypeScript skeleton with the build
script wired up (`bun run build` emits `main.js`). `plugins/theme-schedule/` here, and the bundled
first-party plugins in the app repository (`plugins/` there: dictionary,
rss-reader, tts, sentence-reader, editorial-themes), are the living examples
of the full surface.

## manifest.json

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "0.1.0",
  "minAppVersion": "0.3.0",
  "description": "One sentence about what it does.",
  "author": "you",
  "permissions": ["service:network"],
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
- `permissions` — only what you use. Data permissions are
  `<domain>:read` / `<domain>:write` per domain (write implies read):
  `library` (books, source text, and collections), `reading` (navigation,
  progress, and reading time), `annotations`, `conversations` (read-only).
  `agent:tools` registers tools
  on the reading agent; `ui:themes` unlocks the declarative `themes`/`fonts`
  fields below; services are `service:network`, `service:llm`
  (supports structured JSON output via `schema`), and `service:clipboard`.
  Users see every declared permission before installing.
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
- `minAppVersion` — bump it when you use a recently added capability
  (`secret`/`visibleWhen`/`dynamicOptions` fields, localized field copy,
  schedules, voice providers): an older app rejects the unknown manifest
  shapes with a readable error instead of half-working.

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

    // Command palette
    ctx.contributions.commands.register({ id: "hello", title: "My Plugin: hello", run: () => {} });

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

UI is declarative only — view kinds `markdown`, `list`, `form`, and the
compositional `blocks`, rendered by the app's design system. A list item or
form submit may return `{ view }` to chain deeper, `{ toast }` for a notice,
or `{ close: true }`. Icons are picked by name from the app's curated
Phosphor set. Persistent state goes through `ctx.services.storage` (namespaced
key-value; `ctx.services.storage.onChange(fn)` fires when your namespace is written
from outside the plugin — its settings page, the agent — so cached settings
can be re-read).

The full contract is `types/plugin-api.d.ts` in this repository (a mirror of
`packages/plugin-types` in the app repository).

## Review expectations

- Declare the minimum permissions; PRs asking for more than the code uses
  will be sent back.
- `main.js` must be readable (or accompanied by a link to the source it was
  bundled from).
- No obfuscated code, no analytics/tracking, no remote code loading.

Plugins run inside the app with the same access as the app itself —
installation is a trust decision users make per plugin, and this repo's
review is the community's first line of defense.
