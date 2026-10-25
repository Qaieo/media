## Authorized website release — October 24, 2026 PDT

The founder approved publishing the gold particle wave and automatic latest-three Frontier feed to qaieo.com. This supersedes the earlier website publication hold below. Newsletter activation remains pending: the current release disables the email and submit controls, labels signup “Opening soon”, and retains Read the latest articles as the working action. `NEWSLETTER_READY` stays false until Kit is configured and its confirmation flow is verified. No subscriber addresses or email sends are part of this release.

# Qaieo Frontier and the research archive

Omid's current definition of Qaieo is: **Awards, milestones and contracts shaping the physical economy.** Early-stage and scaling companies are central; established companies appear when their work defines an industry. Grants and prizes remain part of the coverage. This supersedes the October 23 research-lab-first positioning and broadens the October 24 award/grant framing without turning Frontier into general technology news. The homepage retains “The physical economy. In your inbox.”, the gold particle field, existing typography and palette, disabled signup, and the latest-three Frontier block. About, Industries and newsletter details are the primary navigation links. A collapsed research archive below retains all ten existing article blocks and their anchors; deep links automatically reveal the referenced archive content. `/lab.html` remains an identical compatibility alias. All ten research/news source files remain unchanged.

The Frontier section presents **Qaieo Frontier** and its company focus on the left, with three stacked articles on the right. Dedicated sections cover **Robotics**, **Photonics**, **Aerospace & defense** (including space), **Energy**, **Industry & infrastructure**, and **Emerging frontiers**. The first three are the core industries; energy and industry/infrastructure are supporting coverage. The browser reads the same-origin `/api/frontier` route. Both the Worker and the local preview proxy the fixed public `https://yeki.ai/qaieo/feed.json` endpoint. Yeki owns the article bodies and canonical URLs; no article body is duplicated. The v1 feed supplies each title, publication date, slug, tags, canonical article URL and first source attribution, plus an optional `industries` array.

Display the **latest three distinct published articles**, newest first. Determine today's publication date in `America/Los_Angeles`, exclude future-dated entries before deduplicating by slug, and skip calendar days with no publication. Never insert empty day slots or relabel older posts as today. Refresh on initial load, every 60 seconds while the page is visible, and when the visitor returns to the tab. New Yeki publications appear without another Qaieo build. Unchanged responses preserve existing article nodes and focus; temporary failures preserve the last successful list and show a brief status. A first-load failure or disabled JavaScript leaves the archive link available.

Industry sections use **all validated, currently published metadata**, not the latest-three slice. They share the same refresh and failure path and deduplicate by slug within each section. An article can appear in multiple relevant industries. Empty categories explicitly say that no coverage has been published; no placeholder stories are invented. Per-section keys keep unchanged nodes and keyboard focus intact even when another section changes. If a refreshed section still contains the focused article/source link, focus is restored without scrolling.

The optional `industries` field accepts only `robotics`, `photonics`, `aerospace-defense`, `energy`, `industry-infrastructure`, and `emerging-frontiers`; an explicit empty array is honored. Malformed supplied metadata rejects the feed and preserves the last successful response. Only when the field is absent, case-insensitive exact tags map through these aliases:

- Robotics: Robotics; Space robotics.
- Photonics: Photonics; Optics; Optical computing; Optical communications; Lasers; Quantum photonics.
- Aerospace & defense: Aerospace & defense; Aerospace and defense; Aerospace; Defense; Space; Space robotics; Spacecraft propulsion; Aviation; Navy.
- Energy: Energy; Solar; Grid; Energy storage; Nuclear; Power systems.
- Industry & infrastructure: Industry & infrastructure; Industry and infrastructure; Industrial; Industry; Infrastructure; Hardware; Manufacturing; Materials; Construction; Logistics; Semiconductors.

Unrecognized legacy tags fall under Emerging frontiers. An Introduction tag excludes an article from every industry, including when explicit IDs are present. Existing article tags, titles, dates, bodies and sources remain unchanged. New articles use the canonical section labels. The feed remains v1 and legacy metadata remains supported.

`site/frontier-data.mjs` validates the public schema, publication identity, dates, bounded text, canonical Yeki article URLs and HTTPS source links. `site/frontier.mjs` inserts text through DOM text properties, not HTML. `site/frontier-proxy.mjs` limits upstream response size, aborts after eight seconds, rejects redirects and returns generic errors. The upstream destination is fixed, and visitor cookies, authorization and referrer are not forwarded. Feed responses have a 60-second public cache lifetime. Browser requests omit credentials and referrer. The same-origin route avoids depending on third-party browser CORS access; it does not access subscriber records or send email.

The previous marketing landing sources and `site/data/` files are retained as history; the build no longer makes that landing the home page or reads its static article list. This change does not publish videos, activate newsletter sending, configure analytics, or alter the subscription backend. The existing newsletter implementation remains subject to its documented configuration and acceptance requirements.

## Website motion direction — October 25, 2026

Keep the homepage to one cursor-driven gold particle field. Do not layer a video over the interactive surface or add visible Pause/Resume motion buttons. This is the founder's requested design preference for future Qaieo website work. The field renders immediately, follows pointer movement, and settles to a still frame when input stops; there is no autonomous playback. Use a small pointer-only interaction hint, hide it on touch and reduced-motion devices, respect `prefers-reduced-motion`, and suspend rendering when the page is hidden or the hero is offscreen. The poster is only a no-canvas/no-JavaScript fallback, never a second visible wave above the live canvas.

## Editorial boundaries

Coverage follows awards, milestones and contracts, including commercialization grants and prizes, across the defined industries. Report the recipient, buyer, work scope, product or deployment milestone, date and status. Cite primary records where available and keep announcement, obligation, payment and delivery distinct. A contract ceiling is not funds obligated; a conditional grant is not proof of cash received or successful commercialization. Preserve uncertainty when terms or progress are not public. The fuller newsletter editorial rules remain in the Yeki repository; this change preserves its canonical articles and public feed.

## Build and verification

Use the patched runtime required by `.node-version` (22.23.4 or a supported later release):

```sh
node site/build.mjs
node --test site/*.test.mjs
node site/preview.mjs
git diff --check
```

The preview command serves `http://127.0.0.1:8768/index.html`, including the real public feed route. A plain static server cannot serve `/api/frontier`. Local newsletter submissions remain disabled. The build regenerates tracked `site/public` assets. Generated root and lab pages must match. Check that the root presents the current definition and six industry sections, and that archive sections, existing post anchors and RSS links remain reachable. Before publication, inspect desktop and mobile with the real feed, then check an unavailable-feed fallback and all existing archive navigation. Automated checks cover exact industry mapping, optional/legacy metadata, multi-industry membership, updates beyond the latest three, empty categories, publication gaps, future posts, duplicate slugs, Pacific midnight, safe text rendering, refresh events, focus, last-good preservation and proxy failures. Local browser verification must use the real feed; it does not establish production deployment.

Deployment continues through the reviewed Git/Cloudflare release path. A merged commit is not proof that qaieo.com serves it. Verify the actual Worker build source and live root, module, feed-driven cards, lab alias, archive sections and canonical article links after release.

## October 24, 2026 local verification

The real-feed preview at `http://127.0.0.1:8768/index.html#frontier` loaded Momentus (October 24), Gecko (October 22) and AstraQua (October 21), with canonical article URLs and original source links. Desktop and 390px mobile checks passed without horizontal overflow. All 36 website tests pass under Node 22.23.4. The existing gold animation still supports partial-content requests. This is a local preview verification; no production deployment or newsletter activation was performed.

## Cloudflare runtime redirect handling

The public Worker uses `redirect: "manual"` and rejects non-2xx responses, including redirects, without following them. Workers does not support the standard `error` redirect mode that Node accepts; that option caused the initial production feed request to fail before network access. The fixed upstream destination and no-credentials boundary remain unchanged. Reference: https://developers.cloudflare.com/workers/runtime-apis/request/#parameters.

## Ecosystem data responsibilities — October 25, 2026

Omid's current direction: **Toekyn generates Verified Work™ data. Qaieo owns simulation, reinforcement learning (RL), evaluations and machine-learning (ML) datasets/models, combining verified-work data with simulation data. Yeki combines these inputs and research outputs with external API data for underwriting and purchase-order/milestone financing workflows.**

The four planned government sources are **SAM.gov Opportunities, SAM.gov Contract Awards, USAspending and SAM.gov Entity Management**. These are four feeds across SAM.gov and USAspending, not four additional APIs beyond SAM.gov. Durable collectors and signals remain planned and are not activated; local read-only adapters and fixtures do not establish a live production data path. Do not describe the complete production data path as live.

Keep physical observations, reviewed/verified work, simulation outputs, model estimates and independent outcomes separately identifiable, with source lineage, availability cutoffs and purpose-specific rights. Observed, reviewed, verified, customer-accepted and paid remain distinct. A shared source or a simulation derived from a Verified Work™/API record is not independent corroboration. Public award data does not prove execution, customer acceptance or payment.

Current demonstrations use synthetic data; financing remains in shadow mode. This role clarification activates no collector, real-data ingestion, external training, credit-policy change or financial action. The canonical cross-product description is [Yeki's ecosystem data responsibilities](https://github.com/omeal007/yeki/blob/main/docs/strategy/ecosystem-data-roles.md).

## Product naming — October 25, 2026

Use **Verified Work™** for the product terminology previously labeled TVW in current copy and guidance. This is a naming change, not a new verification state or a claim that research assessments are calibrated. Preserve the meaning of evidence records, simulation outputs and independent outcomes. Existing `tvw` schema/API identifiers, versioned artifacts, filenames and dated historical records remain unchanged for compatibility. Financing remains in shadow mode.
