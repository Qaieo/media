# Qaieo Frontier beside the research lab

Omid requested on October 23, 2026 that Qaieo Frontier appear on qaieo.com while preserving the research-lab identity. The root page keeps the lab introduction, agenda, research, releases and existing post anchors. `/lab.html` remains an identical alias. All ten research/news source files remain unchanged.

The Frontier section reads `https://yeki.ai/qaieo/feed.json` in the browser. Yeki owns the article bodies and canonical URLs. Its public v1 feed supplies the title, date, slug, tags, canonical article URL and first source attribution. The four newest dated entries display with canonical links; no article body is duplicated. Subsequent daily Yeki releases update this section without a second Qaieo deployment.

`site/frontier.mjs` validates the publication/schema, dates, bounded text, canonical Yeki article URLs, unique URLs and HTTPS source links. It inserts text through DOM text properties, not HTML. Requests omit credentials and referrer. A failed, malformed, oversized or timed-out response keeps a working Frontier archive link, including with JavaScript disabled. The Yeki feed must allow the `https://qaieo.com` origin through CORS.

The previous marketing landing sources and `site/data/` files are retained as history; the build no longer makes that landing the home page or reads its static article list. This change does not publish videos, activate newsletter sending, configure analytics, or alter the subscription backend. The existing newsletter implementation remains subject to its documented configuration and acceptance requirements.

## Build and verification

Use the patched runtime required by `.node-version` (22.23.4 or a supported later release):

```sh
node site/build.mjs
node --test site/node-runtime.test.mjs site/frontier.test.mjs
git diff --check
```

The build regenerates tracked `site/public` assets. Generated root and lab pages must match. Before publication, inspect desktop and mobile with the real feed, then check an unavailable-feed fallback and all existing lab navigation. Local browser verification used a mock feed at 1440px and 390px, including an HTML-looking title rendered as literal text; this does not establish production CORS or deployment.

Deployment continues through the reviewed Git/Cloudflare release path. A merged commit is not proof that qaieo.com serves it. Verify the actual Worker build source and live root, module, feed-driven cards, lab alias and canonical article links after release.
