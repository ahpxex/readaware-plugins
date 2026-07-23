/**
 * Shelf Report — an official example plugin (TypeScript source; `main.js` is
 * the built output).
 *
 * Demonstrates: a shelf header action registered as a full Page, the list
 * view with drill-down into a markdown detail, and read access across three
 * domains (`books:read`, `reading:read`, `annotations:read`).
 */
import type { PluginContext, PluginModule } from "../../../types/plugin-api";

function progressLabel(percent: number | undefined): string {
  if (typeof percent !== "number" || Number.isNaN(percent) || percent <= 0) {
    return "not started";
  }
  return `${Math.round(Math.min(100, Math.max(0, percent)))}%`;
}

const plugin: PluginModule = {
  activate(ctx: PluginContext) {
    ctx.ui.registerHeaderAction({
      id: "report",
      title: "Shelf report",
      icon: "chart-line-up",
      surface: "shelf",
      presentation: "page",
      view: async () => {
        const [books, states] = await Promise.all([
          ctx.books!.list(),
          ctx.reading!.listStates(),
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
              const annotations = await ctx.annotations!.list({ bookId: book.id });
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
                    `- Questions asked: ${asks}`,
                  ]
                    .filter((line): line is string => line !== null)
                    .join("\n"),
                },
              };
            },
          })),
        };
      },
    });
  },
};

export default plugin;
