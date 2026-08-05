/**
 * MIRROR — source of truth: read-aware repo, packages/plugin-types/src/index.ts.
 * Self-contained: the @read-aware/core types the contract builds on are
 * inlined here so plugins get full typing with zero dependencies.
 */
/**
 * @read-aware/plugin-types — the public plugin API contract.
 *
 * ## Construction rules (docs/plugin-system.md §4–§6)
 *
 * The contract is DERIVED from the app's domain model, not authored beside it:
 *
 * 1. **Data surface per domain.** Each domain (shelf — books, collections,
 *    and reading stats as one library-management surface — plus annotations
 *    and conversations) exposes three things:
 *    *reads* mirroring its projection read models, *writes* mirroring exactly
 *    its domain-event verbs (commands issued through the same event-sourced
 *    write path the app itself uses), and *subscriptions* to its domain
 *    events under their canonical names — one vocabulary, no parallel rename.
 * 2. **Permission = domain × access.** `shelf:read`, `annotations:write`, …
 *    Write implies read within a domain. Services (`service:*`) and the agent
 *    tool mount (`agent:tools`) are separate permission families.
 * 3. **Origin on every write.** Plugin writes are stamped
 *    `plugin:<id>` in the event log — auditable, compensatable.
 * 4. **Device-local state and presentation stay closed.** View preferences,
 *    reader appearance, layouts, sync internals are not plugin surface; UI is
 *    declared with the constrained view vocabulary below (markdown / list /
 *    form / blocks) and rendered by the app's design system — plugin surfaces
 *    always look native. Plugins never render JSX or HTML.
 */

// ─── Inlined @read-aware/core vocabulary ─────────────────────────────────────

/** "virtual" marks a plugin-provided book: content served by a provider. */
export type BookFormat = "epub" | "mobi" | "azw3" | "fb2" | "pdf" | "virtual";

export type ReadingStatus = "unread" | "reading" | "finished";

export type HighlightColor = "yellow" | "green" | "blue" | "pink";
export type HighlightStyle = "highlight" | "underline";

export type CoverStatus = "unchecked" | "ready" | "none" | "failed";

/**
 * Which software actor produced an event: a direct user action, the reading
 * agent's runtime, background machinery, or a plugin write.
 */
export type EventOrigin = "user" | "agent" | "system" | `plugin:${string}`;

/** Snapshot of a dictionary entry as produced by the dictionary service. */
export interface DictionaryEntrySnapshot {
  headword: string;
  pronunciation?: string;
  senses: { partOfSpeech: string; definition: string; examples: string[] }[];
  etymology?: string;
  contextualMeaning?: string;
}

// ─── Permissions ─────────────────────────────────────────────────────────────

/**
 * Permission domains a manifest may declare (docs/plugin-system.md §4).
 *
 * - `<domain>:read` / `<domain>:write` — data access per domain; write
 *   implies the domain's read surface. `shelf` covers the whole of library
 *   management: books (incl. content reads), collections, and reading stats.
 * - `ui:themes` — declare app/reader themes and bundled fonts in the
 *   manifest. The only UI contribution that needs a permission: unlike
 *   actions and commands it has visual authority over the whole app, so the
 *   install consent must surface it.
 * - `agent:tools` — register tools on the reading agent.
 * - `service:*` — platform and AI services (network, one-shot LLM,
 *   clipboard).
 *
 * Namespaced storage, UI contributions, session events, the app locale, and
 * ambient reader control are not permissions — every plugin has them.
 */
export type PluginPermission =
  | "ui:themes"
  | "shelf:read"
  | "shelf:write"
  | "annotations:read"
  | "annotations:write"
  | "conversations:read"
  | "agent:tools"
  | "service:network"
  | "service:llm"
  | "service:clipboard";

// ─── Manifest ────────────────────────────────────────────────────────────────

export type PluginManifest = {
  /** Directory name and namespace: lowercase, digits, hyphens. */
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  /** Lowest app version the plugin supports, e.g. "0.3.0". */
  minAppVersion?: string;
  permissions?: PluginPermission[];
  /** Entry module relative to the plugin folder. Defaults to "main.js". */
  main?: string;
  /**
   * Declarative settings: rendered by the app from the Plugins panel; values
   * persist as one object under the plugin's storage key `settings`
   * (read with `ctx.storage.get("settings")`).
   */
  settings?: PluginFormField[];
  /**
   * Declarative schedules (shown at install and in the Plugins panel). The
   * host runs each one AT LEAST every `everyMinutes` while the app is open,
   * with a catch-up run at launch when overdue — never an exact-time
   * guarantee, and nothing runs while the app is closed. Bind the work at
   * activate() via `ctx.schedule.on(id, run)`.
   */
  schedules?: PluginScheduleDeclaration[];
  /**
   * Declarative themes (`ui:themes`). Registered while the plugin is enabled;
   * they appear alongside the built-in choices in Settings → Appearance
   * (app part) and the reader's page-color control (reader part), and apply
   * only when the user selects them. Purely data — the host generates and
   * injects all CSS. Apps without theme support reject the `ui:themes`
   * permission at install, so set `minAppVersion` to the first app version
   * that has it.
   */
  themes?: PluginThemeContribution[];
  /**
   * Font faces bundled with the plugin (`ui:themes`), served from the plugin
   * folder. Each becomes a `plugin:<pluginId>:<fontId>` entry in the reader's
   * font picker; a theme's typography defaults may reference its own fonts
   * as `plugin:<fontId>`. Every declared file must also be listed in the
   * registry entry's `files` so installs fetch it.
   */
  fonts?: PluginFontContribution[];
};

// ─── Theme contributions (`ui:themes`) ───────────────────────────────────────

/**
 * Whether a theme reads as light or dark. Drives everything polarity-keyed in
 * the host: `color-scheme`, the dark token defaults an app theme inherits for
 * tokens it leaves unset, the `dark:` styling variant, and how the reader's
 * "auto" page color resolves while the theme is active.
 */
export type PluginThemePolarity = "light" | "dark";

/**
 * A color in one of the strict grammars the host accepts: `#rgb[a]` /
 * `#rrggbb[aa]` hex, or `rgb()` / `rgba()` / `hsl()` / `hsla()` with numeric
 * bodies only. Anything else — keywords, `var()`, `url()`, gradients — is
 * rejected at manifest validation. The grammar is the injection boundary:
 * these values end up inside host-generated stylesheets.
 */
export type PluginThemeColor = string;

/**
 * The app-chrome token vocabulary a theme may override. Every key is optional:
 * unset tokens keep the host's own values for the theme's polarity, so a
 * near-default theme only states its differences. This vocabulary is a
 * long-term contract (only ever extended, never renamed).
 */
export type PluginAppThemeTokens = {
  /** The app canvas. */
  paper?: PluginThemeColor;
  /** The warmer secondary canvas tint. */
  paperWarm?: PluginThemeColor;
  /** Hairline borders. */
  border?: PluginThemeColor;
  /** Primary text. */
  fg?: PluginThemeColor;
  /** Secondary text. */
  fgMuted?: PluginThemeColor;
  /** Tertiary/disabled text. */
  fgSubtle?: PluginThemeColor;
  /** Text on inverted (fg-colored) surfaces. */
  inverseFg?: PluginThemeColor;
  /** Raised surfaces: cards, dialogs, inputs. */
  surface?: PluginThemeColor;
  /** Quiet fills: hovers, wells, code spans. */
  fill?: PluginThemeColor;
  /** Stronger fills: active states, tracks. */
  fillStrong?: PluginThemeColor;
  /** Emphasized borders. */
  borderStrong?: PluginThemeColor;
  /** The main content surface behind panels. */
  mainSurface?: PluginThemeColor;
  /** Overlay scrollbar thumbs. */
  scrollbar?: PluginThemeColor;
};

/**
 * The six-color palette a reader theme paints book pages with — the same
 * vocabulary the built-in light/warm/dark page colors use. All six are
 * required: book pages have no polarity fallback to inherit from.
 */
export type PluginReaderPalette = {
  /** Page background. */
  bg: PluginThemeColor;
  /** Body text. */
  text: PluginThemeColor;
  /** Text selection background. */
  selection: PluginThemeColor;
  /** Rules and table borders. */
  rule: PluginThemeColor;
  /** Quiet fills (code blocks, inline code). */
  faint: PluginThemeColor;
  /** De-emphasized ink: link underlines, list markers, captions. */
  muted: PluginThemeColor;
};

export type PluginReaderFontSize =
  | "xx-small"
  | "x-small"
  | "small"
  | "medium"
  | "large"
  | "x-large"
  | "xx-large"
  | "xxx-large";
export type PluginReaderFontWeight = "light" | "regular" | "medium" | "bold";
export type PluginReaderLineSpacing = "compact" | "comfortable" | "relaxed";
export type PluginReaderParagraphSpacing = "tight" | "normal" | "loose";

/**
 * Typography a reader theme suggests. Applied as a one-shot preset when the
 * user SELECTS the theme — seeding the ordinary reader settings, which the
 * user can then adjust freely (re-selecting the theme re-applies). Never a
 * live constraint.
 *
 * `fontFamily` accepts `plugin:<fontId>` (a font this manifest declares),
 * `curated:<id>` (a host curated font), or `system:<family>`.
 */
export type PluginReaderTypographyDefaults = {
  fontFamily?: string;
  fontSize?: PluginReaderFontSize;
  fontWeight?: PluginReaderFontWeight;
  lineSpacing?: PluginReaderLineSpacing;
  paragraphSpacing?: PluginReaderParagraphSpacing;
};

/**
 * One named theme. The two mount points are independent and optional — a
 * theme may skin only the app chrome, only the book page, or both; each part
 * is offered only on the surface it targets.
 */
export type PluginThemeContribution = {
  /** Theme id within the plugin: lowercase, digits, hyphens. */
  id: string;
  /** Display name in the theme pickers. */
  name: PluginText;
  polarity: PluginThemePolarity;
  /** App-chrome token overrides (Settings → Appearance). */
  app?: PluginAppThemeTokens;
  /** Book-page palette and optional typography preset (reader page color). */
  reader?: {
    palette: PluginReaderPalette;
    typography?: PluginReaderTypographyDefaults;
  };
};

/**
 * One font face file inside the plugin folder. `path` is folder-relative
 * (forward slashes, `[A-Za-z0-9._-]` segments, no leading dots) and must end
 * in `.woff2`, `.woff`, `.ttf`, or `.otf`.
 */
export type PluginFontFile = {
  path: string;
  /** CSS numeric weight of this face. Defaults to 400. */
  weight?: number;
  /** Defaults to "normal". */
  style?: "normal" | "italic";
  /** Optional `unicode-range` for split/subset files. */
  unicodeRange?: string;
};

/**
 * A font bundled with the plugin. Its faces are served straight from the
 * plugin folder (no download step); the host writes the `@font-face` rules
 * and lists the family in the reader's font picker while the plugin is
 * enabled.
 */
export type PluginFontContribution = {
  /** Font id within the plugin: lowercase, digits, hyphens. */
  id: string;
  /** CSS font-family name; also the picker label. */
  family: string;
  /** Chooses the generic fallback stack appended after the family. */
  kind?: "sans" | "serif" | "cjk";
  files: PluginFontFile[];
};

export type PluginLocalizedText = {
  default: string;
  translations?: Record<string, string>;
};

/**
 * User-visible copy a contribution carries: a plain string, or a localized
 * bundle resolved against the app locale (exact tag, then base language,
 * then `default`). Contribution titles and tool labels accept this shape.
 */
export type PluginText = string | PluginLocalizedText;

/** Returned by every `register*`/`on` call; disposing removes the contribution. */
export type PluginDisposable = { dispose: () => void };

// ─── View vocabulary ─────────────────────────────────────────────────────────

export type PluginMarkdownView = {
  kind: "markdown";
  title?: string;
  markdown: string;
};

export type PluginListItem = {
  id: string;
  title: string;
  subtitle?: string;
  /** Icon name from the curated Phosphor set. */
  icon?: string;
  /** Optional drill-down: return `{ view }` to push a detail view. */
  onSelect?: () => PluginViewResult | Promise<PluginViewResult>;
};

export type PluginListView = {
  kind: "list";
  title?: string;
  items: PluginListItem[];
  /** Shown when `items` is empty. */
  emptyText?: string;
};

/** The floor the host clamps `everyMinutes` to. */
export declare const MIN_SCHEDULE_MINUTES = 15;

export type PluginScheduleDeclaration = {
  /** Unique within the plugin: lowercase letters, digits, hyphens. */
  id: string;
  /** Shown at install time and in the Plugins panel. */
  label: string;
  /** Cadence in minutes, floored at MIN_SCHEDULE_MINUTES. */
  everyMinutes: number;
};

/** `agentHidden` keeps a declared setting out of the reading agent's settings
 *  catalog (the Plugins panel still shows it); `inputMode: "password"` text
 *  fields are agent-hidden automatically. Real credentials belong in
 *  `ctx.secrets`, not in settings. */
/** `agentHidden` keeps a declared setting out of the reading agent's settings
 *  catalog (the Plugins panel still shows it); `inputMode: "password"` text
 *  fields are agent-hidden automatically. Real credentials belong in
 *  `ctx.secrets`, not in settings. */
export type PluginFormField = { agentHidden?: boolean } & (
  | {
      kind: "text";
      id: string;
      label: string;
      value?: string;
      placeholder?: string;
      helperText?: string;
      inputMode?: "text" | "email" | "url" | "password";
    }
  | {
      kind: "textarea";
      id: string;
      label: string;
      value?: string;
      placeholder?: string;
      helperText?: string;
      rows?: number;
    }
  | {
      kind: "number";
      id: string;
      label: string;
      value?: number;
      helperText?: string;
      min?: number;
      max?: number;
      step?: number;
    }
  | {
      kind: "select";
      id: string;
      label: string;
      value?: string;
      options: { value: string; label: string }[];
    }
  | { kind: "toggle"; id: string; label: string; value?: boolean }
  | { kind: "checkbox"; id: string; label: string; description?: string; value?: boolean }
  | {
      kind: "choice";
      id: string;
      label: string;
      value?: string;
      options: { value: string; label: string; icon?: string }[];
    }
);

export type PluginFormValues = Record<string, string | boolean | number>;

export type PluginFormView = {
  kind: "form";
  title?: string;
  fields: PluginFormField[];
  submitLabel?: string;
  onSubmit: (values: PluginFormValues) => PluginViewResult | Promise<PluginViewResult>;
};

/**
 * The compositional view: an ordered sequence of blocks. This is the growth
 * path of the vocabulary — richer surfaces come from new block kinds, not
 * from plugins drawing their own UI. The single-kind views above remain as
 * shorthands for one-block pages.
 */
export type PluginBlocksView = {
  kind: "blocks";
  title?: string;
  blocks: PluginBlock[];
};

export type PluginBlock =
  | { kind: "markdown"; markdown: string }
  /** A section header: quiet eyebrow caption over an optional line of text. */
  | { kind: "heading"; text: string; caption?: string }
  /** A dictionary entry, rendered with the app's own dictionary UX. */
  | { kind: "dictionary"; entry: PluginDictionaryEntry }
  /** Label/value rows (provenance, metadata) in a quiet definition list. */
  | { kind: "keyValue"; rows: { label: string; value: string }[] }
  /** A quoted passage with an optional attribution line. */
  | { kind: "quote"; text: string; caption?: string }
  /** A row of buttons; each runs like any other contribution outcome. */
  | {
      kind: "actions";
      actions: {
        id: string;
        label: string;
        icon?: string;
        variant?: "solid" | "outline" | "ghost" | "danger";
        run: () => PluginViewResult | Promise<PluginViewResult>;
      }[];
    }
  | { kind: "divider" }
  /**
   * A constrained horizontal layout — 2–4 cells side by side, each holding
   * its own block, with relative `weight` (default 1) sizing the columns.
   * The design system owns the gaps, alignment, and (below a narrow width)
   * the collapse back into a vertical stack. Cells hold ordinary blocks; a
   * cell's block may NOT itself be a `row` (one level deep).
   */
  | { kind: "row"; cells: PluginRowCell[]; align?: "start" | "center" | "baseline" }
  | PluginListView
  | PluginFormView;

/** One column of a `row` block. */
export type PluginRowCell = {
  /** Relative width among the row's cells (default 1); clamped to >= 0. */
  weight?: number;
  block: PluginRowCellBlock;
};

/** Blocks allowed inside a row cell — every block kind except a nested row. */
export type PluginRowCellBlock = Exclude<PluginBlock, { kind: "row" }>;

export type PluginView =
  | PluginMarkdownView
  | PluginListView
  | PluginFormView
  | PluginBlocksView;

/**
 * What an action / list-select / form-submit may produce:
 * - `undefined` / `null` — nothing happens (surface stays as is);
 * - `{ toast }` — a transient notice;
 * - `{ view }` — open (or push onto) the surface with this view;
 * - `{ close: true }` — dismiss the surface (composable with `toast`);
 * - `{ fieldErrors }` (from a form submit) — stay on the form and show the
 *   errors under their fields.
 */
export type PluginViewResult =
  | void
  | undefined
  | null
  | {
      toast?: string;
      view?: PluginView;
      close?: boolean;
      fieldErrors?: Record<string, string>;
    };

// ─── UI contributions ────────────────────────────────────────────────────────

/** Where a selection action was triggered from. */
export type SelectionActionSource = "selection" | "annotation" | "navigator";

export type SelectionActionInput = {
  text: string;
  /** CFI range of the selection/annotation, when the engine can anchor it. */
  cfiRange: string | null;
  chapterHref: string | null;
  book: { id: string; title: string; author?: string };
  source: SelectionActionSource;
};

/**
 * An entry in the reader's selection/annotation action menus. Runs silently
 * (`toast` feedback) or opens a Dialog (`view` result) — the only two outcomes
 * allowed inside the reader.
 */
export type PluginSelectionAction = {
  id: string;
  title: PluginText;
  icon?: string;
  run: (input: SelectionActionInput) => PluginViewResult | Promise<PluginViewResult>;
};

export type PluginHeaderSurface = "shelf" | "reader";

export type HeaderActionInput = {
  /** Present on the reader surface: the open book. */
  book?: { id: string; title: string; author?: string };
};

/**
 * An icon button on a header bar. On the reader surface the view always opens
 * as an anchored Popup; on the shelf it opens as a Popup or a full Page,
 * per `presentation`.
 */
export type PluginHeaderAction = {
  id: string;
  title: PluginText;
  icon?: string;
  surface: PluginHeaderSurface;
  /** Shelf only — the reader never allows full-page interruptions. */
  presentation?: "popup" | "page";
  view: (input: HeaderActionInput) => PluginView | Promise<PluginView>;
};

/**
 * A key chord for a command's default binding. `mod` is the platform command
 * key (⌘ on macOS, Ctrl elsewhere); `key` is a `KeyboardEvent.key`, single
 * characters lowercased.
 */
export type PluginShortcut = {
  key: string;
  mod?: boolean;
  alt?: boolean;
  shift?: boolean;
};

/** A command-palette entry. */
export type PluginCommand = {
  id: string;
  title: PluginText;
  icon?: string;
  /** Extra text folded into palette matching. */
  keywords?: string;
  /**
   * Optional default key binding. Every registered command is bindable in
   * Settings → Shortcuts whether or not it declares one; the user can rebind
   * it there, and their override wins over this default.
   */
  defaultShortcut?: PluginShortcut;
  run: () => PluginViewResult | Promise<PluginViewResult>;
};

/**
 * A tool exposed to the reading agent. `parameters` is plain JSON Schema for
 * the arguments object; omit it for a no-argument tool. The registered tool is
 * namespaced `plugin_<pluginId>_<name>` before it reaches the model.
 */
export type PluginToolDefinition = {
  /** snake_case identifier, unique within the plugin. */
  name: string;
  /** Short human label shown in the chat's tool activity row. */
  label?: PluginText;
  description: string;
  parameters?: Record<string, unknown>;
  /**
   * Resolve with any JSON value — it is serialized as the tool result the
   * model reads. Resolve with `{ gist, wordCards }` (PluginToolWordCards) to
   * additionally render word cards in the chat turn: the reader sees the full
   * entries as cards at the tool's position, the model sees only `gist`.
   */
  execute: (params: Record<string, unknown>) => unknown | Promise<unknown>;
};

/** One word card a tool result can carry (full entry, host-rendered). */
export type PluginToolWordCard = {
  /** The headword, in its original language. */
  term: string;
  /** Human-readable name of the language the entry explains in. */
  language: string;
  entry: PluginDictionaryEntry;
};

/**
 * Card-carrying tool result: `gist` is what the model receives (keep it to a
 * one-line summary — the card IS the content); `wordCards` render as word
 * cards in the chat.
 */
export type PluginToolWordCards = {
  gist: unknown;
  wordCards: PluginToolWordCard[];
};

// ─── Events ──────────────────────────────────────────────────────────────────

/**
 * Canonical payloads of the domain events plugins can subscribe to, keyed by
 * the event's canonical name (the app's event catalog, events.ts).
 */
export type PluginDomainEventPayloadMap = {
  "book.imported": {
    bookId: string;
    title: string;
    author?: string;
    format: BookFormat;
    fileName: string;
    mimeType?: string;
    fileSize: number;
    sourceBlobKey: string;
    sourceSha256?: string;
  };
  "book.metadataEdited": { bookId: string; title?: string; author?: string };
  "book.coverExtracted": { bookId: string; status: CoverStatus; coverBlobKey?: string };
  "book.opened": { bookId: string };
  "book.starred": { bookId: string; starred: boolean };
  /** The reader's own "I finished this" verdict; distinct from reaching 100%. */
  "book.finished": { bookId: string; finished: boolean };
  "book.removed": { bookId: string };
  "collection.created": { collectionId: string; name: string };
  "collection.renamed": { collectionId: string; name: string };
  "collection.removed": { collectionId: string };
  "book.addedToCollection": { bookId: string; collectionId: string };
  "book.removedFromCollection": { bookId: string; collectionId: string };
  "book.progressed": {
    bookId: string;
    locator: string;
    chapterHref?: string;
    currentLocation?: number;
    totalLocations?: number;
    progressPercent?: number;
    status?: ReadingStatus;
  };
  "book.timeRecorded": {
    bookId: string;
    ms: number;
    atEpochMs: number;
    localDay: string;
    localHour: number;
  };
  "highlight.created": {
    highlightId: string;
    bookId: string;
    anchor?: string;
    chapterHref?: string;
    text: string;
    color?: HighlightColor;
    style?: HighlightStyle;
  };
  "highlight.recolored": { highlightId: string; color: HighlightColor; style?: HighlightStyle };
  "highlight.removed": { highlightId: string };
  "note.created": {
    noteId: string;
    bookId: string;
    highlightId?: string;
    anchor?: string;
    chapterHref?: string;
    quotedText?: string;
    body: string;
  };
  "note.updated": { noteId: string; body: string };
  "note.removed": { noteId: string };
  "ask.recorded": {
    askId: string;
    bookId: string;
    anchor?: string;
    chapterHref?: string;
    text: string;
  };
  "ask.removed": { askId: string };
  "aiConversation.started": {
    conversationId: string;
    /** Absent on global (Context page) threads. */
    bookId?: string;
    title?: string;
  };
  "aiMessage.appended": {
    messageId: string;
    conversationId: string;
    role: "user" | "assistant";
    seq: number;
    content: string;
    model?: string;
    attachments?: Array<{
      attachmentId: string;
      kind?: "selection";
      text: string;
      anchor?: string;
      chapterHref?: string;
    }>;
  };
  /** A message left the transcript (retry/regenerate truncation). */
  "aiMessage.removed": { messageId: string; conversationId: string };
  "aiConversation.cleared": { conversationId: string };
};

export type DomainEventType = keyof PluginDomainEventPayloadMap;

/**
 * A domain event as delivered to a plugin subscription: the canonical type +
 * payload, with the software-actor origin and display timestamp. Persistence
 * internals (HLC, event ids) are not part of the plugin surface.
 */
export type PluginDomainEvent<K extends DomainEventType = DomainEventType> = {
  [T in DomainEventType]: {
    type: T;
    payload: PluginDomainEventPayloadMap[T];
    createdAt: string;
    origin: EventOrigin;
  };
}[K];

/** Subscribe helper: one domain's event names, canonical, fully typed. */
export type DomainSubscribe<E extends DomainEventType> = <K extends E>(
  event: K,
  handler: (event: PluginDomainEvent<K>) => void,
  options?: {
    /**
     * Skip events produced by this plugin's own writes (origin
     * `plugin:<id>`). Default false — by default you hear your own echoes.
     */
    ignoreSelf?: boolean;
  },
) => PluginDisposable;

/** Everything library management emits — books, collections, reading facts. */
export type ShelfDomainEventType =
  | "book.imported"
  | "book.metadataEdited"
  | "book.coverExtracted"
  | "book.opened"
  | "book.starred"
  | "book.finished"
  | "book.removed"
  | "collection.created"
  | "collection.renamed"
  | "collection.removed"
  | "book.addedToCollection"
  | "book.removedFromCollection"
  | "book.progressed"
  | "book.timeRecorded";

export type AnnotationDomainEventType =
  | "highlight.created"
  | "highlight.recolored"
  | "highlight.removed"
  | "note.created"
  | "note.updated"
  | "note.removed"
  | "ask.recorded"
  | "ask.removed";

export type ConversationDomainEventType =
  | "aiConversation.started"
  | "aiMessage.appended"
  | "aiMessage.removed"
  | "aiConversation.cleared";

/**
 * Session facts — runtime state of the open reader, NOT domain events (they
 * describe what is on screen, never enter the event log, and need no
 * permission). `book.opened` the domain event exists separately under
 * `books.on` because opening also mutates domain state (last-opened recency).
 */
export type PluginSessionEventMap = {
  "book-opened": { book: { id: string; title: string; author?: string } };
  "book-closed": { bookId: string };
  "chapter-changed": { bookId: string; chapterHref: string | null };
  /** Fires on page turns; fraction is 0..1. */
  "reading-progress": { bookId: string; fraction: number };
};

export type PluginSessionEventName = keyof PluginSessionEventMap;

// ─── Read models (projections as plugins see them) ───────────────────────────

export type PluginBook = {
  id: string;
  title: string;
  author?: string;
  format: BookFormat;
  starred: boolean;
  /** Single-membership collection, or null when ungrouped. */
  collectionId: string | null;
  addedAt: string;
  updatedAt: string;
  lastOpenedAt?: string;
  /** Original import file name/size; absent on virtual books. */
  fileName?: string;
  fileSize?: number;
};

export type PluginCollection = {
  id: string;
  name: string;
  createdAt: string;
};

export type PluginHighlight = {
  kind: "highlight";
  id: string;
  bookId: string;
  text: string;
  /** Range anchor (EPUB CFI / PDF locator); absent when unanchorable. */
  anchor?: string;
  chapterHref?: string;
  color: HighlightColor;
  style: HighlightStyle;
  createdAt: string;
  updatedAt: string;
};

export type PluginNote = {
  kind: "note";
  id: string;
  bookId: string;
  /** The passage the note anchors to, when it quotes one. */
  quotedText?: string;
  body: string;
  anchor?: string;
  chapterHref?: string;
  createdAt: string;
  updatedAt: string;
};

/** A passive trace of a question asked in the book thread (agent-written). */
export type PluginAsk = {
  kind: "ask";
  id: string;
  bookId: string;
  text: string;
  anchor?: string;
  chapterHref?: string;
  createdAt: string;
};

export type PluginAnnotation = PluginHighlight | PluginNote | PluginAsk;

/** One book through the shelf's stats face: position, status, and time. */
export type PluginBookStats = {
  bookId: string;
  /** 0..100. */
  progressPercent: number;
  status: ReadingStatus;
  /** Format-neutral position (EPUB CFI or PDF locator), when recorded. */
  locator?: string;
  chapterHref?: string;
  currentLocation?: number;
  totalLocations?: number;
  /** Cumulative active reading time in ms. */
  totalMs: number;
  firstReadAt?: string;
  lastReadAt?: string;
  /** Active ms per local day, keyed YYYY-MM-DD. */
  daily: Record<string, number>;
};

/** Whole-shelf aggregate over every book's recorded reading. */
export type PluginStatsOverview = {
  totalMs: number;
  /** Active ms per local day across all books, keyed YYYY-MM-DD. */
  daily: Record<string, number>;
  firstReadAt?: string;
  lastReadAt?: string;
  /** Books currently in progress (status "reading"). */
  booksReading: number;
  booksFinished: number;
};

/**
 * A structured dictionary entry — the shape the `dictionary` view block and
 * word-card tool results render with the app's own dictionary UX. Producing
 * entries is plugin business (e.g. via `llm.ask` with a schema); this is the
 * presentation contract.
 */
export type PluginDictionaryEntry = DictionaryEntrySnapshot;


export type PluginChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type PluginThreadSummary = {
  id: string;
  title?: string;
  updatedAt?: string;
};

export type PluginChapterRef = {
  index: number;
  title?: string;
  /** Plain-text length, for budgeting reads. */
  chars: number;
};

export type PluginBookContent = {
  title?: string;
  author?: string;
  language?: string;
  sections: { id?: string; title?: string; html: string }[];
};

// ─── Domain APIs ─────────────────────────────────────────────────────────────

/**
 * Shelf — the whole of library management under one permission domain.
 * `shelf:read` grants the read surface; `shelf:write` additionally grants
 * the `write` faces (and implies read). Chapter text/TOC are content-layer
 * reads over the imported file (extraction runs on demand). Stats are
 * read-only for every actor: their domain events are recorded facts of
 * reader activity, not user-intent commands.
 */
export type PluginShelfApi = {
  books: {
    list(): Promise<PluginBook[]>;
    get(bookId: string): Promise<PluginBook | null>;
    getToc(bookId: string): Promise<PluginChapterRef[]>;
    /** Plain text of one chapter by its toc index; null when unavailable. */
    getChapterText(bookId: string, chapterIndex: number): Promise<string | null>;
    /** Present with `shelf:write`. Commands mirror the book domain-event verbs. */
    write?: {
      /** Import a real file; the result is a first-class book. */
      import(input: { fileName: string; data: ArrayBuffer | Uint8Array }): Promise<PluginBook>;
      editMetadata(bookId: string, patch: { title?: string; author?: string }): Promise<void>;
      setStarred(bookId: string, starred: boolean): Promise<void>;
      /** The reader's "I finished this" verdict; sticky against further reading. */
      setFinished(bookId: string, finished: boolean): Promise<void>;
      /**
       * Remove a book from the shelf — irreversible for the source file. The
       * removal is logged with this plugin's origin.
       */
      remove(bookId: string): Promise<void>;
      /**
       * Content-provider path — no file at all. Register a provider, then add
       * virtual books bound to it: shelf entries whose content the plugin
       * serves at open time (sections of HTML). The reader paginates,
       * annotates, and tracks progress on them like any book. Virtual books
       * are device-local (their content depends on this plugin being
       * installed), so they stay outside the synced event log.
       */
      registerContentProvider(provider: {
        id: string;
        load(key: string): Promise<PluginBookContent>;
      }): PluginDisposable;
      addVirtualBook(input: {
        providerId: string;
        /** Stable identity within the provider (e.g. the feed URL). */
        key: string;
        title: string;
        author?: string;
      }): Promise<PluginBook>;
      removeVirtualBook(input: { providerId: string; key: string }): Promise<void>;
    };
  };
  /** The shelf's user-defined groups (single-membership today). */
  collections: {
    list(): Promise<PluginCollection[]>;
    /** Ids of the books currently in a collection. */
    booksIn(collectionId: string): Promise<string[]>;
    /** Present with `shelf:write`. */
    write?: {
      create(name: string): Promise<PluginCollection>;
      rename(collectionId: string, name: string): Promise<void>;
      /** Delete the collection; its books stay, ungrouped. */
      remove(collectionId: string): Promise<void>;
      /** Assign books to a collection, or `null` to ungroup them. */
      assignBooks(bookIds: string[], collectionId: string | null): Promise<void>;
    };
  };
  /** Positions, statuses, and active reading time — per book and aggregate. */
  stats: {
    forBook(bookId: string): Promise<PluginBookStats | null>;
    list(): Promise<PluginBookStats[]>;
    /** Whole-shelf aggregate: total time, per-day time, status counts. */
    overview(): Promise<PluginStatsOverview>;
  };
  on: DomainSubscribe<ShelfDomainEventType>;
};

/**
 * Annotations — highlights, notes, and asks. Asks are read-only: they are the
 * agent runtime's passive traces, not a plugin-writable kind.
 */
export type PluginAnnotationsApi = {
  list(filter?: {
    bookId?: string;
    kind?: "highlight" | "note" | "ask";
    query?: string;
  }): Promise<PluginAnnotation[]>;
  on: DomainSubscribe<AnnotationDomainEventType>;
  /** Present with `annotations:write`. */
  write?: {
    createHighlight(input: {
      bookId: string;
      text: string;
      anchor?: string | null;
      chapterHref?: string | null;
      color?: HighlightColor;
      style?: HighlightStyle;
    }): Promise<PluginHighlight>;
    recolorHighlight(highlightId: string, color: HighlightColor): Promise<void>;
    removeHighlight(highlightId: string): Promise<void>;
    createNote(input: {
      bookId: string;
      body: string;
      quotedText?: string;
      anchor?: string | null;
      chapterHref?: string | null;
    }): Promise<PluginNote>;
    updateNote(noteId: string, body: string): Promise<void>;
    removeNote(noteId: string): Promise<void>;
  };
};

/**
 * Conversations — read-only view over the user's AI threads (one persistent
 * thread per book, plus user-created global threads). Writes stay with the
 * chat runtime; its dual-write is what feeds `on`.
 */
export type PluginConversationsApi = {
  /** The book's persistent thread, oldest first; empty when none. */
  getBookThread(bookId: string): Promise<PluginChatMessage[]>;
  /** User-created global (Context page) threads. */
  listThreads(): Promise<PluginThreadSummary[]>;
  getThread(threadId: string): Promise<PluginChatMessage[]>;
  on: DomainSubscribe<ConversationDomainEventType>;
};

// ─── Context handed to activate() ────────────────────────────────────────────

export type PluginStorage = {
  get<T = unknown>(key: string): T | null;
  set(key: string, value: unknown): void;
  remove(key: string): void;
  /**
   * A named document collection — structured plugin-private data one tier
   * above the KV (queryable, per-document, optionally book-anchored).
   * Lifecycle belongs to the plugin (uninstall clears it). `bookId`/`anchor`
   * are provenance INDEXES, not ownership — documents survive the referenced
   * book's deletion.
   */
  collection(name: string): PluginDocumentCollection;
};

export type PluginDocument<T = unknown> = {
  id: string;
  data: T;
  bookId?: string;
  anchor?: string;
  /** ISO timestamp of the last write. */
  updatedAt: string;
};

export type PluginDocumentCollection = {
  put(id: string, data: unknown, options?: { bookId?: string; anchor?: string }): Promise<void>;
  get<T = unknown>(id: string): Promise<PluginDocument<T> | null>;
  delete(id: string): Promise<void>;
  /** Newest-first by default. */
  list<T = unknown>(filter?: {
    bookId?: string;
    limit?: number;
    oldestFirst?: boolean;
  }): Promise<PluginDocument<T>[]>;
};

/**
 * Everything a plugin can reach. Capability groups guarded by a permission
 * are absent unless the manifest declares it — API-level gating against
 * accidental overreach (the trust boundary is installation, see
 * docs/plugin-system.md §2). Within a data domain, `write` implies read.
 */
export type PluginContext = {
  readonly manifest: Readonly<PluginManifest>;
  readonly appVersion: string;
  /**
   * The app UI's current locale (BCP-47, e.g. "zh-Hans"). Tracks the user's
   * language setting live — read it at use time, don't copy it at activate().
   */
  readonly locale: string;
  /** Namespaced key-value storage, persisted with the app's local data. */
  storage: PluginStorage;
  /**
   * Encrypted credential storage, namespaced per plugin — for API tokens and
   * similar. Values live in the app's encrypted secret store: outside SQLite,
   * outside backups, invisible to other plugins. Like the KV, they survive
   * uninstall so a reinstall finds its credentials again. Async by design —
   * read at use time, not at activate().
   */
  secrets: {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    remove(key: string): Promise<void>;
  };
  ui: {
    registerSelectionAction(action: PluginSelectionAction): PluginDisposable;
    registerHeaderAction(action: PluginHeaderAction): PluginDisposable;
    registerCommand(command: PluginCommand): PluginDisposable;
    showToast(message: string): void;
    /** Host save flow for a plugin-generated file. Resolves false on cancel. */
    exportFile(file: {
      /** Suggested basename shown by the host save dialog. */
      filename: string;
      /** UTF-8 text, or raw bytes for binary formats (.apkg, images, …). */
      content: string | Uint8Array | ArrayBuffer;
      mimeType?: string;
    }): Promise<boolean>;
  };
  /**
   * Bind the work for a schedule declared in `manifest.schedules`. The host
   * owns all timing; overlapping runs of one schedule are skipped, and a
   * failed run waits for the next cadence. Binding an undeclared id throws.
   */
  schedule: {
    on(scheduleId: string, run: () => void | Promise<void>): PluginDisposable;
  };
  /**
   * Ambient reader control (user-visible, no data exposure): open a book,
   * jump to a CFI or chapter href. `goTo` without `bookId` targets the open
   * book; with one, it opens that book first.
   */
  reader: {
    openBook(bookId: string): void;
    goTo(target: { bookId?: string; cfi?: string; href?: string }): void;
  };
  /** Session facts of the open reader (ambient, permission-free). */
  session: {
    on<K extends PluginSessionEventName>(
      event: K,
      handler: (payload: PluginSessionEventMap[K]) => void,
    ): PluginDisposable;
  };
  /** `shelf:read` or `shelf:write` — books, collections, and reading stats. */
  shelf?: PluginShelfApi;
  /** `annotations:read` or `annotations:write`. */
  annotations?: PluginAnnotationsApi;
  /** `conversations:read`. */
  conversations?: PluginConversationsApi;
  /** `agent:tools` — extend the reading agent. */
  agent?: {
    registerTool(tool: PluginToolDefinition): PluginDisposable;
  };
  /** `service:network` — the Rust HTTP client: no CORS; https + localhost scope. */
  network?: {
    fetch(input: string | URL | Request, init?: RequestInit): Promise<Response>;
  };
  /**
   * `service:llm` — a one-shot model call on the user's configured account
   * (fast tier by default) — no thread, no memory, no tools. Rejects when AI
   * is not configured.
   *
   * With `schema` (JSON Schema: type/properties/required/items/enum) the host
   * runs structured mode: it instructs the model to answer with JSON only,
   * parses and validates the reply, retries once with the violation list, and
   * resolves with the parsed object — the plugin never sees raw model text.
   */
  llm?: {
    ask(input: {
      prompt: string;
      system?: string;
      /** Model tier on the user's account; defaults to "fast". */
      model?: "fast" | "smart";
      /** Streams text deltas as they arrive; the promise resolves the full text. */
      onText?: (delta: string) => void;
    }): Promise<string>;
    ask(input: {
      prompt: string;
      system?: string;
      model?: "fast" | "smart";
      schema: Record<string, unknown>;
    }): Promise<unknown>;
  };
  /** `service:clipboard`. */
  clipboard?: {
    writeText(text: string): Promise<void>;
  };
};

/** The default export of a plugin's entry module. */
export type PluginModule = {
  activate(ctx: PluginContext): void | Promise<void>;
  deactivate?(): void | Promise<void>;
};
