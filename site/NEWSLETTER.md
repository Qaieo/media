# Qaieo newsletter: EPD workflow

> Current website direction: Qaieo covers recent awards, commercialization grants and the companies building the physical economy. The prepared homepage leads with a newsletter signup hero and this definition, followed by the live Frontier feed; earlier quantum research remains a collapsible archive. Production publication is pending the newsletter connection. Sending is not activated by this design change. See [the current website path](../docs/frontier-publishing.md).

Owner: Omid. Scope: the subscribe path on qaieo.com, what happens after signup, what we measure, and how it can take money later. This is the product and engineering contract for the newsletter; editorial rules live in the Yeki repo (`docs/qaieo/newsletter.md`).

## Coverage and evidence

The current positioning supersedes research-lab-first descriptions: **Recent awards, commercialization grants and the companies building the physical economy.** Quantum research and release notes remain available as an archive. Existing articles keep their canonical URLs and feed; this positioning update does not change the Yeki publishing workflow or establish a sending cadence.

- Lead with the recipient, awarding body, award date and status, scope of work and primary source. Distinguish an announced award from work delivered.
- Label contract ceilings and potential values separately from funds obligated, payments received and revenue. Do not present a program-wide budget as one company's award.
- For commercialization grants, report disclosed conditions, milestones, matching funds and payment stages. State when terms are unavailable; do not imply that a selection or conditional award is cash received or commercial validation.
- Explain what the company builds and the evidence behind its commercial progress. Separate reported facts from analysis, and retain visible corrections and relevant disclosures.

## 1. Current state (October 24, 2026 PDT)

| Piece | Where | Status |
| --- | --- | --- |
| Signup form | `site/build.mjs` → hero `#newsletter` / form `#qaieo-subscribe` | Prepared locally as the primary CTA; one email field, honeypot, existing status feedback and endpoint. Header and About CTA link here. |
| Endpoint | `worker.js` `POST /api/subscribe` | Existing implementation validates email and forwards to Loops `contacts/create`. Unchanged in the design update. |
| List | Live Worker `qaieo`, `LOOPS_LIST_ID` | **Confirmed placeholder** `REPLACE_WITH_QAIEO_LIST_ID` by read-only Cloudflare settings inspection. |
| API key | Live Worker `qaieo`, `LOOPS_API_KEY` | **Absent**, confirmed by settings bindings and the separate secret-name list (empty). No secret values retrieved. |
| Signup readiness | Production | **Blocked:** a real list ID and API-key connection are required before advertising the redesigned signup flow as working. No real email submitted. |
| Sending | Loops | Not configured or verified by this work. No issue sent and no cadence newly promised. |

Current prepared UX: **“The physical economy. In your inbox.”** with **Sign up**, About and newsletter navigation, latest articles, coverage context and an optional research archive. The contour field is decorative, limited to 30fps, paused offscreen/in hidden tabs, and static for reduced-motion users. The approved white artwork is unchanged.

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
