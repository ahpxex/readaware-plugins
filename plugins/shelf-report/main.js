// plugins/shelf-report/src/main.ts
function progressLabel(percent) {
  if (typeof percent !== "number" || Number.isNaN(percent) || percent <= 0) {
    return "not started";
  }
  return `${Math.round(Math.min(100, Math.max(0, percent)))}%`;
}
var plugin = {
  activate(ctx) {
    ctx.ui.registerHeaderAction({
      id: "report",
      title: "Shelf report",
      icon: "chart-line-up",
      surface: "shelf",
      presentation: "page",
      view: async () => {
        const [books, states] = await Promise.all([
          ctx.books.list(),
          ctx.reading.listStates()
        ]);
        const progressByBook = new Map(states.map((s) => [s.bookId, s.progressPercent]));
        return {
          kind: "list",
          emptyText: "No books on the shelf yet.",
          items: books.map((book) => ({
            id: book.id,
            title: book.title,
            subtitle: `${book.author ?? "Unknown author"} · ${progressLabel(progressByBook.get(book.id))}`,
            icon: "book-open",
            onSelect: async () => {
              const annotations = await ctx.annotations.list({ bookId: book.id });
              const highlights = annotations.filter((a) => a.kind === "highlight").length;
              const notes = annotations.filter((a) => a.kind === "note").length;
              const asks = annotations.filter((a) => a.kind === "ask").length;
              return {
                view: {
                  kind: "markdown",
                  title: book.title,
                  markdown: [
                    `**${book.title}**`,
                    book.author ? `by ${book.author}` : null,
                    "",
                    `- Progress: ${progressLabel(progressByBook.get(book.id))}`,
                    `- Highlights: ${highlights}`,
                    `- Notes: ${notes}`,
                    `- Questions asked: ${asks}`
                  ].filter((line) => line !== null).join(`
`)
                }
              };
            }
          }))
        };
      }
    });
  }
};
var main_default = plugin;
export {
  main_default as default
};
