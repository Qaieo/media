#!/usr/bin/env node
// Build script: reads site/posts/*.md and site/about.md, generates site/public/
// (index.html, timeline.html, about.html, disclosures.html, feed.xml).
// Run from repo root: node site/build.mjs
import { readdirSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { renderLanding } from "./landing.mjs";

const SITE_DIR = dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = join(SITE_DIR, "posts");
const PUBLIC = join(SITE_DIR, "public");
const SITE_URL = "https://qaieo.com";
// Signup posts to /api/subscribe (worker.js), which adds the contact to the
// dedicated Qaieo Loops mailing list (LOOPS_LIST_ID in wrangler.jsonc).

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
copyFileSync(join(SITE_DIR, "landing.css"), join(PUBLIC, "landing.css"));
mkdirSync(join(PUBLIC, "logos"), { recursive: true });
for (const f of readdirSync(join(SITE_DIR, "logos"))) copyFileSync(join(SITE_DIR, "logos", f), join(PUBLIC, "logos", f));

// qaieo.com home: the Frontier / Clips / Ventures landing. Data lives in site/data/.
const readJson = (name) => JSON.parse(readFileSync(join(SITE_DIR, "data", name), "utf8"));
writeFileSync(join(PUBLIC, "index.html"), renderLanding({
  frontier: readJson("frontier.json"),
  clips: readJson("clips.json"),
  ventures: readJson("ventures.json"),
  archiveUrl: "https://yeki.ai/qaieo/media",
  beaconToken: process.env.CF_BEACON_TOKEN || "",
}));

const posts = readdirSync(POSTS_DIR)
  .filter((f) => f.endsWith(".md"))
  .map(parsePost)
  .sort((a, b) => (a.date < b.date ? 1 : -1));

const NAV = `
    <nav class="nav">
      <a href="lab.html">Lab</a>
      <a href="lab.html#news">News</a>
      <a href="timeline.html">Releases</a>
      <a href="about.html">About</a>
      <a href="feed.xml">RSS</a>
    </nav>`;

const DISCLAIMER = `<p>Qaieo is not affiliated with, endorsed by, or sponsored by Quandela or any company it covers. Perceval and related marks are trademarks of their respective owners. Not investment advice. See <a href="disclosures.html">Disclosures</a>.</p>`;

function page(title, desc, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${desc}" />
  <link rel="stylesheet" href="style.css" />
  <link rel="alternate" type="application/rss+xml" title="Qaieo" href="feed.xml" />
</head>
<body>
  <div class="wrap">
    <header class="site">
      <span class="badge">Research lab</span>
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

const card = (p) => `
      <article class="post" id="${p.slug}">
        <div class="post-meta">
          <time datetime="${p.date}">${fmtDate(p.date)}</time>
          <span class="post-tags">${p.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</span>
        </div>
        <h3>${p.title}</h3>
        <div class="post-body">${md(p.body)}</div>
        <div class="post-source">Source: <a href="${p.source_url}">${p.source}</a></div>
      </article>`;
const RESEARCH_TAGS = ["analysis", "research", "explainer", "underwriting"];
const isResearch = (p) => p.tags.some((t) => RESEARCH_TAGS.includes(t));
const researchCards = posts.filter(isResearch).map(card).join("\n");
const newsCards = posts.filter((p) => !isResearch(p)).map(card).join("\n");

const AGENDA = `
      <section class="agenda">
        <h2 class="feed-title">Research agenda</h2>
        <ul>
          <li><strong>Contracts and counterparties.</strong> Who buys quantum systems (governments, national labs, HPC centers, enterprises) and how strong those counterparties are.</li>
          <li><strong>Milestones and delivery risk.</strong> Announced timelines versus actual delivery, and what slippage looks like on first-of-kind systems.</li>
          <li><strong>Cost to complete.</strong> What it takes to build, install, and operate a quantum system, and how those costs move.</li>
          <li><strong>Capital and markets.</strong> Funding rounds, public listings, and program budgets, read for what they mean for credit risk.</li>
        </ul>
      </section>`;

writeFileSync(join(PUBLIC, "lab.html"), page("Qaieo, Quantum Research Lab",
  "Qaieo is a research lab studying how quantum computing gets built and financed, with quantum news read through an underwriting lens.",
  `
      <p class="lede"><span class="live-dot"></span>Qaieo is a research lab studying how quantum computing gets built and financed: the contracts, the milestones, the counterparties, and the risk between them. We also cover quantum news, read through an underwriting lens.</p>
${AGENDA}
      <h2 class="feed-title">Research</h2>
${researchCards}
      <h2 class="feed-title" id="news">News</h2>
${newsCards}
      <section class="newsletter">
        <h2>Get the weekly brief</h2>
        <p>One email a week: Qaieo research, the quantum news that matters, and what it means for risk. No spam, unsubscribe anytime.</p>
        <form id="qaieo-subscribe" action="/api/subscribe" method="post">
          <input type="email" name="email" placeholder="you@example.com" required />
          <input type="text" name="company" style="position:absolute;left:-9999px" tabindex="-1" autocomplete="off" aria-hidden="true" />
          <input type="submit" value="Subscribe" />
        </form>
        <p id="qaieo-sub-msg" class="sub-msg" hidden></p>
        <script>
        document.getElementById('qaieo-subscribe').addEventListener('submit', async (e) => {
          e.preventDefault();
          const f = e.target, msg = document.getElementById('qaieo-sub-msg');
          msg.hidden = false; msg.textContent = 'Subscribing\u2026';
          try {
            const r = await fetch(f.action, { method: 'POST', body: new FormData(f) });
            const j = await r.json();
            msg.textContent = j.ok ? 'You are in. The next brief lands in your inbox.' : (j.error || 'Something went wrong.');
          } catch { msg.textContent = 'Something went wrong. Try again.'; }
        });
        </script>
      </section>`));

const releases = posts.filter((p) => p.tags.includes("release"));
writeFileSync(join(PUBLIC, "timeline.html"), page("Qaieo, Perceval Releases",
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
  "About Qaieo: a research lab studying quantum computing through an underwriting lens.",
  `
      <h2 class="page-title">${about.title}</h2>
      <div class="prose">${md(about.body)}</div>`));

const disclosures = parseFile(join(SITE_DIR, "disclosures.md"));
writeFileSync(join(PUBLIC, "disclosures.html"), page("Qaieo, Disclosures",
  "Qaieo disclosures: financial interests and how conflicts are handled.",
  `
      <h2 class="page-title">${disclosures.title}</h2>
      <div class="prose">${md(disclosures.body)}</div>`));

const items = posts.slice(0, 30).map((p) => `
    <item>
      <title><![CDATA[${cdata(p.title)}]]></title>
      <link>${SITE_URL}/lab.html#${p.slug}</link>
      <guid>${SITE_URL}/index.html#${p.slug}</guid>
      <pubDate>${new Date(p.date + "T12:00:00Z").toUTCString()}</pubDate>
      <description><![CDATA[${cdata(md(p.body))}<p>Source: <a href="${p.source_url}">${p.source}</a></p>]]></description>
    </item>`).join("\n");

writeFileSync(join(PUBLIC, "feed.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Qaieo, Quantum Research Lab</title>
    <link>${SITE_URL}/</link>
    <description>Qaieo is a research lab studying how quantum computing gets built and financed, with quantum news read through an underwriting lens.</description>
    <language>en-us</language>
${items}
  </channel>
</rss>`);

console.log(`Built ${posts.length} posts, ${releases.length} releases.`);
