#!/usr/bin/env node
// Build script: reads site/posts/*.md and site/about.md, generates site/public/
// (index.html, timeline.html, about.html, feed.xml).
// Run from repo root: node site/build.mjs
import { readdirSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SITE_DIR = dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = join(SITE_DIR, "posts");
const PUBLIC = join(SITE_DIR, "public");
const SITE_URL = "https://qaieo.com";
const NEWSLETTER_USER = "izadjou"; // TODO: rewire signup to the dedicated Qaieo Loops list once the list ID exists

function parseFile(path) {
  const raw = readFileSync(path, "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`Bad frontmatter in ${path}`);
  const meta = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"|"$/g, "");
  }
  let tags = [];
  const tagMatch = m[1].match(/tags:\s*\[(.*?)\]/);
  if (tagMatch) tags = tagMatch[1].split(",").map((t) => t.trim().replace(/^"|"$/g, ""));
  return { ...meta, tags, body: m[2].trim() };
}

function parsePost(filename) {
  return { ...parseFile(join(POSTS_DIR, filename)), slug: filename.replace(/\.md$/, "") };
}

function md(src) {
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let html = esc(src);
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, t, u) =>
    `<a href="${u.replace(/"/g, "&quot;")}">${t}</a>`);
  const lines = html.split("\n");
  let out = "", inList = false;
  for (const line of lines) {
    if (/^##\s+/.test(line)) {
      if (inList) { out += "</ul>"; inList = false; }
      out += "<h2>" + line.replace(/^##\s+/, "") + "</h2>";
    } else if (/^\s*-\s+/.test(line)) {
      if (!inList) { out += "<ul>"; inList = true; }
      out += "<li>" + line.replace(/^\s*-\s+/, "") + "</li>";
    } else {
      if (inList) { out += "</ul>"; inList = false; }
      if (line.trim()) out += "<p>" + line.trim() + "</p>";
    }
  }
  if (inList) out += "</ul>";
  return out;
}

function fmtDate(iso) {
  return new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

// Keep CDATA sections well-formed if post content ever contains "]]>".
function cdata(s) {
  return s.replace(/\]\]>/g, "]]]]><![CDATA[>");
}

mkdirSync(PUBLIC, { recursive: true });
copyFileSync(join(SITE_DIR, "style.css"), join(PUBLIC, "style.css"));

const posts = readdirSync(POSTS_DIR)
  .filter((f) => f.endsWith(".md"))
  .map(parsePost)
  .sort((a, b) => (a.date < b.date ? 1 : -1));

const NAV = `
    <nav class="nav">
      <a href="index.html">Latest</a>
      <a href="timeline.html">Timeline</a>
      <a href="about.html">About</a>
      <a href="feed.xml">RSS</a>
    </nav>`;

const DISCLAIMER = `<p><strong>Qaieo is an independent publication.</strong> Not affiliated with, endorsed by, or sponsored by Quandela. Perceval and related marks are trademarks of their respective owners.</p>`;

function page(title, desc, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} (Unofficial)</title>
  <meta name="description" content="${desc}" />
  <link rel="stylesheet" href="style.css" />
  <link rel="alternate" type="application/rss+xml" title="Qaieo" href="feed.xml" />
</head>
<body>
  <div class="wrap">
    <header class="site">
      <span class="badge">Independent publication</span>
      <h1><a href="index.html" class="home-link">Qaieo</a></h1>
      ${NAV}
    </header>
    <main>
${body}
    </main>
    <footer class="site">
      ${DISCLAIMER}
      <p>Posts summarize public sources, linked under each update. Corrections welcome via the <a href="https://github.com/omeal007/qaieo">GitHub repo</a>.</p>
    </footer>
  </div>
</body>
</html>`;
}

const cards = posts.map((p) => `
      <article class="post" id="${p.slug}">
        <div class="post-meta">
          <time datetime="${p.date}">${fmtDate(p.date)}</time>
          <span class="post-tags">${p.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</span>
        </div>
        <h3>${p.title}</h3>
        <div class="post-body">${md(p.body)}</div>
        <div class="post-source">Source: <a href="${p.source_url}">${p.source}</a></div>
      </article>`).join("\n");

writeFileSync(join(PUBLIC, "index.html"), page("Qaieo, Photonic Quantum, Tracked",
  "Qaieo is an independent publication covering photonic quantum computing: open-source frameworks, hardware milestones, papers, and the people building them.",
  `
      <p class="lede"><span class="live-dot"></span>Qaieo tracks photonic quantum computing: the open-source frameworks, the hardware milestones, the papers, and the people building them. Anchored on Perceval, the last actively developed open framework in the field.</p>
      <h2 class="feed-title">Latest updates</h2>
${cards}
      <section class="newsletter">
        <h2>Get the weekly roundup</h2>
        <p>One email a week: Perceval releases, photonic quantum news, and what mattered. No spam, unsubscribe anytime.</p>
        <form action="https://buttondown.email/api/emails/embed-subscribe/${NEWSLETTER_USER}" method="post" target="popupwindow" onsubmit="window.open('https://buttondown.email/${NEWSLETTER_USER}','popupwindow')" class="embeddable-buttondown-form">
          <input type="email" name="email" id="bd-email" placeholder="you@example.com" required />
          <input type="submit" value="Subscribe" />
        </form>
      </section>`));

const releases = posts.filter((p) => p.tags.includes("release"));
writeFileSync(join(PUBLIC, "timeline.html"), page("Qaieo, Release Timeline",
  "Perceval release timeline, tracked by Qaieo.",
  `
      <h2 class="page-title">Release timeline</h2>
      <p class="lede">Perceval releases, newest first, tracked by Qaieo.</p>
      <div class="timeline">
${releases.map((p) => `
        <div class="tl-item">
          <div class="tl-date">${fmtDate(p.date)}</div>
          <div class="tl-card">
            <h3>${p.title}</h3>
            <div class="post-source">Source: <a href="${p.source_url}">${p.source}</a></div>
          </div>
        </div>`).join("\n")}
      </div>`));

const about = parseFile(join(SITE_DIR, "about.md"));
writeFileSync(join(PUBLIC, "about.html"), page("Qaieo, About",
  "About Qaieo: the independent publication covering photonic quantum computing.",
  `
      <h2 class="page-title">${about.title}</h2>
      <div class="prose">${md(about.body)}</div>`));

const items = posts.slice(0, 30).map((p) => `
    <item>
      <title><![CDATA[${cdata(p.title)}]]></title>
      <link>${SITE_URL}/index.html#${p.slug}</link>
      <guid>${SITE_URL}/index.html#${p.slug}</guid>
      <pubDate>${new Date(p.date + "T12:00:00Z").toUTCString()}</pubDate>
      <description><![CDATA[${cdata(md(p.body))}<p>Source: <a href="${p.source_url}">${p.source}</a></p>]]></description>
    </item>`).join("\n");

writeFileSync(join(PUBLIC, "feed.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Qaieo, Photonic Quantum, Tracked</title>
    <link>${SITE_URL}/</link>
    <description>Qaieo is an independent publication covering photonic quantum computing.</description>
    <language>en-us</language>
${items}
  </channel>
</rss>`);

console.log(`Built ${posts.length} posts, ${releases.length} releases.`);
