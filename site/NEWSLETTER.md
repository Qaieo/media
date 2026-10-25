## Authorized website release — October 24, 2026 PDT

The founder approved publishing the gold particle wave and automatic latest-three Frontier feed to qaieo.com. This supersedes the earlier website publication hold below. Newsletter activation remains pending: the current release disables the email and submit controls, labels signup “Opening soon”, and retains Read the latest articles as the working action. `NEWSLETTER_READY` stays false until Kit is configured and its confirmation flow is verified. No subscriber addresses or email sends are part of this release.

# Qaieo newsletter: EPD workflow

> Current website direction: Qaieo covers awards, milestones and contracts shaping the physical economy. Early-stage and scaling companies are central. The homepage retains its newsletter hero, disabled signup and live latest-three Frontier feed, with dedicated industry sections; earlier quantum research remains a collapsible archive. Newsletter activation is pending the Kit connection and verified confirmation flow. Sending is not activated by this design change. See [the current website path](../docs/frontier-publishing.md).

Owner: Omid. Scope: the subscribe path on qaieo.com, what happens after signup, what we measure, and how it can take money later. This is the product and engineering contract for the newsletter; editorial rules live in the Yeki repo (`docs/qaieo/newsletter.md`).

## Coverage and evidence

The current positioning supersedes research-lab-first descriptions: **Awards, milestones and contracts shaping the physical economy.** Focus on early-stage and scaling companies; include established companies when their work defines an industry. Core coverage is **Robotics**, **Photonics**, and **Aerospace & defense** (including space). Supporting coverage is **Energy** and **Industry & infrastructure**; **Emerging frontiers** covers other physical technologies. Grants and prizes remain in scope. Industry sections refresh from all published feed metadata, with no invented stories for empty categories.

Quantum research and release notes remain available as an archive. Existing articles keep their titles, dates, bodies, tags, sources and canonical URLs; this positioning update does not change the Yeki publishing workflow or establish a sending cadence.

- Lead with the recipient, awarding body, award date and status, scope of work and primary source. Distinguish an announced award from work delivered.
- Label contract ceilings and potential values separately from funds obligated, payments received and revenue. Do not present a program-wide budget as one company's award.
- For commercialization grants, report disclosed conditions, milestones, matching funds and payment stages. State when terms are unavailable; do not imply that a selection or conditional award is cash received or commercial validation.
- Explain what the company builds and the evidence behind its commercial progress. Separate reported facts from analysis, and retain visible corrections and relevant disclosures.
- Cover product launches, deployments, manufacturing scale and delivery milestones when primary evidence supports their status and significance. Keep the reporting tied to commercial progress within the defined industries.

## 1. Kit connection — October 24, 2026

Kit is the selected newsletter provider. The local Worker replaces the unconfigured Loops path with Kit v4: create an inactive subscriber, then enroll in the Qaieo form. Existing subscriber states are preserved; cancelled, bounced or complained subscribers are not re-enrolled. Secrets stay server-side and provider response bodies are not logged.

Status: implementation prepared; Kit account login, form configuration and credentials are still pending. No live subscription or email has been sent. Do not merge or publish the signup redesign until the end-to-end confirmation flow has been verified.

## 2. Activation checklist

- Sign in to the owner's Kit account; create/select the Qaieo newsletter form.
- Enable the confirmation email and leave auto-confirm OFF. API-created subscribers start inactive; the form settings must still be checked.
- Set the numeric form ID as `KIT_FORM_ID` in wrangler.jsonc. Store a Kit v4 API key as Worker secret `KIT_API_KEY`; never put the key in source or chat.
- Verify the sending identity and required account information in Kit.
- Use an owner-authorized test inbox: submit, receive confirmation, confirm, verify subscription and unsubscribe behavior. Check repeat signup and provider failures.
- Keep production publication on hold until these checks pass. Publish through the existing reviewed Git/Cloudflare workflow.

## 3. Subscriber experience

Homepage: **The physical economy. In your inbox.** CTA: **Sign up**.
Success: **Check your inbox to confirm your subscription. If you already subscribe, you are all set.**

Confirmation email proposal:
- Subject: Confirm your Qaieo subscription
- Body: Awards, milestones and contracts shaping the physical economy. Confirm below to receive Qaieo Frontier.
- Button: Confirm subscription

No sending cadence is promised. Kit is the subscriber system of record; the Worker does not store addresses. Campaign UTM parameters are forwarded as form attribution; arbitrary custom fields are not created. No campaigns, paid plan, analytics or automation are activated by this change.

## 4. Editorial workflow

The Frontier archive on yeki.ai remains the article source of truth. Prepare broadcasts in Kit with the article title, concise summary and canonical article link. Use `utm_source=qaieo-newsletter&utm_medium=email&utm_campaign=<issue-slug>`. Send only after owner authorization. Keep corrections and sponsorship disclosures visible. Monetization and automated sends remain separate decisions.

## References

- https://developers.kit.com/api-reference/subscribers/create-a-subscriber
- https://developers.kit.com/api-reference/forms/add-subscriber-to-form
- https://help.kit.com/en/articles/2502655-the-confirmation-email
