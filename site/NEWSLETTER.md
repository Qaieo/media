# Qaieo newsletter: EPD workflow

Owner: Omid. Scope: the subscribe path on qaieo.com, what happens after signup, what we measure, and how it can take money later. This is the product and engineering contract for the newsletter; editorial rules live in the Yeki repo (`docs/qaieo/newsletter.md`).

## 1. Current state (as of 2026-10-21)

| Piece | Where | Status |
| --- | --- | --- |
| Signup form | `site/landing.mjs` → `#subscribe` | Live in build. Honeypot, hidden `source`, UTM and referrer fields. |
| Endpoint | `worker.js` `POST /api/subscribe` | Validates email, forwards to Loops `contacts/create` with attribution properties. |
| List | Loops mailing list `LOOPS_LIST_ID` | **Placeholder in `wrangler.jsonc`.** Signups fail with 502 until the real list id is set. |
| API key | Wrangler secret `LOOPS_API_KEY` | Must be set with `wrangler secret put LOOPS_API_KEY`. |
| Site analytics | Cloudflare Web Analytics beacon | Injected only when `CF_BEACON_TOKEN` is set at build time. Not set yet. |
| Send | Loops | Nothing sends yet. No issue has been emailed. |

## 2. Pipeline

```
visitor → qaieo.com (beacon: pageview, referrer, UTM)
        → POST /api/subscribe {email, source, utm_*, referrer}
        → Loops contact (properties: source, utm_*, referrer, subscribedAt)
        → Loops double opt-in email → confirmed → mailing list
        → issue send (Loops campaign or transactional per issue)
        → opens / clicks (Loops) → links carry utm_source=qaieo-newsletter
        → yeki.ai/qaieo/media/<slug> (Yeki analytics)
```

Rules:
- Double opt-in on. Confirmed contacts only on the list. Unconfirmed drop after 7 days.
- One list, segmented by properties, not many lists.
- Every outbound link in an issue carries `utm_source=qaieo-newsletter&utm_medium=email&utm_campaign=<issue-slug>`.
- The worker never stores email. Loops is the system of record. Export from Loops is the backup.

## 3. Tracking

Events to be able to answer, in order of importance:
1. Signups per day, by `source` and `utm_source` (Loops contact properties; filter in Loops audience view).
2. Confirmation rate (double opt-in confirmed / created).
3. Open and click rate per issue (Loops campaign stats).
4. Clicks through to yeki.ai per issue (Yeki side, by `utm_campaign`).
5. Unsubscribes per issue.

Site side: Cloudflare Web Analytics gives pageviews, referrers and country with no cookie banner. Set `CF_BEACON_TOKEN` in the Workers Build environment and rebuild. If finer funnel data is wanted later (scroll depth, form focus), add Plausible or PostHog; not before there is traffic to read.

## 4. Sending an issue

Source of truth for issues is the Frontier archive on yeki.ai. An issue email is the article's title, dek and a "Read on Qaieo" link, not the full body, so the click lands on the site where analytics live.

Manual for now: create the Loops campaign from the article, send to the list. Automate once there are 100+ confirmed contacts: a GitHub Action on the Yeki repo that calls the Loops campaign API when a Frontier article merges. Do not automate before double opt-in is verified end to end with a real inbox.

## 5. Monetization path

Decision deferred until there are at least 500 confirmed subscribers and 4 weeks of open-rate data. Keep the list portable (CSV export, no vendor-locked content) so a move costs a day.

| Option | When | Needs |
| --- | --- | --- |
| Sponsored slot | first; one line per issue, physical-economy vendors and lenders | a rate card, a disclosure line, sponsor tracked by `utm_content` |
| Paid tier | if open rate holds above 40% at 1,000+ | Loops has no paywall; move to Ghost (self-host on Workers is not supported, so hosted Ghost or beehiiv) or add Stripe + a members-only Frontier section on yeki.ai |
| Data or deal-flow product | later; the awards database behind Frontier | a Yeki product decision, not a newsletter one |

Loops is right for the first two stages (free, transactional-friendly, API). If paid subscriptions become the plan, the provider changes; the pipeline above is written so only the "Loops" box changes.

## 6. Launch checklist

- [ ] Create the Qaieo list in Loops, paste its id into `wrangler.jsonc` `LOOPS_LIST_ID`.
- [ ] `wrangler secret put LOOPS_API_KEY`.
- [ ] Turn on double opt-in in Loops and write the confirmation email (one line, Qaieo voice).
- [ ] Create a Cloudflare Web Analytics site for qaieo.com; set `CF_BEACON_TOKEN` in the build environment.
- [ ] Deploy, submit a real email on qaieo.com, confirm, verify the contact shows `source=qaieo.com/landing`.
- [ ] Send the first issue manually; check `utm_campaign` arrives on yeki.ai.
- [ ] Add the newsletter line to `site/disclosures.md` (sponsorship policy) before the first sponsored slot.
