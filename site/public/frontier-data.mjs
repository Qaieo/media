// Public article metadata only. Yeki owns the canonical publication and article URLs.
export const UPSTREAM_FEED_URL = "https://yeki.ai/qaieo/feed.json";
export const ARCHIVE_URL = "https://yeki.ai/qaieo/media";

export const FRONTIER_INDUSTRIES = [
  { id: "robotics", label: "Robotics", description: "Awards, contracts and deployment milestones for robots working in the physical world." },
  { id: "photonics", label: "Photonics", description: "Optics, lasers and light-based systems moving from research into commercial use." },
  { id: "aerospace-defense", label: "Aerospace & defense", description: "Aircraft, space systems and defense technology, from awarded work to delivery." },
  { id: "energy", label: "Energy", description: "Power generation, storage and grid technology reaching commercial milestones." },
  { id: "industry-infrastructure", label: "Industry & infrastructure", description: "The hardware, materials and systems behind manufacturing and infrastructure." },
  { id: "emerging-frontiers", label: "Emerging frontiers", description: "Awards, contracts and commercial progress across other emerging physical technologies." },
];
const industryIds = new Set(FRONTIER_INDUSTRIES.map(industry => industry.id));
const industryTags = new Map([
  ["robotics", ["Robotics", "Space robotics"]],
  ["photonics", ["Photonics", "Optics", "Optical computing", "Optical communications", "Lasers", "Quantum photonics"]],
  ["aerospace-defense", ["Aerospace & defense", "Aerospace and defense", "Aerospace", "Defense", "Space", "Space robotics", "Spacecraft propulsion", "Aviation", "Navy"]],
  ["energy", ["Energy", "Solar", "Grid", "Energy storage", "Nuclear", "Power systems"]],
  ["industry-infrastructure", ["Industry & infrastructure", "Industry and infrastructure", "Industrial", "Industry", "Infrastructure", "Hardware", "Manufacturing", "Materials", "Construction", "Logistics", "Semiconductors"]],
].map(([id, tags]) => [id, new Set(tags.map(tag => tag.toLowerCase()))]));

// Explicit v1 metadata takes precedence; older feeds retain exact-tag compatibility.
export function frontierArticleIndustries(article) {
  const tags = article.tags.map(tag => tag.toLowerCase());
  if (tags.includes("introduction")) return [];
  if (Object.hasOwn(article, "industries")) return article.industries;
  const matched = [...industryTags].filter(([, aliases]) => tags.some(tag => aliases.has(tag))).map(([id]) => id);
  return matched.length ? matched : ["emerging-frontiers"];
}

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
    let industries;
    if (Object.hasOwn(article, "industries")) {
      if (!Array.isArray(article.industries) || article.industries.length > industryIds.size ||
          article.industries.some(id => !industryIds.has(id))) throw new Error("Invalid article industries");
      industries = { industries: [...new Set(article.industries)] };
    }
    const source = { label: text(article.source?.label, 300), href: httpsUrl(article.source?.href).href };
    return { title, date, slug, url: url.href, tags, source, ...industries };
  }).sort((a, b) => b.date.localeCompare(a.date));
}

export function frontierDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
}

// Calendar gaps never produce placeholders; a future duplicate cannot hide a post.
export function publishedFrontierArticles(today, articles) {
  const seen = new Set();
  return articles.filter(article => article.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter(article => {
      if (seen.has(article.slug)) return false;
      seen.add(article.slug);
      return true;
    });
}

export function latestFrontierArticles(today, articles) {
  return publishedFrontierArticles(today, articles).slice(0, 3);
}

export function industryFrontierArticles(today, articles) {
  const published = publishedFrontierArticles(today, articles);
  return new Map(FRONTIER_INDUSTRIES.map(industry => [industry.id,
    published.filter(article => frontierArticleIndustries(article).includes(industry.id)),
  ]));
}
