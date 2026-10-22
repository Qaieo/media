// qaieo.com landing page. Pure function of the data files in site/data/.
// Frontier issues, clips and ventures are data; copy lives here.
// Called by build.mjs. Run `node site/build.mjs` from the repo root.

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const fmtDate = (iso) =>
  new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });

// Each word in its own clip box so it can rise in; the sheen wraps the whole line.
const headline = (text) =>
  text.split(" ").map((w, i) => `<span class="w"><i style="--i:${i}">${esc(w)}</i></span>`).join(" ");

const PLAY = `<span class="play" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 14 14" fill="#f4f3ef"><path d="M3 1.5v11l9-5.5z"/></svg></span>`;

const NODES = [[12, 18, 0], [27, 62, 1.3], [41, 30, 2.1], [55, 74, 3.4], [63, 22, 0.7], [71, 48, 4.2], [84, 14, 2.8], [91, 66, 1.9], [6, 84, 5], [48, 90, 3.9]]
  .map(([x, y, d]) => `<span class="node" style="left:${x}%;top:${y}%;animation-delay:${d}s"></span>`).join("");

const TICKER = ["Launch services", "Satellite buses", "Defense autonomy", "Industrial robotics", "AI compute buildouts", "Grid hardware", "Physics simulation", "Orbital manufacturing"];

const tracked = (url, content) => {
  const u = new URL(url);
  u.searchParams.set("utm_source", "qaieo.com");
  u.searchParams.set("utm_medium", "web");
  u.searchParams.set("utm_content", content);
  return u.toString();
};

const featureCard = (p) => `
      <a class="card feature" href="${esc(tracked(p.url, "frontier-feature"))}">
        <div class="thumb tall"></div>
        <div class="body">
          <div>
            <div class="mono live"><i></i>Frontier · ${fmtDate(p.date)}</div>
            <h3>${esc(p.title)}</h3>
            <p>${esc(p.dek)}</p>
          </div>
          <div class="tags">${p.tags.map((t) => `<span class="tag tag-on">${esc(t)}</span>`).join("")}<span class="arrow" style="margin-left:auto;font-size:24px" aria-hidden="true">↗</span></div>
        </div>
      </a>`;

const postCard = (p) => `
        <a class="card" href="${esc(tracked(p.url, "frontier-grid"))}">
          <div class="thumb"></div>
          <div class="mono">Frontier · ${fmtDate(p.date)}</div>
          <div class="title">${esc(p.title)}</div>
          <p class="dek">${esc(p.dek)}</p>
          <div class="foot"><span class="tag">${esc(p.tags[0] || "Frontier")}</span><span class="arrow" style="font-size:20px" aria-hidden="true">↗</span></div>
        </a>`;

const clipCard = (c) => `
        <a class="card" href="${esc(c.url)}">
          <div class="thumb">${PLAY}</div>
          <div class="mono">Clip · ${fmtDate(c.date)}</div>
          <div class="title">${esc(c.title)}</div>
        </a>`;

const ventureRow = (v, i) => `
        <a class="vrow" href="${esc(v.url)}" target="_blank" rel="noopener noreferrer">
          <span class="mono n">0${i + 1}</span>
          <img src="${esc(v.logo)}" alt="" width="40" height="40">
          <span class="name">${esc(v.name)}</span>
          <span class="what">${esc(v.what)}</span>
          <span class="mono dom">${esc(v.domain)} <span class="arrow" style="font-size:18px" aria-hidden="true">↗</span></span>
        </a>`;

export function renderLanding({ frontier, clips, ventures, archiveUrl, beaconToken }) {
  // Newest first; entries sharing a date keep their file order (put the lead story first in frontier.json).
  const sorted = frontier.map((p, i) => [p, i]).sort((a, b) => (a[0].date < b[0].date ? 1 : a[0].date > b[0].date ? -1 : a[1] - b[1])).map(([p]) => p);
  const [featured, ...rest] = sorted;
  const recent = rest.slice(0, 3);
  const latestUrl = featured ? tracked(featured.url, "hero") : archiveUrl;
  const beacon = beaconToken
    ? `\n  <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "${esc(beaconToken)}"}'></script>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Qaieo</title>
  <meta name="description" content="Qaieo Frontier tracks the contract awards, grants and prizes funding the physical economy. Qaieo Clips and Qaieo Ventures.">
  <meta property="og:title" content="Qaieo">
  <meta property="og:description" content="Follow the contracts awarding the future.">
  <meta property="og:url" content="https://qaieo.com/">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap">
  <link rel="stylesheet" href="landing.css">
  <link rel="alternate" type="application/rss+xml" title="Qaieo" href="feed.xml">${beacon}
</head>
<body>
  <header class="top">
    <div class="wrap">
      <a class="brand" href="/" aria-label="Qaieo home"><span class="mark" aria-hidden="true"><b>Q</b><i></i></span>Qaieo</a>
      <nav class="nav" aria-label="Primary">
        <div class="nav-links">
          <a href="#frontier">Frontier</a>
          <a href="#clips">Clips</a>
          <a href="#ventures">Ventures</a>
          <a href="https://yeki.ai/" target="_blank" rel="noopener noreferrer">Yeki</a>
        </div>
        <a class="btn btn-ghost" href="#subscribe">Subscribe <span aria-hidden="true">→</span></a>
      </nav>
    </div>
  </header>

  <main>
    <section class="hero">
      <div class="field" aria-hidden="true">
        <div class="hlines"></div><div class="grid-b"></div><div class="grid-a"></div><div class="scan"></div>
        ${NODES}
        <div class="orbit"><div class="orbit-in"></div><div class="orbit-core"></div></div>
        <svg class="contours" viewBox="0 0 1600 500" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 420 C 200 380, 300 300, 520 320 S 900 420, 1120 340 S 1450 220, 1600 260"/>
          <path d="M0 360 C 180 330, 340 240, 560 262 S 940 360, 1160 282 S 1480 160, 1600 200"/>
          <path d="M0 300 C 160 280, 380 180, 600 204 S 980 300, 1200 224 S 1510 100, 1600 140"/>
        </svg>
        <div class="fade"></div>
      </div>
      <div class="wrap">
        <div class="mono rise d1" style="margin-bottom:28px">Qaieo Frontier · Qaieo Clips · Qaieo Ventures</div>
        <h1 aria-label="Follow the contracts awarding the future.">${headline("Follow the contracts awarding the future.")}</h1>
        <div class="cta rise d2">
          <a class="btn btn-primary" href="#frontier">Latest <span aria-hidden="true">↓</span></a>
          <div class="mono">Hardware · Robotics · Energy · Defense · Space</div>
        </div>
      </div>
    </section>

    <section id="frontier" class="wrap section first reveal">
      <div class="section-head">
        <div><div class="mono">01 / Qaieo Frontier</div><h2>Awards, grants and prizes in the physical economy.</h2></div>
        <a class="link" href="${esc(archiveUrl)}">Archive →</a>
      </div>
${featured ? featureCard(featured) : `      <p class="empty">First issue coming soon.</p>`}
      <div class="grid3">${recent.map(postCard).join("")}
      </div>
    </section>

    <section id="clips" class="wrap section reveal">
      <div class="section-head">
        <div><div class="mono">02 / Qaieo Clips</div><h2>Short films on how hard things get built.</h2></div>
        ${clips.length ? "" : `<p>First clips publish here when ready.</p>`}
      </div>
${clips.length ? `      <div class="grid3">${clips.map(clipCard).join("")}\n      </div>` : ""}
    </section>

    <section id="ventures" class="wrap section reveal">
      <div class="section-head">
        <div><div class="mono">03 / Qaieo Ventures</div><h2>Backed early.</h2></div>
        <p>Where Qaieo Ventures has invested historically.</p>
      </div>
      <div class="vlist">${ventures.map(ventureRow).join("")}
      </div>
    </section>

    <div class="ticker-wrap mono" aria-hidden="true">
      <div class="ticker">${[...TICKER, ...TICKER].map((t) => `<span>${t}</span><span>·</span>`).join("")}</div>
    </div>

    <section id="subscribe" class="wrap subscribe reveal">
      <div class="row">
        <div class="copy"><h2>One award a day. Read in two minutes.</h2><p>Who won, what it funds, what comes next.</p></div>
        <form id="qaieo-subscribe" action="/api/subscribe" method="post">
          <label>Email<input type="email" name="email" placeholder="you@company.com" required autocomplete="email"></label>
          <input class="hp" type="text" name="company" tabindex="-1" autocomplete="off" aria-hidden="true">
          <input type="hidden" name="source" value="qaieo.com/landing">
          <button type="submit" class="btn btn-primary">Subscribe</button>
          <p id="qaieo-sub-msg" class="sub-msg" role="status" aria-live="polite" hidden></p>
        </form>
      </div>
    </section>
  </main>

  <footer class="wrap foot">
    <div class="inner">
      <span><b>Qaieo</b>Qaieo Frontier · Qaieo Clips · Qaieo Ventures</span>
      <nav aria-label="Footer"><a href="#frontier">Frontier</a><a href="#clips">Clips</a><a href="#ventures">Ventures</a><a href="disclosures.html">Disclosures</a><a href="https://yeki.ai/" target="_blank" rel="noopener noreferrer">Yeki ↗</a><span>© 2026 Qaieo</span></nav>
    </div>
  </footer>

  <script>
  (function () {
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var els = document.querySelectorAll('.reveal');
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); }
    else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -12% 0px' });
      els.forEach(function (e) { io.observe(e); });
    }
    var top = document.querySelector('.top');
    addEventListener('scroll', function () { top.classList.toggle('scrolled', scrollY > 40); }, { passive: true });
  })();
  (function () {
    var f = document.getElementById('qaieo-subscribe'), msg = document.getElementById('qaieo-sub-msg');
    // Attribution: UTM params and referrer travel with the signup so Loops can segment by source.
    var q = new URLSearchParams(location.search);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(function (k) {
      var v = q.get(k); if (v) { var i = document.createElement('input'); i.type = 'hidden'; i.name = k; i.value = v.slice(0, 100); f.appendChild(i); }
    });
    if (document.referrer) { var r = document.createElement('input'); r.type = 'hidden'; r.name = 'referrer'; r.value = document.referrer.slice(0, 200); f.appendChild(r); }
    f.addEventListener('submit', async function (e) {
      e.preventDefault();
      msg.hidden = false; msg.textContent = 'Subscribing\\u2026';
      try {
        var res = await fetch(f.action, { method: 'POST', body: new FormData(f) });
        var j = await res.json();
        msg.textContent = j.ok ? 'You are in. Check your inbox to confirm.' : (j.error || 'Something went wrong.');
        if (j.ok) f.reset();
      } catch (err) { msg.textContent = 'Something went wrong. Try again.'; }
    });
  })();
  </script>
</body>
</html>`;
}
