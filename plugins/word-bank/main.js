// plugins/word-bank/src/main.ts
var noteKey = (w) => `note:${w.language}:${w.term.toLowerCase()}`;
async function bankView(ctx, bookTitle) {
  const words = (await ctx.reading.vocabulary.list()).filter((w) => !bookTitle || w.bookTitle === bookTitle);
  return {
    kind: "list",
    title: bookTitle ? undefined : `${words.length} word${words.length === 1 ? "" : "s"}`,
    emptyText: "Nothing saved yet — select a word while reading.",
    items: words.map((w) => ({
      id: `${w.language}:${w.term}`,
      title: w.term,
      subtitle: [w.definition.slice(0, 60), w.bookTitle].filter(Boolean).join(" · "),
      icon: "notebook",
      onSelect: async () => ({ view: await wordDetailView(ctx, w) })
    }))
  };
}
async function wordDetailView(ctx, w) {
  const note = ctx.storage.get(noteKey(w));
  return {
    kind: "blocks",
    title: w.term,
    blocks: [
      { kind: "dictionary", entry: w.entry },
      ...note ? [{ kind: "markdown", markdown: `**Note:** ${note}` }] : [],
      ...w.context ? [{ kind: "quote", text: w.context, caption: w.bookTitle }] : [],
      {
        kind: "keyValue",
        rows: [
          { label: "Language", value: w.language },
          { label: "Added", value: w.addedAt.slice(0, 10) },
          ...w.bookTitle ? [{ label: "Book", value: w.bookTitle }] : []
        ]
      },
      { kind: "divider" },
      {
        kind: "actions",
        actions: [
          {
            id: "note",
            label: note ? "Edit note" : "Add note",
            icon: "note-pencil",
            run: () => ({
              view: {
                kind: "form",
                title: `Note for “${w.term}”`,
                fields: [{ kind: "text", id: "note", label: "Note", value: note ?? "" }],
                submitLabel: "Save",
                onSubmit: async (values) => {
                  const text = String(values.note ?? "").trim();
                  if (text)
                    ctx.storage.set(noteKey(w), text);
                  else
                    ctx.storage.remove(noteKey(w));
                  return { toast: "Saved", view: await wordDetailView(ctx, w) };
                }
              }
            })
          },
          {
            id: "remove",
            label: "Remove",
            icon: "check",
            variant: "danger",
            run: async () => {
              await ctx.reading.vocabulary.remove(w.term, w.language);
              ctx.storage.remove(noteKey(w));
              return { toast: `Removed “${w.term}”`, view: await bankView(ctx) };
            }
          }
        ]
      }
    ]
  };
}
function reviewStep(ctx, session, index) {
  if (index >= session.length) {
    return {
      kind: "markdown",
      title: "Review done",
      markdown: `Reviewed **${session.length}** word${session.length === 1 ? "" : "s"}.`
    };
  }
  const w = session[index];
  const masked = w.context ? w.context.replace(new RegExp(w.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "____") : w.definition;
  const next = () => ({ view: reviewStep(ctx, session, index + 1) });
  return {
    kind: "blocks",
    title: `Card ${index + 1} / ${session.length}`,
    blocks: [
      { kind: "quote", text: masked, caption: w.bookTitle },
      {
        kind: "actions",
        actions: [
          {
            id: "reveal",
            label: "Show answer",
            icon: "lightbulb",
            run: () => ({
              view: {
                kind: "blocks",
                title: `Card ${index + 1} / ${session.length}`,
                blocks: [
                  { kind: "dictionary", entry: w.entry },
                  { kind: "actions", actions: [{ id: "next", label: "Next card", run: next }] }
                ]
              }
            })
          },
          { id: "skip", label: "Skip", variant: "ghost", run: next }
        ]
      }
    ]
  };
}
var plugin = {
  activate(ctx) {
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
            { kind: "text", id: "note", label: "Note (optional)" }
          ],
          submitLabel: "Look up & save",
          onSubmit: async (values) => {
            const term = String(values.word ?? "").trim();
            if (!term)
              return { toast: "Enter a word first" };
            const { language, entry } = await ctx.dictionary.lookUp({
              term,
              context: input.text.trim().slice(0, 300),
              bookTitle: input.book.title
            });
            await ctx.reading.vocabulary.add({
              term,
              language,
              entry,
              context: input.text.trim().slice(0, 300),
              bookTitle: input.book.title
            });
            const note = String(values.note ?? "").trim();
            if (note)
              ctx.storage.set(`note:${language}:${term.toLowerCase()}`, note);
            return { close: true, toast: `Saved “${term}” to your vocabulary` };
          }
        }
      })
    });
    ctx.ui.registerHeaderAction({
      id: "book-words",
      title: "Words from this book",
      icon: "notebook",
      surface: "reader",
      view: (input) => bankView(ctx, input.book?.title)
    });
    ctx.ui.registerHeaderAction({
      id: "bank",
      title: "Word Bank",
      icon: "graduation-cap",
      surface: "shelf",
      presentation: "page",
      view: () => bankView(ctx)
    });
    ctx.ui.registerCommand({
      id: "review",
      title: "Word Bank: review",
      icon: "graduation-cap",
      keywords: "flashcards vocabulary quiz",
      run: async () => {
        const words = await ctx.reading.vocabulary.list();
        if (words.length === 0)
          return { toast: "Your vocabulary is empty" };
        const session = [...words].sort(() => Math.random() - 0.5).slice(0, 5);
        return { view: reviewStep(ctx, session, 0) };
      }
    });
    ctx.ai?.registerTool({
      name: "save_word",
      label: "Save word",
      description: "Look up a word with the built-in dictionary and save it to the user's vocabulary notebook. Include the sentence it appeared in when available.",
      parameters: {
        type: "object",
        properties: {
          word: { type: "string", description: "The word or phrase to save." },
          context: { type: "string", description: "The sentence it appeared in." },
          bookTitle: { type: "string", description: "Book title, if known." }
        },
        required: ["word"],
        additionalProperties: false
      },
      execute: async (params) => {
        const term = String(params.word ?? "").trim();
        if (!term)
          throw new Error("word is required");
        const context = typeof params.context === "string" ? params.context : undefined;
        const bookTitle = typeof params.bookTitle === "string" ? params.bookTitle : undefined;
        const { language, entry } = await ctx.dictionary.lookUp({ term, context, bookTitle });
        await ctx.reading.vocabulary.add({ term, language, entry, context, bookTitle });
        return { saved: term, language, total: (await ctx.reading.vocabulary.list()).length };
      }
    });
    ctx.ai?.registerTool({
      name: "list_words",
      label: "List words",
      description: "List the user's vocabulary notebook entries, newest first. Useful for quizzes or progress questions.",
      parameters: {
        type: "object",
        properties: { limit: { type: "number", description: "Max entries (default 20)." } },
        additionalProperties: false
      },
      execute: async (params) => {
        const limit = typeof params.limit === "number" && params.limit > 0 ? Math.min(100, Math.floor(params.limit)) : 20;
        return (await ctx.reading.vocabulary.list({ limit })).map(({ term, language, definition, bookTitle, context, addedAt }) => ({
          term,
          language,
          definition,
          bookTitle,
          context,
          addedAt
        }));
      }
    });
  }
};
var main_default = plugin;
export {
  main_default as default
};
