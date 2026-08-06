/**
 * ReadAware plugin template.
 *
 * TypeScript is the recommended authoring path: `bun run build` bundles this
 * file (dependencies included) into `main.js`, which is what the app loads.
 * Type imports are erased at build time, so typing costs nothing at runtime.
 *
 * The full contract lives in `types/plugin-api.d.ts` — every mount point,
 * view kind, and context capability is documented there. Delete what you
 * don't use below, and remove the matching permissions from `manifest.json`
 * (reviews ask for the minimum).
 *
 * Plugins run in a Worker sandbox: no DOM APIs (bundle a pure-JS parser if
 * you need one), and `ctx.network.fetch` bodies must be strings or binary.
 */
import type { PluginContext, PluginModule } from "../../types/plugin-api";

/** Declared settings arrive as ONE object under the storage key "settings". */
type Settings = {
  greeting?: string;
};

function settings(ctx: PluginContext): Settings {
  return ctx.storage.get<Settings>("settings") ?? {};
}

const plugin: PluginModule = {
  activate(ctx: PluginContext) {
    // ── Command palette ──────────────────────────────────────────────────
    // The cheapest mount point: reachable from anywhere, bindable in
    // Settings → Shortcuts. Return { toast } for a notice or { view } to
    // open a host-rendered view.
    ctx.ui.registerCommand({
      id: "hello",
      title: "My Plugin: hello",
      run: () => ({
        toast: `${settings(ctx).greeting ?? "Hello"} from ${ctx.manifest.name}!`,
      }),
    });

    // ── Reader selection menu ────────────────────────────────────────────
    // Runs on the selected passage. Only two outcomes exist inside the
    // reader: a silent toast, or a Dialog view.
    ctx.ui.registerSelectionAction({
      id: "inspect",
      title: "Inspect selection",
      icon: "sparkle",
      run: (input) => ({
        toast: `${input.text.length} chars from “${input.book.title}”`,
      }),
    });

    // ── Shelf header page ────────────────────────────────────────────────
    // An icon button on the shelf top bar opening a full page (reader-side
    // header actions always open popups instead). Views are declared from
    // the host vocabulary — markdown / list / form / detail / blocks — and
    // rendered by the app's design system; plugins never ship UI code.
    // Reading the shelf needs the "shelf:read" permission.
    ctx.ui.registerHeaderAction({
      id: "overview",
      title: "My Plugin",
      icon: "books",
      surface: "shelf",
      presentation: "page",
      view: async () => {
        const books = (await ctx.shelf?.books.list()) ?? [];
        return {
          kind: "list",
          emptyText: "Nothing on the shelf yet.",
          items: books.map((book) => ({
            id: book.id,
            title: book.title,
            subtitle: book.author,
            icon: "book-open",
            onSelect: () => {
              ctx.reader.openBook(book.id);
              return { close: true };
            },
          })),
        };
      },
    });

    // ── Where to go from here (see types/plugin-api.d.ts) ────────────────
    // - Declared settings: add fields to manifest `settings` — they render
    //   as your own section in Settings. `secret` fields store credentials
    //   encrypted (read back via ctx.secrets); `dynamicOptions` selects
    //   resolve their options through ctx.settings.provideOptions.
    // - Agent tools (permission "agent:tools"): ctx.agent.registerTool —
    //   let the reading assistant query your service during chat.
    // - Scheduled work: declare manifest `schedules`, bind with
    //   ctx.schedule.on(id, run).
    // - Read-aloud voices: ctx.audio.registerVoiceProvider turns text into
    //   audio bytes; the app owns playback and fallback.
    // - Virtual books (permission "shelf:write"): registerContentProvider +
    //   addVirtualBook serve chapters on demand — feeds, docs, anything.
    // - Structured private data: ctx.storage.collection(name) — per-document
    //   records with optional book provenance, above the plain KV.
  },
};

export default plugin;
