// plugins/rss-reader/src/main.ts
var PROVIDER_ID = "feed";
var MAX_ARTICLES = 30;
var loadFeeds = (ctx) => ctx.storage.get("feeds") ?? [];
var saveFeeds = (ctx, feeds) => ctx.storage.set("feeds", feeds);
var upsertFeed = (ctx, feed) => saveFeeds(ctx, [feed, ...loadFeeds(ctx).filter((entry) => entry.url !== feed.url)]);
async function fetchFeed(ctx, url) {
  const response = await ctx.fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok)
    throw new Error(`Feed returned ${response.status}`);
  const xml = new DOMParser().parseFromString(await response.text(), "text/xml");
  if (xml.querySelector("parsererror"))
    throw new Error("Not a valid RSS/Atom feed");
  const pick = (parent, ...selectors) => {
    for (const selector of selectors) {
      const node = parent.querySelector(selector);
      if (node?.textContent)
        return node.textContent.trim();
    }
    return "";
  };
  const isAtom = xml.querySelector("feed > entry") !== null;
  const title = (isAtom ? pick(xml, "feed > title") : pick(xml, "channel > title")) || url;
  const items = [...xml.querySelectorAll(isAtom ? "feed > entry" : "channel > item")].slice(0, MAX_ARTICLES);
  const sections = items.map((item, index) => {
    const articleTitle = pick(item, "title") || `Article ${index + 1}`;
    const encoded = item.getElementsByTagName("content:encoded")[0]?.textContent ?? "";
    const body = encoded.trim() || pick(item, "content", "summary", "description") || "<p>(no content in feed)</p>";
    const link = isAtom ? item.querySelector("link")?.getAttribute("href") ?? "" : pick(item, "link");
    const date = pick(item, "pubDate", "published", "updated");
    const header = [
      date ? `<p><em>${date}</em></p>` : "",
      link ? `<p><a href="${link}">Read on the web</a></p>` : ""
    ].join("");
    return { id: `article-${index}`, title: articleTitle, html: `${header}${body}` };
  });
  return {
    title,
    articles: sections.map(({ id, title: t }) => ({ id, title: t })),
    content: { title, author: "RSS", language: "en", sections }
  };
}
async function subscribe(ctx, url) {
  const { title, articles } = await fetchFeed(ctx, url);
  const book = await ctx.library.addVirtualBook({
    providerId: PROVIDER_ID,
    key: url,
    title,
    author: "RSS"
  });
  const feed = {
    url,
    title,
    bookId: book.id,
    addedAt: new Date().toISOString(),
    lastFetched: new Date().toISOString(),
    articles
  };
  upsertFeed(ctx, feed);
  return feed;
}
function feedDetailView(ctx, feed) {
  return {
    kind: "blocks",
    title: feed.title,
    blocks: [
      {
        kind: "keyValue",
        rows: [
          { label: "Feed", value: feed.url },
          { label: "Articles", value: String(feed.articles?.length ?? 0) },
          { label: "Updated", value: feed.lastFetched?.slice(0, 16).replace("T", " ") ?? "—" }
        ]
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
            }
          },
          {
            id: "refresh",
            label: "Refresh",
            run: async () => {
              const fresh = await subscribe(ctx, feed.url);
              return { toast: "Feed refreshed", view: feedDetailView(ctx, fresh) };
            }
          },
          {
            id: "remove",
            label: "Unsubscribe",
            variant: "danger",
            run: async () => {
              await ctx.library.removeVirtualBook({ providerId: PROVIDER_ID, key: feed.url });
              saveFeeds(ctx, loadFeeds(ctx).filter((entry) => entry.url !== feed.url));
              return { toast: `Unsubscribed “${feed.title}”`, view: pageView(ctx) };
            }
          }
        ]
      },
      { kind: "divider" },
      { kind: "heading", text: "Articles", caption: "Open one to jump straight to it" },
      {
        kind: "list",
        emptyText: "Refresh to load articles.",
        items: (feed.articles ?? []).map((article) => ({
          id: article.id,
          title: article.title,
          icon: "article",
          onSelect: () => {
            ctx.reader.goTo({ bookId: feed.bookId, href: article.id });
            return { close: true };
          }
        }))
      }
    ]
  };
}
function pageView(ctx) {
  const feeds = loadFeeds(ctx);
  const total = feeds.reduce((sum, feed) => sum + (feed.articles?.length ?? 0), 0);
  return {
    kind: "blocks",
    blocks: [
      {
        kind: "heading",
        text: "Subscriptions",
        caption: `${feeds.length} feed${feeds.length === 1 ? "" : "s"} · ${total} articles cached`
      },
      {
        kind: "form",
        fields: [
          { kind: "text", id: "url", label: "Feed URL", placeholder: "https://example.com/feed.xml" }
        ],
        submitLabel: "Subscribe",
        onSubmit: async (values) => {
          const url = String(values.url ?? "").trim();
          if (!/^https?:\/\//.test(url)) {
            return { fieldErrors: { url: "Enter a valid http(s) feed URL" } };
          }
          if (loadFeeds(ctx).some((feed2) => feed2.url === url)) {
            return { fieldErrors: { url: "Already subscribed" } };
          }
          const feed = await subscribe(ctx, url);
          return { toast: `Subscribed to “${feed.title}”`, view: pageView(ctx) };
        }
      },
      { kind: "divider" },
      {
        kind: "list",
        emptyText: "No subscriptions yet — add a feed above.",
        items: feeds.map((feed) => ({
          id: feed.url,
          title: feed.title,
          subtitle: `${feed.articles?.length ?? 0} articles · ${feed.url}`,
          icon: "globe",
          onSelect: () => ({ view: feedDetailView(ctx, feed) })
        }))
      },
      ...feeds.length > 0 ? [
        {
          kind: "actions",
          actions: [
            {
              id: "refresh-all",
              label: "Refresh all",
              icon: "arrow-square-out",
              run: async () => {
                for (const feed of loadFeeds(ctx)) {
                  try {
                    await subscribe(ctx, feed.url);
                  } catch {}
                }
                return { toast: "All feeds refreshed", view: pageView(ctx) };
              }
            }
          ]
        }
      ] : [],
      { kind: "divider" },
      { kind: "heading", text: "Import", caption: "Paste an OPML export to bulk-subscribe" },
      {
        kind: "form",
        fields: [{ kind: "textarea", id: "opml", label: "OPML", rows: 4 }],
        submitLabel: "Import",
        onSubmit: async (values) => {
          const text = String(values.opml ?? "").trim();
          if (!text)
            return { fieldErrors: { opml: "Paste OPML XML first" } };
          const xml = new DOMParser().parseFromString(text, "text/xml");
          const urls = [...xml.querySelectorAll("outline[xmlUrl]")].map((node) => node.getAttribute("xmlUrl") ?? "").filter((url) => /^https?:\/\//.test(url));
          if (urls.length === 0) {
            return { fieldErrors: { opml: "No feed URLs found in this OPML" } };
          }
          let added = 0;
          for (const url of urls) {
            if (loadFeeds(ctx).some((feed) => feed.url === url))
              continue;
            try {
              await subscribe(ctx, url);
              added += 1;
            } catch {}
          }
          return { toast: `Imported ${added} of ${urls.length} feeds`, view: pageView(ctx) };
        }
      }
    ]
  };
}
var plugin = {
  activate(ctx) {
    ctx.library.registerContentProvider({
      id: PROVIDER_ID,
      load: async (url) => (await fetchFeed(ctx, url)).content
    });
    ctx.ui.registerHeaderAction({
      id: "feeds",
      title: "RSS Feeds",
      icon: "globe",
      surface: "shelf",
      presentation: "page",
      view: () => pageView(ctx)
    });
    ctx.ui.registerCommand({
      id: "subscribe",
      title: "RSS: subscriptions",
      icon: "globe",
      keywords: "rss atom feed subscribe",
      run: () => ({ view: pageView(ctx) })
    });
  }
};
var main_default = plugin;
export {
  main_default as default
};
