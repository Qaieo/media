// Public article metadata only. Yeki owns the canonical publication and article URLs.
export const UPSTREAM_FEED_URL = "https://yeki.ai/qaieo/feed.json";
export const ARCHIVE_URL = "https://yeki.ai/qaieo/media";

function text(value, max) {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new Error("Invalid feed text");
  return value;
}

function httpsUrl(value) {
  const url = new URL(text(value, 2000));
  if (url.protocol !== "https:" || url.username || url.password) throw new Error("Invalid source URL");
  return url;
}

export function parseFrontierFeed(feed) {
  if (feed?.version !== 1 || feed.publication !== "Qaieo Frontier" || feed.archiveUrl !== ARCHIVE_URL ||
      !Array.isArray(feed.articles) || feed.articles.length > 50) throw new Error("Invalid Frontier feed");
  return feed.articles.map((article) => {
    const title = text(article.title, 300);
    const date = text(article.date, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) ||
        new Date(date).toISOString().slice(0, 10) !== date) throw new Error("Invalid article date");
    const slug = text(article.slug, 250);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("Invalid article slug");
    const url = httpsUrl(article.url);
    if (url.href !== `${ARCHIVE_URL}/${slug}`) throw new Error("Invalid article URL");
    if (!Array.isArray(article.tags) || article.tags.length > 12) throw new Error("Invalid article tags");
    const tags = article.tags.map((tag) => text(tag, 80));
    const source = { label: text(article.source?.label, 300), href: httpsUrl(article.source?.href).href };
    return { title, date, slug, url: url.href, tags, source };
  }).sort((a, b) => b.date.localeCompare(a.date));
}

export function frontierDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
}

// Calendar gaps never produce placeholders; a future duplicate cannot hide a post.
export function latestFrontierArticles(today, articles) {
  const seen = new Set();
  return articles.filter(article => article.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter(article => {
      if (seen.has(article.slug)) return false;
      seen.add(article.slug);
      return true;
    }).slice(0, 3);
}
