/**
 * ReadAware plugin template.
 *
 * TypeScript is the recommended authoring path: `bun run build` bundles this
 * file (dependencies included) into `main.js`, which is what the app loads.
 * Type imports are erased at build time, so typing costs nothing at runtime.
 *
 * The full contract lives in `types/plugin-api.d.ts` (imported below as
 * `@readaware/plugin-api`) — every mount point, view kind, and context
 * capability is documented there, generated from the ReadAware release named
 * in its header. Delete what you don't use below, then remove the matching
 * permissions and `requires` entries from `manifest.json` (reviews ask for the
 * minimum). AGENTS.md at the repository root is the complete authoring guide.
 *
 * Plugins run in a Worker sandbox: no DOM APIs (bundle a pure-JS parser if
 * you need one), and network-service bodies must be strings or binary.
 */
import type { PluginContext, PluginModule } from "@readaware/plugin-api";

/** Declared settings arrive as ONE object under the storage key "settings". */
type Settings = {
  greeting?: string;
};

function settings(ctx: PluginContext): Settings {
  return ctx.services.storage.get<Settings>("settings") ?? {};
}

const plugin: PluginModule = {
  activate(ctx: PluginContext) {
    const library = ctx.domains.library;
    const readingCommands = ctx.domains.reading?.commands;
    if (!library || !readingCommands) {
      throw new Error("My Plugin requires library:read and reading:write");
    }
    // ── Command palette ──────────────────────────────────────────────────
    // The cheapest mount point: reachable from anywhere and bindable in
    // Settings → Shortcuts. `defaultShortcut` is optional; pick a chord that
    // no built-in uses (types/host-capabilities.json → builtInShortcuts) —
    // a chord two shortcuts share runs neither until the user rebinds one.
    // Return { toast } for a notice or { view } to open a host-rendered view.
    ctx.contributions.commands.register({
      id: "hello",
      title: "My Plugin: hello",
      defaultShortcut: { key: "h", mod: true, alt: true },
      run: () => ({
        toast: `${settings(ctx).greeting ?? "Hello"} from ${ctx.manifest.name}!`,
      }),
    });

    // ── Reader selection menu ────────────────────────────────────────────
    // Runs on the selected passage. Only two outcomes exist inside the
    // reader: a silent toast, or a Dialog view.
    ctx.contributions.selectionActions.register({
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
    // Reading the library needs the "library:read" permission.
    ctx.contributions.headerActions.register({
      id: "overview",
      title: "My Plugin",
      icon: "books",
      surface: "shelf",
      presentation: "page",
      view: async () => {
        const books = await library.queries.books.list();
        return {
          kind: "list",
          emptyText: "Nothing on the shelf yet.",
          items: books.map((book) => ({
            id: book.id,
            title: book.title,
            subtitle: book.author,
            icon: "book-open",
            onSelect: () => {
              readingCommands.openBook(book.id);
              return { close: true };
            },
          })),
        };
      },
    });

    // ── Where to go from here (see types/plugin-api.d.ts) ────────────────
    // - Declared settings: add fields to manifest `settings` — they render
    //   as your own section in Settings. `secret` fields store credentials
    //   encrypted (read back through services.secrets); `dynamicOptions`
    //   selects resolve through contributions.settingsOptions.
    // - Agent tools (permission "agent:tools"): contributions.agentTools —
    //   let the reading assistant query your service during chat.
    // - Scheduled work: declare manifest `schedules`, bind with
    //   services.schedules.bind(id, run).
    // - Read-aloud voices: contributions.voiceProviders turns text into
    //   audio bytes; the app owns playback and fallback.
    // - Virtual books (permission "library:write"): contentProviders +
    //   addVirtualBook serve chapters on demand — feeds, docs, anything.
    // - Structured private data: services.storage.collection(name) — per-document
    //   records with optional book provenance, above the plain KV.
  },
};

export default plugin;
