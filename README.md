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

The official plugins are authored in TypeScript (`plugins/*/src/`)
with their built `main.js` committed — use them as living examples.

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
  "main": "main.js"
}
```

- `id` — lowercase letters, digits, hyphens (max 64 chars); must equal the
  folder name.
- `permissions` — only what you use. Data permissions are
  `<domain>:read` / `<domain>:write` per domain (write implies read):
  `books`, `collections`, `annotations`, `reading` (read-only),
  `vocabulary`, `conversations` (read-only). `agent:tools` registers tools
  on the reading agent; services are `service:network`, `service:llm`,
  `service:dictionary`, `service:clipboard`. Users see every declared
  permission before installing.
- `main` — the entry module, default `main.js`.

## Plugin API in one screen

`main.js` default-exports a lifecycle object. Everything goes through the
`ctx` handed to `activate`; every `register*` returns a disposable the app
cleans up on disable.

```js
export default {
  activate(ctx) {
    // Reader selection menu — runs silently (toast) or opens a dialog view
    ctx.ui.registerSelectionAction({
      id: "my-action",
      title: "Do something with the selection",
      icon: "sparkle",
      run: (input) => ({ toast: `Got: ${input.text.slice(0, 20)}…` }),
    });

    // Header buttons — reader: anchored popup; shelf: popup or a full page
    ctx.ui.registerHeaderAction({
      id: "my-page",
      title: "My page",
      icon: "chart-line-up",
      surface: "shelf",
      presentation: "page",
      view: async () => ({ kind: "list", items: [] }),
    });

    // Command palette
    ctx.ui.registerCommand({ id: "hello", title: "My Plugin: hello", run: () => {} });

    // Data domains — reads, event subscriptions, and (with the write
    // permission) commands issued through the app's own event-sourced
    // write path, attributed to your plugin in the event log
    ctx.annotations?.on("highlight.created", ({ payload }) => {
      ctx.ui.showToast(`Highlighted: ${payload.text.slice(0, 24)}…`);
    });

    // Agent tools (requires "agent:tools") — the reading agent can call
    // these during chat, namespaced plugin_<id>_<name>
    ctx.agent?.registerTool({
      name: "my_tool",
      description: "What the model should know about this tool.",
      parameters: { type: "object", properties: {} },
      execute: async () => ({ ok: true }),
    });
  },
};
```

UI is declarative only — view kinds `markdown`, `list`, `form`, and the
compositional `blocks`, rendered by the app's design system. A list item or
form submit may return `{ view }` to chain deeper, `{ toast }` for a notice,
or `{ close: true }`. Icons are picked by name from the app's curated
Phosphor set. Persistent state goes through `ctx.storage` (namespaced
key-value).

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
