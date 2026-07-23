// plugins/annotation-tools/src/main.ts
var plugin = {
  activate(ctx) {
    ctx.agent.registerTool({
      name: "count_annotations",
      label: "Count annotations",
      description: "Count the user's annotations (highlights, notes, asked questions), optionally scoped to one book by id.",
      parameters: {
        type: "object",
        properties: {
          bookId: {
            type: "string",
            description: "Book id to scope to; omit for the whole library."
          }
        },
        additionalProperties: false
      },
      execute: async (params) => {
        const bookId = typeof params.bookId === "string" ? params.bookId : undefined;
        const annotations = await ctx.annotations.list(bookId ? { bookId } : undefined);
        return {
          total: annotations.length,
          highlights: annotations.filter((a) => a.kind === "highlight").length,
          notes: annotations.filter((a) => a.kind === "note").length,
          asks: annotations.filter((a) => a.kind === "ask").length
        };
      }
    });
    ctx.agent.registerTool({
      name: "list_recent_annotations",
      label: "Recent annotations",
      description: "List the user's most recent annotations with their text, newest first.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Max entries to return (default 10)."
          }
        },
        additionalProperties: false
      },
      execute: async (params) => {
        const limit = typeof params.limit === "number" && params.limit > 0 ? Math.min(50, Math.floor(params.limit)) : 10;
        const annotations = await ctx.annotations.list();
        return annotations.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit).map((a) => ({
          bookId: a.bookId,
          kind: a.kind,
          text: a.kind === "note" ? a.quotedText ?? "" : a.text,
          note: a.kind === "note" ? a.body : undefined,
          createdAt: a.createdAt
        }));
      }
    });
  }
};
var main_default = plugin;
export {
  main_default as default
};
