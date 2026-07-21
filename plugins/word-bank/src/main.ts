/**
 * Word Bank — the flagship example plugin: one plugin exercising the whole
 * API surface working together.
 *
 * - selection action → prefilled form → namespaced storage
 * - reader header popup: this book's words, drill into async detail views
 *   that fetch definitions over `ctx.fetch` (the `network` permission)
 * - shelf header Page: the full bank with edit/remove via a form view
 * - palette command: a flashcard review session built from chained views
 * - two agent tools (the `ai` permission): the reading agent can save and
 *   list words mid-chat — plugin state is shared between UI and agent
 *
 * TypeScript source; `main.js` is the built output (`bun run build`).
 */
import type {
  PluginContext,
  PluginListView,
  PluginModule,
  PluginView,
  PluginViewResult,
} from "../../../types/plugin-api";

type SavedWord = {
  id: string;
  word: string;
  note?: string;
  /** The sentence/passage the word was met in. */
  context?: string;
  bookId?: string;
  bookTitle?: string;
  addedAt: string;
};

const STORE_KEY = "words";
const REVIEW_SIZE = 5;

// ─── Storage ─────────────────────────────────────────────────────────────────

function loadWords(ctx: PluginContext): SavedWord[] {
  return ctx.storage.get<SavedWord[]>(STORE_KEY) ?? [];
}

function saveWords(ctx: PluginContext, words: SavedWord[]): void {
  ctx.storage.set(STORE_KEY, words);
}

/** Insert or update by case-insensitive headword; returns the saved record. */
function upsertWord(
  ctx: PluginContext,
  input: Omit<SavedWord, "id" | "addedAt">,
): SavedWord {
  const words = loadWords(ctx);
  const existing = words.find(
    (entry) => entry.word.toLowerCase() === input.word.toLowerCase(),
  );
  if (existing) {
    const updated: SavedWord = {
      ...existing,
      ...input,
      note: input.note || existing.note,
      context: input.context || existing.context,
    };
    saveWords(ctx, words.map((entry) => (entry.id === existing.id ? updated : entry)));
    return updated;
  }
  const created: SavedWord = {
    ...input,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    addedAt: new Date().toISOString(),
  };
  saveWords(ctx, [created, ...words]);
  return created;
}

// ─── Dictionary lookup (network permission) ──────────────────────────────────

/** Best-effort English definition via the free dictionaryapi.dev. */
async function lookUpDefinition(ctx: PluginContext, word: string): Promise<string | null> {
  if (!ctx.fetch || !/^[a-zA-Z][a-zA-Z' -]{0,40}$/.test(word)) return null;
  try {
    const response = await ctx.fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`,
      { signal: AbortSignal.timeout(6000) },
    );
    if (!response.ok) return null;
    const data = (await response.json()) as {
      phonetic?: string;
      meanings?: { partOfSpeech?: string; definitions?: { definition?: string }[] }[];
    }[];
    const entry = data[0];
    if (!entry?.meanings?.length) return null;
    const lines = entry.meanings.slice(0, 3).map((meaning) => {
      const definition = meaning.definitions?.[0]?.definition ?? "";
      return `- *${meaning.partOfSpeech ?? "?"}* — ${definition}`;
    });
    const phonetic = entry.phonetic ? `${entry.phonetic}\n\n` : "";
    return `${phonetic}${lines.join("\n")}`;
  } catch {
    return null;
  }
}

// ─── Views ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

/** Detail view: definition (fetched live), context quote, provenance, note. */
async function wordDetailView(ctx: PluginContext, word: SavedWord): Promise<PluginView> {
  const definition = await lookUpDefinition(ctx, word.word);
  const parts = [
    `## ${word.word}`,
    definition ?? "_No dictionary entry found._",
    word.note ? `**Note:** ${word.note}` : null,
    word.context ? `> ${word.context}` : null,
    [
      word.bookTitle ? `from *${word.bookTitle}*` : null,
      `saved ${formatDate(word.addedAt)}`,
    ]
      .filter(Boolean)
      .join(" · "),
  ];
  return {
    kind: "markdown",
    title: word.word,
    markdown: parts.filter((part): part is string => part != null).join("\n\n"),
  };
}

/** Edit form: change the note or remove the word; returns to the bank list. */
function wordEditView(ctx: PluginContext, word: SavedWord): PluginView {
  return {
    kind: "form",
    title: `Edit “${word.word}”`,
    fields: [
      { kind: "text", id: "note", label: "Note", value: word.note ?? "" },
      { kind: "toggle", id: "remove", label: "Remove from Word Bank", value: false },
    ],
    submitLabel: "Save",
    onSubmit: (values) => {
      const words = loadWords(ctx);
      if (values.remove === true) {
        saveWords(ctx, words.filter((entry) => entry.id !== word.id));
        return { toast: `Removed “${word.word}”`, view: bankView(ctx) };
      }
      saveWords(
        ctx,
        words.map((entry) =>
          entry.id === word.id ? { ...entry, note: String(values.note ?? "") } : entry,
        ),
      );
      return { toast: "Saved", view: bankView(ctx) };
    },
  };
}

/** The full bank (shelf Page): every word, drill into detail → edit. */
function bankView(ctx: PluginContext, bookId?: string): PluginListView {
  const words = loadWords(ctx).filter((word) => !bookId || word.bookId === bookId);
  return {
    kind: "list",
    title: bookId ? undefined : `${words.length} word${words.length === 1 ? "" : "s"}`,
    emptyText: "Nothing saved yet — select a word while reading.",
    items: words.map((word) => ({
      id: word.id,
      title: word.word,
      subtitle: [word.bookTitle, formatDate(word.addedAt), word.note]
        .filter(Boolean)
        .join(" · "),
      icon: "notebook",
      onSelect: async () => ({
        view: {
          kind: "list",
          title: word.word,
          items: [
            {
              id: "detail",
              title: "Definition & context",
              icon: "book-open",
              onSelect: async () => ({ view: await wordDetailView(ctx, word) }),
            },
            {
              id: "edit",
              title: "Edit or remove",
              icon: "note-pencil",
              onSelect: () => ({ view: wordEditView(ctx, word) }),
            },
          ],
        } satisfies PluginView,
      }),
    })),
  };
}

/** Flashcard review: context with the word masked → reveal → next. */
function reviewStepView(ctx: PluginContext, session: SavedWord[], index: number): PluginView {
  if (index >= session.length) {
    return {
      kind: "markdown",
      title: "Review done",
      markdown: `Reviewed **${session.length}** word${session.length === 1 ? "" : "s"}. Come back tomorrow.`,
    };
  }
  const word = session[index];
  const masked = word.context
    ? word.context.replace(new RegExp(word.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "____")
    : "(no saved context)";
  const next = (): PluginViewResult => ({ view: reviewStepView(ctx, session, index + 1) });
  return {
    kind: "list",
    title: `Card ${index + 1} / ${session.length}`,
    items: [
      { id: "context", title: masked.slice(0, 120), subtitle: word.bookTitle },
      {
        id: "reveal",
        title: "Show answer",
        icon: "lightbulb",
        onSelect: async () => ({
          view: {
            kind: "list",
            title: `Card ${index + 1} / ${session.length}`,
            items: [
              {
                id: "answer",
                title: word.word,
                subtitle: word.note ?? word.context?.slice(0, 100),
                icon: "check",
                onSelect: async () => ({ view: await wordDetailView(ctx, word) }),
              },
              { id: "next", title: "Next card", icon: "arrow-square-out", onSelect: next },
            ],
          } satisfies PluginView,
        }),
      },
      { id: "skip", title: "Skip", onSelect: next },
    ],
  };
}

// ─── Plugin ──────────────────────────────────────────────────────────────────

const plugin: PluginModule = {
  activate(ctx: PluginContext) {
    // Selection → prefilled save form (word + note), context captured along.
    ctx.ui.registerSelectionAction({
      id: "save-word",
      title: "Save to Word Bank",
      icon: "notebook",
      run: (input) => ({
        view: {
          kind: "form",
          title: "Save to Word Bank",
          fields: [
            { kind: "text", id: "word", label: "Word", value: input.text.trim().slice(0, 60) },
            { kind: "text", id: "note", label: "Note (optional)", placeholder: "Why it matters…" },
          ],
          submitLabel: "Save",
          onSubmit: (values) => {
            const word = String(values.word ?? "").trim();
            if (!word) return { toast: "Enter a word first" };
            upsertWord(ctx, {
              word,
              note: String(values.note ?? "").trim() || undefined,
              context: input.text.trim().slice(0, 300),
              bookId: input.book.id,
              bookTitle: input.book.title,
            });
            return { close: true, toast: `Saved “${word}” (${loadWords(ctx).length} total)` };
          },
        },
      }),
    });

    // Reader header popup: this book's words.
    ctx.ui.registerHeaderAction({
      id: "book-words",
      title: "Words from this book",
      icon: "notebook",
      surface: "reader",
      view: (input) => bankView(ctx, input.book?.id),
    });

    // Shelf Page: the whole bank with edit/remove.
    ctx.ui.registerHeaderAction({
      id: "bank",
      title: "Word Bank",
      icon: "graduation-cap",
      surface: "shelf",
      presentation: "page",
      view: () => bankView(ctx),
    });

    // Palette: flashcard review over a random sample.
    ctx.ui.registerCommand({
      id: "review",
      title: "Word Bank: review",
      icon: "graduation-cap",
      keywords: "flashcards vocabulary quiz",
      run: () => {
        const words = loadWords(ctx);
        if (words.length === 0) return { toast: "Word Bank is empty" };
        const session = [...words].sort(() => Math.random() - 0.5).slice(0, REVIEW_SIZE);
        return { view: reviewStepView(ctx, session, 0) };
      },
    });

    // Agent tools: the reading agent saves and recalls words mid-chat.
    ctx.ai?.registerTool({
      name: "save_word",
      label: "Save word",
      description:
        "Save a word or phrase to the user's Word Bank. Include the sentence it appeared in as context when available.",
      parameters: {
        type: "object",
        properties: {
          word: { type: "string", description: "The word or phrase to save." },
          note: { type: "string", description: "Optional short note or gloss." },
          context: { type: "string", description: "The sentence it appeared in." },
          bookTitle: { type: "string", description: "Book title, if known." },
        },
        required: ["word"],
        additionalProperties: false,
      },
      execute: (params) => {
        const word = String(params.word ?? "").trim();
        if (!word) throw new Error("word is required");
        const saved = upsertWord(ctx, {
          word,
          note: typeof params.note === "string" ? params.note : undefined,
          context: typeof params.context === "string" ? params.context : undefined,
          bookTitle: typeof params.bookTitle === "string" ? params.bookTitle : undefined,
        });
        return { saved: saved.word, total: loadWords(ctx).length };
      },
    });

    ctx.ai?.registerTool({
      name: "list_words",
      label: "List words",
      description:
        "List the user's saved Word Bank entries, newest first. Useful for quizzes or progress questions.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Max entries (default 20)." },
        },
        additionalProperties: false,
      },
      execute: (params) => {
        const limit =
          typeof params.limit === "number" && params.limit > 0
            ? Math.min(100, Math.floor(params.limit))
            : 20;
        return loadWords(ctx)
          .slice(0, limit)
          .map(({ word, note, context, bookTitle, addedAt }) => ({
            word,
            note,
            context,
            bookTitle,
            addedAt,
          }));
      },
    });
  },
};

export default plugin;
