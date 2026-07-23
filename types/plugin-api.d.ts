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
 * 1. **Data surface per domain.** Each domain (books, collections,
 *    annotations, reading, conversations) exposes three things:
 *    *reads* mirroring its projection read models, *writes* mirroring exactly
 *    its domain-event verbs (commands issued through the same event-sourced
 *    write path the app itself uses), and *subscriptions* to its domain
 *    events under their canonical names — one vocabulary, no parallel rename.
 * 2. **Permission = domain × access.** `books:read`, `annotations:write`, …
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
 *   implies the domain's read surface.
 * - `agent:tools` — register tools on the reading agent.
 * - `service:*` — platform and AI services (network, one-shot LLM, the
 *   built-in dictionary, clipboard).
 *
 * Namespaced storage, UI contributions, session events, and ambient reader
 * control are not permissions — every plugin has them.
 */
export type PluginPermission =
  | "books:read"
  | "books:write"
  | "collections:read"
  | "collections:write"
  | "annotations:read"
  | "annotations:write"
  | "reading:read"
  | "conversations:read"
  | "agent:tools"
  | "service:network"
  | "service:llm"
  | "service:dictionary"
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
};

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

export type PluginFormField =
  | { kind: "text"; id: string; label: string; value?: string; placeholder?: string }
  | { kind: "textarea"; id: string; label: string; value?: string; placeholder?: string; rows?: number }
  | { kind: "number"; id: string; label: string; value?: number; min?: number; max?: number; step?: number }
  | {
      kind: "select";
      id: string;
      label: string;
      value?: string;
      options: { value: string; label: string }[];
    }
  | { kind: "toggle"; id: string; label: string; value?: boolean };

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
  | PluginListView
  | PluginFormView;

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
  title: string;
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
  title: string;
  icon?: string;
  surface: PluginHeaderSurface;
  /** Shelf only — the reader never allows full-page interruptions. */
  presentation?: "popup" | "page";
  view: (input: HeaderActionInput) => PluginView | Promise<PluginView>;
};

/** A command-palette entry. */
export type PluginCommand = {
  id: string;
  title: string;
  icon?: string;
  /** Extra text folded into palette matching. */
  keywords?: string;
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
  label?: string;
  description: string;
  parameters?: Record<string, unknown>;
  execute: (params: Record<string, unknown>) => unknown | Promise<unknown>;
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
  "book.removed": { bookId: string };
  "collection.created": { collectionId: string; name: string };
  "collection.renamed": { collectionId: string; name: string };
  "collection.removed": { collectionId: string };
  "book.addedToCollection": { bookId: string; collectionId: string };
  "book.removedFromCollection": { bookId: string; collectionId: string };
  "reading.progressed": {
    bookId: string;
    locator: string;
    chapterHref?: string;
    currentLocation?: number;
    totalLocations?: number;
    progressPercent?: number;
    status?: ReadingStatus;
  };
  "reading.timeRecorded": {
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
) => PluginDisposable;

export type BookDomainEventType =
  | "book.imported"
  | "book.metadataEdited"
  | "book.coverExtracted"
  | "book.opened"
  | "book.starred"
  | "book.removed";

export type CollectionDomainEventType =
  | "collection.created"
  | "collection.renamed"
  | "collection.removed"
  | "book.addedToCollection"
  | "book.removedFromCollection";

export type AnnotationDomainEventType =
  | "highlight.created"
  | "highlight.recolored"
  | "highlight.removed"
  | "note.created"
  | "note.updated"
  | "note.removed"
  | "ask.recorded"
  | "ask.removed";

export type ReadingDomainEventType = "reading.progressed" | "reading.timeRecorded";

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

export type PluginReadingState = {
  bookId: string;
  /** 0..100. */
  progressPercent: number;
  status: ReadingStatus;
  /** Format-neutral position (EPUB CFI or PDF locator), when recorded. */
  locator?: string;
  chapterHref?: string;
  currentLocation?: number;
  totalLocations?: number;
};

export type PluginReadingTime = {
  bookId: string;
  /** Cumulative active reading time in ms. */
  totalMs: number;
  firstReadAt?: string;
  lastReadAt?: string;
  /** Active ms per local day, keyed YYYY-MM-DD. */
  daily: Record<string, number>;
};

export type PluginDictionaryEntry = DictionaryEntrySnapshot;

export type PluginDictionaryResult = {
  /** The explanation language the entry was produced in. */
  language: string;
  entry: PluginDictionaryEntry;
};


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
 * Books — `books:read` grants the read surface; `books:write` additionally
 * grants `write` (and implies read). Chapter text/TOC are content-layer reads
 * over the imported file (extraction runs on demand).
 */
export type PluginBooksApi = {
  list(): Promise<PluginBook[]>;
  get(bookId: string): Promise<PluginBook | null>;
  getToc(bookId: string): Promise<PluginChapterRef[]>;
  /** Plain text of one chapter by its toc index; null when unavailable. */
  getChapterText(bookId: string, chapterIndex: number): Promise<string | null>;
  on: DomainSubscribe<BookDomainEventType>;
  /** Present with `books:write`. Commands mirror the book domain-event verbs. */
  write?: {
    /** Import a real file; the result is a first-class book. */
    import(input: { fileName: string; data: ArrayBuffer | Uint8Array }): Promise<PluginBook>;
    editMetadata(bookId: string, patch: { title?: string; author?: string }): Promise<void>;
    setStarred(bookId: string, starred: boolean): Promise<void>;
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

/** Collections — the shelf's user-defined groups (single-membership today). */
export type PluginCollectionsApi = {
  list(): Promise<PluginCollection[]>;
  /** Ids of the books currently in a collection. */
  booksIn(collectionId: string): Promise<string[]>;
  on: DomainSubscribe<CollectionDomainEventType>;
  /** Present with `collections:write`. */
  write?: {
    create(name: string): Promise<PluginCollection>;
    rename(collectionId: string, name: string): Promise<void>;
    /** Delete the collection; its books stay, ungrouped. */
    remove(collectionId: string): Promise<void>;
    /** Assign books to a collection, or `null` to ungroup them. */
    assignBooks(bookIds: string[], collectionId: string | null): Promise<void>;
  };
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
 * Reading — positions, statuses, and active reading time. Read-only by
 * design: its domain events are recorded facts of reader activity (the
 * engine and the time tracker emit them), not user-intent commands, so there
 * is no write surface for any actor — plugins included.
 */
export type PluginReadingApi = {
  getState(bookId: string): Promise<PluginReadingState | null>;
  listStates(): Promise<PluginReadingState[]>;
  getTime(bookId: string): Promise<PluginReadingTime | null>;
  on: DomainSubscribe<ReadingDomainEventType>;
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
  /** Namespaced key-value storage, persisted with the app's local data. */
  storage: PluginStorage;
  ui: {
    registerSelectionAction(action: PluginSelectionAction): PluginDisposable;
    registerHeaderAction(action: PluginHeaderAction): PluginDisposable;
    registerCommand(command: PluginCommand): PluginDisposable;
    showToast(message: string): void;
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
  /** `books:read` or `books:write`. */
  books?: PluginBooksApi;
  /** `collections:read` or `collections:write`. */
  collections?: PluginCollectionsApi;
  /** `annotations:read` or `annotations:write`. */
  annotations?: PluginAnnotationsApi;
  /** `reading:read`. */
  reading?: PluginReadingApi;
  /** `conversations:read`. */
  conversations?: PluginConversationsApi;
  /** `agent:tools` — extend the reading agent. */
  agent?: {
    registerTool(tool: PluginToolDefinition): PluginDisposable;
  };
  /** `service:network` (CSP allows https; gating is at the API layer). */
  network?: {
    fetch(input: string | URL | Request, init?: RequestInit): Promise<Response>;
  };
  /**
   * `service:llm` — a one-shot model call on the user's configured account
   * (fast tier by default) — no thread, no memory, no tools. Rejects when AI
   * is not configured.
   */
  llm?: {
    ask(input: {
      prompt: string;
      system?: string;
      /** Model tier on the user's account; defaults to "fast". */
      model?: "fast" | "smart";
    }): Promise<string>;
  };
  /**
   * `service:dictionary` — the app's built-in dictionary; shares its cache
   * with the reader's own look-ups. Uses the user's configured AI model;
   * rejects when AI is not configured.
   */
  dictionary?: {
    lookUp(input: {
      term: string;
      context?: string;
      bookTitle?: string;
    }): Promise<PluginDictionaryResult>;
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
