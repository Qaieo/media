#!/usr/bin/env node
// Build script: reads site/posts/*.md and site/about.md, generates site/public/
// (index.html, timeline.html, about.html, disclosures.html, feed.xml).
// Run from repo root: node site/build.mjs
import { assertSupportedNode } from "./node-runtime.mjs";
import { FRONTIER_INDUSTRIES } from "./frontier-data.mjs";
import { readdirSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

assertSupportedNode();

const SITE_DIR = dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = join(SITE_DIR, "posts");
const PUBLIC = join(SITE_DIR, "public");
const SITE_URL = "https://qaieo.com";
// Enable only after Kit configuration and confirmation-flow acceptance.
const NEWSLETTER_READY = false;
// Signup posts to /api/subscribe (worker.js), which adds the contact to the
// dedicated Qaieo Kit form (KIT_FORM_ID in wrangler.jsonc).

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
mkdirSync(join(PUBLIC, "fonts"), { recursive: true });
for (const f of readdirSync(join(SITE_DIR, "fonts"))) copyFileSync(join(SITE_DIR, "fonts", f), join(PUBLIC, "fonts", f));

// Frontier leads the homepage; the original article anchors remain available.
copyFileSync(join(SITE_DIR, "frontier.mjs"), join(PUBLIC, "frontier.mjs"));
copyFileSync(join(SITE_DIR, "frontier-data.mjs"), join(PUBLIC, "frontier-data.mjs"));
copyFileSync(join(SITE_DIR, "ripple.mjs"), join(PUBLIC, "ripple.mjs"));
copyFileSync(join(SITE_DIR, "platinum.mjs"), join(PUBLIC, "platinum.mjs"));
mkdirSync(join(PUBLIC, "art"), { recursive: true });
for (const f of readdirSync(join(SITE_DIR, "art"))) copyFileSync(join(SITE_DIR, "art", f), join(PUBLIC, "art", f));

const posts = readdirSync(POSTS_DIR)
  .filter((f) => f.endsWith(".md"))
  .map(parsePost)
  .sort((a, b) => (a.date < b.date ? 1 : -1));

const NAV = `
    <nav class="nav" aria-label="Primary">
      <a href="about.html">About</a>
      <a href="index.html#industries">Industries</a>
      <a class="nav-signup" href="index.html#newsletter">${NEWSLETTER_READY ? "Sign up for newsletter" : "Newsletter"} <span aria-hidden="true">↗</span></a>
    </nav>`;

const DISCLAIMER = `<p>Qaieo Frontier is a publication from <a href="https://yeki.ai">Yeki</a>. Coverage draws on public sources. Not investment advice. See <a href="disclosures.html">Disclosures</a> for relationships and conflicts.</p>`;

function page(title, desc, body, { home = false } = {}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${desc}" />
  <meta name="theme-color" content="#143D70" />
  <link rel="preload" href="fonts/Geist-Variable.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="stylesheet" href="style.css" />
  <link rel="icon" type="image/svg+xml" href="logos/qaieo-favicon-ivory.svg" />
  <link rel="icon" type="image/svg+xml" href="logos/qaieo-favicon-dark.svg" media="(prefers-color-scheme: dark)" />
  <link rel="alternate" type="application/rss+xml" title="Qaieo" href="feed.xml" />
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="wrap">
    <header class="site">
      <a href="index.html" class="home-link" aria-label="Qaieo home"><img class="brand-logo" src="logos/qaieo-lockup-animated.svg" alt="Qaieo" width="1544" height="576" /></a>
${NAV}
    </header>
    <main id="main" class="${home ? "lab-page" : "document-page"}">
${body}
${home ? "" : `<aside class="document-signup"><p class="eyebrow">Qaieo Frontier</p><h2>The physical economy. In your inbox.</h2><p>Awards, milestones and contracts shaping the physical economy.</p><a class="button" href="index.html#newsletter">${NEWSLETTER_READY ? "Sign up for newsletter" : "Newsletter details"} <span aria-hidden="true">↗</span></a></aside>`}
    </main>
    <footer class="site">
      ${DISCLAIMER}
      <p>Awards, milestones and contracts shaping the physical economy. Posts link to public sources, with grants and prizes in context. Corrections welcome via the <a href="https://github.com/omeal007/qaieo">GitHub repo</a>.</p>
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
      <section class="agenda" id="coverage" aria-labelledby="agenda-title">
        <div class="section-heading"><span class="eyebrow">Follow the work, not just the announcement</span><h2 id="agenda-title">What we cover</h2></div>
        <ul>
          <li><strong>Awards &amp; contracts.</strong> Who won the work, who is buying, and what is committed, obligated or still conditional.</li>
          <li><strong>Milestones that matter.</strong> Product launches, deployments, manufacturing scale and delivery progress, with evidence behind the announcement.</li>
          <li><strong>Grants &amp; prizes.</strong> Funding that moves technology toward commercial use, with its conditions and next steps in view.</li>
          <li><strong>Companies building.</strong> Early-stage and scaling teams in robotics, photonics and aerospace &amp; defense, alongside energy, industry and infrastructure.</li>
        </ul>
      </section>`;

const INDUSTRIES = `
      <section class="industry-index" id="industries" aria-labelledby="industries-title">
        <div class="section-heading">
          <p class="eyebrow">Follow an industry</p>
          <h2 id="industries-title">Where the work is happening</h2>
          <p>Robotics, photonics and aerospace &amp; defense lead our coverage, including space. We also follow energy, industry and infrastructure, and emerging frontiers.</p>
        </div>
        <nav class="industry-nav" aria-label="Industries">
${FRONTIER_INDUSTRIES.map(industry => `          <a class="text-link" href="#industry-${industry.id}">${industry.label.replace(/&/g, "&amp;")} <span aria-hidden="true">↓</span></a>`).join("\n")}
        </nav>
        <noscript><p>Read published industry coverage in the <a class="text-link" href="https://yeki.ai/qaieo/media">Frontier archive</a>.</p></noscript>
      </section>
${FRONTIER_INDUSTRIES.map(industry => `
      <section class="editorial-section" id="industry-${industry.id}" aria-labelledby="industry-${industry.id}-title">
        <div class="section-heading">
          <h2 id="industry-${industry.id}-title">${industry.label.replace(/&/g, "&amp;")}</h2>
          <p>${industry.description}</p>
        </div>
        <div class="frontier-feed">
          <div id="industry-${industry.id}-articles"></div>
          <p id="industry-${industry.id}-status" class="frontier-status" role="status">Loading published coverage…</p>
        </div>
      </section>`).join("\n")}`;

const labPage = page("Qaieo — The physical economy, in focus",
  "Awards, milestones and contracts shaping the physical economy. Early-stage and scaling companies in robotics, photonics, aerospace &amp; defense and beyond.",
  `
      <section class="hero" id="newsletter" aria-labelledby="lab-title">
        <div class="wave-visual platinum-material" aria-hidden="true" data-platinum-source="art/ivory.mp4">
          <img class="wave-poster" src="art/ivory.webp" alt="" width="1280" height="464" decoding="async" />
        </div>
        <div class="hero-copy">
          <p class="eyebrow"><span class="square" aria-hidden="true"></span>Qaieo Frontier</p>
          <h1 id="lab-title">The physical economy.<span>In your inbox.</span></h1>
          <p class="lede">Awards, milestones and contracts shaping the physical economy.</p>
          <div class="hero-signup">
        <form id="qaieo-subscribe" action="/api/subscribe" method="post">
          <label for="subscriber-email">Your email address</label>
          <div class="subscribe-controls">
          <input id="subscriber-email" type="email" name="email" placeholder="you@example.com" autocomplete="email" required aria-describedby="newsletter-availability" ${NEWSLETTER_READY ? "" : "disabled"} />
          <input type="text" name="company" style="position:absolute;left:-9999px" tabindex="-1" autocomplete="off" aria-hidden="true" />
          <input type="submit" value="${NEWSLETTER_READY ? "Sign up" : "Opening soon"}" ${NEWSLETTER_READY ? "" : "disabled"} />
          </div>
        </form>
        <p id="qaieo-sub-msg" class="sub-msg" role="status" hidden></p>
        <script>
        document.getElementById('qaieo-subscribe').addEventListener('submit', async (e) => {
          e.preventDefault();
          if (!${NEWSLETTER_READY}) return;
          const f = e.target, msg = document.getElementById('qaieo-sub-msg');
          msg.hidden = false; msg.textContent = 'Subscribing\u2026';
          try {
            const r = await fetch(f.action, { method: 'POST', body: new FormData(f) });
            const j = await r.json();
            msg.textContent = j.ok ? 'Check your inbox to confirm your subscription. If you already subscribe, you are all set.' : (j.error || 'Something went wrong.');
          } catch { msg.textContent = 'Something went wrong. Try again.'; }
        });
        </script>
            <p class="signup-note" id="newsletter-availability">${NEWSLETTER_READY ? "From Qaieo Frontier. Unsubscribe anytime." : "Newsletter signup opens soon. Read the latest articles below."}</p>
          </div>
          <a class="hero-explore text-link" href="#frontier">Read the latest articles <span aria-hidden="true">↓</span></a>
        </div>
        <button class="platinum-control" type="button" data-platinum-toggle aria-pressed="false" hidden>Pause background animation</button>
        <script type="module" src="platinum.mjs"></script>
      </section>
      <section id="frontier" class="frontier" aria-labelledby="frontier-title">
        <div class="frontier-intro">
          <p class="eyebrow">The physical economy, in focus</p>
          <h2 id="frontier-title">Qaieo <span>Frontier</span></h2>
          <p>Following early-stage and scaling companies through awards, contracts and commercial milestones. Established companies feature when their work defines an industry.</p>
          <a class="frontier-archive text-link" href="https://yeki.ai/qaieo/media">All articles <span aria-hidden="true">↗</span></a>
        </div>
        <div class="frontier-feed">
          <div id="frontier-articles"></div>
          <p id="frontier-status" class="frontier-status" role="status">Loading the latest published articles…</p>
          <noscript><p>Read the latest publications in the <a href="https://yeki.ai/qaieo/media">Frontier archive</a>.</p></noscript>
        </div>
        <script type="module" src="frontier.mjs"></script>
      </section>
${AGENDA}
${INDUSTRIES}
      <section class="agenda" id="ecosystem" aria-labelledby="ecosystem-title">
        <div class="section-heading"><p class="eyebrow">The connected product</p><h2 id="ecosystem-title">Work data. Research. Financing.</h2></div>
        <ul>
          <li><strong>Toekyn generates Verified Work™ data.</strong> Physical work linked to Verified Work™ outcomes, source evidence, review and corrections.</li>
          <li><strong>Qaieo owns simulation, RL, evaluations and ML.</strong> Research datasets and models combine verified-work data with simulation data.</li>
          <li><strong>Yeki brings the inputs together.</strong> Verified work, Qaieo research and external API context inform the underwriting and financing direction.</li>
        </ul>
        <p>Planned sources: SAM.gov Opportunities, SAM.gov Contract Awards, USAspending and SAM.gov Entity Management. Integration is in development; current demonstrations are synthetic and financing stays in shadow mode.</p>
        <a class="text-link" href="about.html">How the three fit together <span aria-hidden="true">↗</span></a>
      </section>
      <details class="research-archive" id="archive">
        <summary><span>Earlier research &amp; software releases</span><span aria-hidden="true">+</span></summary>
        <p class="archive-intro">Qaieo began with quantum computing. These earlier articles retain their original dates, sources and links.</p>
      <section class="editorial-section" id="research" aria-labelledby="research-title">
        <div class="section-heading"><p class="eyebrow">From the archive</p><h2 id="research-title">Quantum research</h2><p>Earlier essays and explainers from Qaieo’s quantum research coverage. Original publication dates and sources are retained.</p></div>
        <div class="article-list">
${researchCards}
        </div>
      </section>
      <section class="editorial-section" id="news" aria-labelledby="news-title">
        <div class="section-heading"><p class="eyebrow">From the archive</p><h2 id="news-title">Software releases</h2><p>Historical Perceval release coverage, preserved with its original dates and sources.</p><a class="text-link" href="timeline.html">View the release timeline <span aria-hidden="true">↗</span></a></div>
        <div class="article-list">
${newsCards}
        </div>
      </section>
      </details>
      <script>
        // Preserve deep links into the original research archive.
        function revealArchive() {
          const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
          const archive = target?.closest('.research-archive');
          if (archive) { archive.open = true; target.scrollIntoView(); }
        }
        addEventListener('hashchange', () => { try { revealArchive(); } catch {} });
        try { revealArchive(); } catch {}
      </script>
      <section class="newsletter newsletter-reminder" aria-labelledby="newsletter-title">
        <div class="newsletter-copy">
          <p class="eyebrow">Keep the frontier in view</p>
          <h2 id="newsletter-title">Follow what’s being built.</h2>
          <p>Awards, milestones and contracts shaping the physical economy. Grants, prizes and the companies behind them.</p>
        </div>
        <a class="button" href="#newsletter">${NEWSLETTER_READY ? "Sign up for newsletter" : "Newsletter details"} <span aria-hidden="true">↗</span></a>
      </section>`, { home: true });
writeFileSync(join(PUBLIC, "index.html"), labPage);
writeFileSync(join(PUBLIC, "lab.html"), labPage);

const releases = posts.filter((p) => p.tags.includes("release"));
writeFileSync(join(PUBLIC, "timeline.html"), page("Qaieo, Perceval Releases",
  "Perceval release timeline, tracked by Qaieo.",
  `
      <p class="eyebrow">From the archive</p>
      <h1 class="page-title">Release timeline</h1>
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
  "About Qaieo: awards, milestones and contracts shaping the physical economy, with early-stage and scaling companies at the center.",
  `
      <p class="eyebrow">Qaieo Frontier</p>
      <h1 class="page-title">${about.title}</h1>
      <div class="prose">${md(about.body)}</div>`));

const disclosures = parseFile(join(SITE_DIR, "disclosures.md"));
writeFileSync(join(PUBLIC, "disclosures.html"), page("Qaieo, Disclosures",
  "Qaieo disclosures: financial interests and how conflicts are handled.",
  `
      <p class="eyebrow">Qaieo Frontier</p>
      <h1 class="page-title">${disclosures.title}</h1>
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
    <title>Qaieo — Research archive</title>
    <link>${SITE_URL}/</link>
    <description>Qaieo’s preserved quantum research and software release archive. Current awards, milestones and contracts coverage is available through Qaieo Frontier at qaieo.com.</description>
    <language>en-us</language>
${items}
  </channel>
</rss>`);

console.log(`Built ${posts.length} posts, ${releases.length} releases.`);

