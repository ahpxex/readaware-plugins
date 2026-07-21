/**
 * RSS Reader — the content-provider showcase: each subscribed feed is a real
 * book on the shelf (a virtual book), articles are its chapters. No EPUB
 * conversion anywhere; the plugin serves HTML sections at open time.
 *
 * Surfaces: a shelf Page (add-feed form front and center, subscriptions
 * beneath), and the "feed" content provider backing every feed-book.
 */
import type {
  PluginBookContent,
  PluginContext,
  PluginModule,
  PluginView,
  PluginViewResult,
} from "../../../types/plugin-api";

type Feed = { url: string; title: string; bookId: string; addedAt: string };

const PROVIDER_ID = "feed";
const MAX_ARTICLES = 30;

function loadFeeds(ctx: PluginContext): Feed[] {
  return ctx.storage.get<Feed[]>("feeds") ?? [];
}

function saveFeeds(ctx: PluginContext, feeds: Feed[]): void {
  ctx.storage.set("feeds", feeds);
}

// ─── Fetching & parsing (RSS 2.0 + Atom) ─────────────────────────────────────

async function fetchFeed(
  ctx: PluginContext,
  url: string,
): Promise<{ title: string; content: PluginBookContent }> {
  const response = await ctx.fetch!(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Feed returned ${response.status}`);
  const xml = new DOMParser().parseFromString(await response.text(), "text/xml");
  if (xml.querySelector("parsererror")) throw new Error("Not a valid RSS/Atom feed");

  const pick = (parent: Element | Document, ...selectors: string[]): string => {
    for (const selector of selectors) {
      const node = parent.querySelector(selector);
      if (node?.textContent) return node.textContent.trim();
    }
    return "";
  };

  const isAtom = xml.querySelector("feed > entry") !== null;
  const feedTitle =
    (isAtom ? pick(xml, "feed > title") : pick(xml, "channel > title")) || url;
  const items = [...xml.querySelectorAll(isAtom ? "feed > entry" : "channel > item")].slice(
    0,
    MAX_ARTICLES,
  );

  const sections = items.map((item, index) => {
    const title = pick(item, "title") || `Article ${index + 1}`;
    // content:encoded needs the namespace-tolerant lookup; getElementsByTagName
    // sees the prefixed name in both namespaced and plain parses.
    const encoded = item.getElementsByTagName("content:encoded")[0]?.textContent ?? "";
    const body =
      encoded.trim() ||
      pick(item, "content", "summary", "description") ||
      "<p>(no content in feed)</p>";
    const link = isAtom
      ? (item.querySelector("link")?.getAttribute("href") ?? "")
      : pick(item, "link");
    const date = pick(item, "pubDate", "published", "updated");
    const header = [
      date ? `<p><em>${date}</em></p>` : "",
      link ? `<p><a href="${link}">Read on the web</a></p>` : "",
    ].join("");
    return { id: `article-${index}`, title, html: `${header}${body}` };
  });

  return {
    title: feedTitle,
    content: { title: feedTitle, author: "RSS", language: "en", sections },
  };
}

// ─── The page: input front and center, subscriptions beneath ─────────────────

function feedDetailView(ctx: PluginContext, feed: Feed): PluginView {
  return {
    kind: "blocks",
    title: feed.title,
    blocks: [
      {
        kind: "keyValue",
        rows: [
          { label: "Feed", value: feed.url },
          { label: "Added", value: feed.addedAt.slice(0, 10) },
        ],
      },
      {
        kind: "actions",
        actions: [
          {
            id: "open",
            label: "Open as book",
            icon: "book-open",
            variant: "solid",
            run: () => {
              ctx.reader.openBook(feed.bookId);
              return { close: true };
            },
          },
          {
            id: "refresh",
            label: "Refresh title",
            icon: "arrow-square-out",
            run: async () => {
              const { title } = await fetchFeed(ctx, feed.url);
              const feeds = loadFeeds(ctx).map((entry) =>
                entry.url === feed.url ? { ...entry, title } : entry,
              );
              saveFeeds(ctx, feeds);
              await ctx.library!.addVirtualBook({
                providerId: PROVIDER_ID,
                key: feed.url,
                title,
                author: "RSS",
              });
              return { toast: "Feed refreshed", view: pageView(ctx) };
            },
          },
          {
            id: "remove",
            label: "Unsubscribe",
            variant: "danger",
            run: async () => {
              await ctx.library!.removeVirtualBook({
                providerId: PROVIDER_ID,
                key: feed.url,
              });
              saveFeeds(ctx, loadFeeds(ctx).filter((entry) => entry.url !== feed.url));
              return { toast: `Unsubscribed “${feed.title}”`, view: pageView(ctx) };
            },
          },
        ],
      },
    ],
  };
}

function pageView(ctx: PluginContext): PluginView {
  const feeds = loadFeeds(ctx);
  return {
    kind: "blocks",
    blocks: [
      {
        kind: "form",
        fields: [
          {
            kind: "text",
            id: "url",
            label: "Feed URL",
            placeholder: "https://example.com/feed.xml",
          },
        ],
        submitLabel: "Subscribe",
        onSubmit: async (values): Promise<PluginViewResult> => {
          const url = String(values.url ?? "").trim();
          if (!/^https?:\/\//.test(url)) {
            return { fieldErrors: { url: "Enter a valid http(s) feed URL" } };
          }
          if (loadFeeds(ctx).some((feed) => feed.url === url)) {
            return { fieldErrors: { url: "Already subscribed" } };
          }
          const { title } = await fetchFeed(ctx, url);
          const book = await ctx.library!.addVirtualBook({
            providerId: PROVIDER_ID,
            key: url,
            title,
            author: "RSS",
          });
          saveFeeds(ctx, [
            { url, title, bookId: book.id, addedAt: new Date().toISOString() },
            ...loadFeeds(ctx),
          ]);
          return { toast: `Subscribed to “${title}”`, view: pageView(ctx) };
        },
      },
      { kind: "divider" },
      {
        kind: "list",
        emptyText: "No subscriptions yet — add a feed above.",
        items: feeds.map((feed) => ({
          id: feed.url,
          title: feed.title,
          subtitle: feed.url,
          icon: "globe",
          onSelect: () => ({ view: feedDetailView(ctx, feed) }),
        })),
      },
    ],
  };
}

const plugin: PluginModule = {
  activate(ctx: PluginContext) {
    ctx.library!.registerContentProvider({
      id: PROVIDER_ID,
      load: async (url) => (await fetchFeed(ctx, url)).content,
    });

    ctx.ui.registerHeaderAction({
      id: "feeds",
      title: "RSS Feeds",
      icon: "globe",
      surface: "shelf",
      presentation: "page",
      view: () => pageView(ctx),
    });

    ctx.ui.registerCommand({
      id: "subscribe",
      title: "RSS: subscriptions",
      icon: "globe",
      keywords: "rss atom feed subscribe",
      run: () => ({ view: pageView(ctx) }),
    });
  },
};

export default plugin;
