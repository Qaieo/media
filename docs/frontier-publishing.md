# Qaieo Frontier and the research archive

Omid's current definition of Qaieo is: **Recent awards, commercialization grants and the companies building the physical economy.** This supersedes the October 23 research-lab-first positioning. The prepared root page leads with a concise newsletter signup hero using that definition, followed by the live Frontier feed. About and newsletter signup are the two primary navigation links. Publication of this signup-focused version is pending a working newsletter connection. A collapsed research archive below retains all ten existing article blocks and their anchors; deep links automatically reveal the referenced archive content. `/lab.html` remains an identical compatibility alias. All ten research/news source files remain unchanged.

The Frontier section reads `https://yeki.ai/qaieo/feed.json` in the browser. Yeki owns the article bodies and canonical URLs. Its public v1 feed supplies the title, date, slug, tags, canonical article URL and first source attribution. The four newest dated entries display with canonical links; no article body is duplicated. Subsequent daily Yeki releases update this section without a second Qaieo deployment.

`site/frontier.mjs` validates the publication/schema, dates, bounded text, canonical Yeki article URLs, unique URLs and HTTPS source links. It inserts text through DOM text properties, not HTML. Requests omit credentials and referrer. A failed, malformed, oversized or timed-out response keeps a working Frontier archive link, including with JavaScript disabled. The Yeki feed must allow the `https://qaieo.com` origin through CORS.

The previous marketing landing sources and `site/data/` files are retained as history; the build no longer makes that landing the home page or reads its static article list. This change does not publish videos, activate newsletter sending, configure analytics, or alter the subscription backend. The existing newsletter implementation remains subject to its documented configuration and acceptance requirements.

## Editorial boundaries

Coverage follows recent awards, commercialization grants and the companies delivering products, facilities and infrastructure. Cite the underlying award or grant record where available, identify its date and status, and keep announcement, obligation, payment and delivery distinct. A contract ceiling is not funds obligated; a conditional grant is not proof of cash received or successful commercialization. Preserve uncertainty when terms or progress are not public. The fuller newsletter editorial rules remain in the Yeki repository; this change preserves its canonical articles and public feed.

## Build and verification

Use the patched runtime required by `.node-version` (22.23.4 or a supported later release):

```sh
node site/build.mjs
node --test site/node-runtime.test.mjs site/frontier.test.mjs site/ripple.test.mjs
git diff --check
```

The build regenerates tracked `site/public` assets. Generated root and lab pages must match. Check that the root presents the current definition and that the archive sections, existing post anchors and RSS links remain reachable. Before publication, inspect desktop and mobile with the real feed, then check an unavailable-feed fallback and all existing archive navigation. Prior local browser verification used a mock feed at 1440px and 390px, including an HTML-looking title rendered as literal text; this does not establish production CORS or deployment.

Deployment continues through the reviewed Git/Cloudflare release path. A merged commit is not proof that qaieo.com serves it. Verify the actual Worker build source and live root, module, feed-driven cards, lab alias, archive sections and canonical article links after release.
