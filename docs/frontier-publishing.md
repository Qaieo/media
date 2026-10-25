# Qaieo Frontier and the research archive

Omid's current definition of Qaieo is: **Recent awards, commercialization grants and the companies building the physical economy.** This supersedes the October 23 research-lab-first positioning. The prepared root page leads with a concise newsletter signup hero using that definition, followed by the live Frontier feed. About and newsletter signup are the two primary navigation links. Publication of this signup-focused version is pending a working newsletter connection. A collapsed research archive below retains all ten existing article blocks and their anchors; deep links automatically reveal the referenced archive content. `/lab.html` remains an identical compatibility alias. All ten research/news source files remain unchanged.

The Frontier section presents **Qaieo Frontier** and the current definition on the left, with three stacked articles on the right. The browser reads the same-origin `/api/frontier` route. Both the Worker and the local preview proxy the fixed public `https://yeki.ai/qaieo/feed.json` endpoint. Yeki owns the article bodies and canonical URLs; no article body is duplicated. The v1 feed supplies each title, publication date, slug, category, canonical article URL and first source attribution.

Display the **latest three distinct published articles**, newest first. Determine today's publication date in `America/Los_Angeles`, exclude future-dated entries before deduplicating by slug, and skip calendar days with no publication. Never insert empty day slots or relabel older posts as today. Refresh on initial load, every 60 seconds while the page is visible, and when the visitor returns to the tab. New Yeki publications appear without another Qaieo build. Unchanged responses preserve existing article nodes and focus; temporary failures preserve the last successful list and show a brief status. A first-load failure or disabled JavaScript leaves the archive link available.

`site/frontier-data.mjs` validates the public schema, publication identity, dates, bounded text, canonical Yeki article URLs and HTTPS source links. `site/frontier.mjs` inserts text through DOM text properties, not HTML. `site/frontier-proxy.mjs` limits upstream response size, aborts after eight seconds, rejects redirects and returns generic errors. The upstream destination is fixed, and visitor cookies, authorization and referrer are not forwarded. Feed responses have a 60-second public cache lifetime. Browser requests omit credentials and referrer. The same-origin route avoids depending on third-party browser CORS access; it does not access subscriber records or send email.

The previous marketing landing sources and `site/data/` files are retained as history; the build no longer makes that landing the home page or reads its static article list. This change does not publish videos, activate newsletter sending, configure analytics, or alter the subscription backend. The existing newsletter implementation remains subject to its documented configuration and acceptance requirements.

## Editorial boundaries

Coverage follows recent awards, commercialization grants and the companies delivering products, facilities and infrastructure. Cite the underlying award or grant record where available, identify its date and status, and keep announcement, obligation, payment and delivery distinct. A contract ceiling is not funds obligated; a conditional grant is not proof of cash received or successful commercialization. Preserve uncertainty when terms or progress are not public. The fuller newsletter editorial rules remain in the Yeki repository; this change preserves its canonical articles and public feed.

## Build and verification

Use the patched runtime required by `.node-version` (22.23.4 or a supported later release):

```sh
node site/build.mjs
node --test site/*.test.mjs
node site/preview.mjs
git diff --check
```

The preview command serves `http://127.0.0.1:8768/index.html`, including the real public feed route. A plain static server cannot serve `/api/frontier`. Local newsletter submissions remain disabled. The build regenerates tracked `site/public` assets. Generated root and lab pages must match. Check that the root presents the current definition and that the archive sections, existing post anchors and RSS links remain reachable. Before publication, inspect desktop and mobile with the real feed, then check an unavailable-feed fallback and all existing archive navigation. Automated checks cover publication gaps, future posts, duplicate slugs, Pacific midnight, safe text rendering, refresh events, last-good preservation and proxy failures. Local browser verification must use the real feed; it does not establish production deployment.

Deployment continues through the reviewed Git/Cloudflare release path. A merged commit is not proof that qaieo.com serves it. Verify the actual Worker build source and live root, module, feed-driven cards, lab alias, archive sections and canonical article links after release.

## October 24, 2026 local verification

The real-feed preview at `http://127.0.0.1:8768/index.html#frontier` loaded Momentus (October 24), Gecko (October 22) and AstraQua (October 21), with canonical article URLs and original source links. Desktop and 390px mobile checks passed without horizontal overflow. All 36 website tests pass under Node 22.23.4. The existing gold animation still supports partial-content requests. This is a local preview verification; no production deployment or newsletter activation was performed.
