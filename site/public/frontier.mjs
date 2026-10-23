// The canonical publication lives on Yeki; the lab displays its public feed.
const FEED_URL = "https://yeki.ai/qaieo/feed.json";
const ARCHIVE_URL = "https://yeki.ai/qaieo/media";

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
  const seen = new Set();
  return feed.articles.map((article) => {
    const title = text(article.title, 300);
    const date = text(article.date, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) ||
        new Date(date).toISOString().slice(0, 10) !== date) throw new Error("Invalid article date");
    const slug = text(article.slug, 250);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("Invalid article slug");
    const url = httpsUrl(article.url);
    if (url.href !== `${ARCHIVE_URL}/${slug}` || seen.has(url.href)) throw new Error("Invalid article URL");
    seen.add(url.href);
    if (!Array.isArray(article.tags) || article.tags.length > 12) throw new Error("Invalid article tags");
    const tags = article.tags.map((tag) => text(tag, 80));
    const source = { label: text(article.source?.label, 300), href: httpsUrl(article.source?.href).href };
    return { title, date, slug, url: url.href, tags, source };
  }).sort((a, b) => b.date.localeCompare(a.date));
}

export async function loadFrontier(document, fetchFeed = fetch) {
  const list = document.getElementById("frontier-articles");
  const status = document.getElementById("frontier-status");
  if (!list || !status) return;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetchFeed(FEED_URL, { signal: controller.signal, credentials: "omit", referrerPolicy: "no-referrer" });
    if (!response.ok) throw new Error("Feed unavailable");
    const raw = await response.text();
    if (raw.length > 150000) throw new Error("Feed too large");
    const articles = parseFrontierFeed(JSON.parse(raw)).slice(0, 4);
    const fragment = document.createDocumentFragment();
    for (const article of articles) {
      const card = document.createElement("article");
      card.className = "post frontier-post";
      const meta = document.createElement("div");
      meta.className = "post-meta";
      const date = document.createElement("time");
      date.dateTime = article.date;
      date.textContent = article.date;
      meta.append(date);
      for (const tag of article.tags) {
        const label = document.createElement("span");
        label.className = "tag";
        label.textContent = tag;
        meta.append(label);
      }
      const heading = document.createElement("h3");
      const link = document.createElement("a");
      link.href = article.url;
      link.textContent = article.title;
      heading.append(link);
      const source = document.createElement("p");
      source.className = "post-source";
      const sourceLink = document.createElement("a");
      sourceLink.href = article.source.href;
      sourceLink.textContent = article.source.label;
      source.append("Source: ", sourceLink);
      card.append(meta, heading, source);
      fragment.append(card);
    }
    list.replaceChildren(fragment);
    status.textContent = articles.length ? "Recent articles from Qaieo Frontier." : "Read the Frontier archive for published articles.";
  } catch {
    status.textContent = "Read the latest articles in the Frontier archive.";
  } finally {
    clearTimeout(timer);
  }
}

if (typeof document !== "undefined") loadFrontier(document);
