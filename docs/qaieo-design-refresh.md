## Current follow-up — October 24, 2026 PDT

The founder superseded the research-lab-first positioning with: **Recent awards, commercialization grants and the companies building the physical economy.** The prepared follow-up uses “The physical economy. In your inbox.” and a single hero signup form. Header navigation is About and Sign up for newsletter; all document pages offer a route to that form. About, coverage, current metadata, footer and disclosure introduction follow the new definition. Original article bodies and dates remain unchanged in a collapsible archive, with working hash links and the identical `/lab.html` compatibility alias. RSS is clearly labelled as the research archive rather than implying it is the current Frontier feed.

`site/ripple.mjs` renders a quiet contour field behind the hero. It uses no video or external animation service. It caps rendering at 30fps and backing-store density at 1.5, uses fewer contours on narrow screens, pauses while hidden/offscreen, supports an explicit pause and paints a static field for reduced motion. Pointer response is slight and ignores touch movement. Canvas failure leaves a fully usable page without the decorative field.

Validation: build, all 12 runtime/feed/motion tests, archive hash navigation, one signup form, desktop and 390px/320px layouts. The original approved logo bytes, article bodies, canonical feed module and subscription endpoint remain unchanged. Local feed fallback is expected because the production feed permits the Qaieo origin, not loopback.

**Publication hold:** live Cloudflare settings still contain a placeholder `LOOPS_LIST_ID` and no `LOOPS_API_KEY` secret. The user has been asked which service to connect. The design is ready for review; newsletter collection and sending have not been activated or represented as working. No real subscription or email send was performed.

---

# Qaieo editorial design refresh

Local implementation based on remote `main` at `9f87600f459d9d54db20fc85e9e41f27c1cfd1c7` (approved white Qaieo logo and favicon, PR #7). Working branch: `codex/qaieo-design-refresh`. This document records local verification, not a production release.

The research-lab site now shares Yeki's graphite, warm ivory and restrained ember palette, bundled Geist typography, generous responsive gutters and thin editorial dividers. The lab introduction leads into the canonical Frontier feed, research agenda and full research/news articles. About, Releases and Disclosures use the same shell. There is one finite ornamental hero entry and a complete reduced-motion presentation.

The approved logo and favicon are reused without redrawing or changing their bytes or proportions. All ten article blocks and anchors, root/lab alias, source attribution, RSS, Frontier fetch/validation and subscription handler are preserved. The newsletter gains a visible email label and live status semantics; its POST endpoint, honeypot and handler are unchanged. No subscriptions were submitted. Historical landing sources, the Worker, deployment configuration and analytics remain untouched.

Logo SHA-256 values match the base: `qaieo-logo-white.png` → `cc793ef21c8c827a4677a3a4ab7b90338c40b905c9274c619356b10fd579e454`; `qaieo-avatar.png` → `319ef15927606871da2d2487cfc518993d8ae66492fbf9efbd36799a33b842f3`.

Intentional copy changes are limited to presentation: the existing lab introduction is split into the headline “How quantum computing gets built and financed.” and its supporting paragraph; the hero reuses three questions from About (“Who is buying?”, “What was promised?”, “What does it cost to finish?”). Research/News section descriptions reuse existing About/introduction wording. New navigation/eyebrow labels name their existing destinations or sections: “Read Qaieo Frontier”, “Inside the research lab”, “From the physical economy”, “The questions behind the research”, “From the lab”, “Developments that matter”, “View the release timeline” and “Qaieo, in your inbox”. The form adds “Email address” as its visible label. No article, About or Disclosures source prose was edited.

## Local checks

Use the supported repository runtime; this machine has Node `v22.23.4` at `/private/tmp/qaieo-node22/node_modules/node/bin/node`.

```sh
node site/build.mjs
node --test site/node-runtime.test.mjs site/frontier.test.mjs
git diff --check
python3 -m http.server 8768 --bind 127.0.0.1 --directory site/public
```

- Build passed: ten posts, seven releases; all eight existing Node/runtime/Frontier checks passed.
- Compared all ten complete generated article blocks against the base; they are identical. Root and lab generated HTML match. Subscription script, feed module, RSS, Worker/config and approved logo bytes match the base.
- Inspected the desktop hero, real-feed failure/archive fallback, and a temporary four-article synthetic layout fixture through the browser. Inspected 390px, 320px and 768px layouts; observed no horizontal overflow. About and Releases were inspected at 320px. The synthetic fixture was removed from `site/public` after inspection.
- The standard loopback preview displayed its working archive fallback. The fixture validates layout only; it does not establish production CORS or publication. The coordinator separately verified the current live page loading four public-feed posts; this refresh leaves that feed module unchanged.

Open `http://127.0.0.1:8768/` while the preview server is running. Review source changes in `site/build.mjs` and `site/style.css`; `site/public/` is regenerated output.

## Bundled fonts

Unmodified Geist and Geist Mono variable WOFF2 files from Vercel's `geist@1.8.1` package, matching Yeki's existing bundled files. SIL Open Font License 1.1 is included in `site/fonts/LICENSE.txt` and copied beside the served fonts. Pages do not request remote fonts.

- Geist SHA-256: `9ce2d97863cab59a0c7522534112d6c42a4e25c0e6b2ab37766761b0f82cfbd6`
- Geist Mono SHA-256: `119f3e159fc15dd77311e929d3a657a193b57a3e625234666bc43c6e2b1127f7`
- Upstream: https://github.com/vercel/geist-font
- Package: https://registry.npmjs.org/geist/-/geist-1.8.1.tgz

## Release context

`wrangler.jsonc` configures Worker `qaieo`, `worker.js`, and static assets from tracked `site/public`. Existing repository documentation records Cloudflare Builds using repository root `/` and `npx wrangler deploy`. No GitHub Actions deployment workflow is present. The current dashboard trigger and release ownership need inspection as part of the authorized release; do not infer them from a local build.

After release, verify the actual Worker build source, live homepage and lab alias, logo/fonts, Frontier cards with canonical article/source links, mobile layout, About/Releases/Disclosures and RSS. Keep the existing feed/publishing workflow and subscription configuration unchanged.
