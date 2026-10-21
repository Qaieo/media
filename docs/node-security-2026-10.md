# Node.js security baseline — 2026-10-21

The [October Node.js security release](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases) fixes DNS, TLS, HTTP, Brotli, snapshot entropy and permission-model issues, and updates bundled dependencies. The fixed releases are 22.23.4, 24.22.1 and 26.12.1. End-of-life and odd-numbered release lines are not accepted by this project's Node tooling.

## Repository exposure

- Audited main at `3040828f6672b5228f3c3266f274d6988198b631`, including its complete file tree and all three first-party JavaScript modules.
- `site/tracker.mjs` runs under Node and fetches GitHub release data over HTTPS. Its built-in fetch, TLS and response decoding depend on the installed Node binary. It previously accepted any Node version.
- `site/build.mjs` uses local filesystem operations. It has no network fetch, explicit Brotli decoding, startup snapshot/SEA, permission-model flags or custom DNS/TLS checks.
- There is no npm manifest, lockfile, container, or GitHub Actions workflow on this main revision. The Python/Perceval code is separate from these Node-specific vulnerabilities.
- `worker.js` serves static assets and sends subscriptions using Cloudflare's fetch implementation. It executes in Cloudflare's managed Workers runtime, not a project-installed Node executable. A Node version file controls build tooling; it does not patch workerd or prove the provider's shared libraries are unaffected.
- Cloudflare's observed build trigger uses repository root `/` and `npx wrangler deploy`. A dashboard `NODE_VERSION` override can take precedence over the repository version file. Deployment tooling also needs the patched Node runtime.

## Remediation and verification

`.node-version` pins 22.23.4 for version managers and Cloudflare Builds. Both Node scripts reject vulnerable, unsupported and prerelease runtimes before application I/O. The guard allows later patches/minors on the three explicitly supported major lines. Run these checks with the patched binary:

```sh
node --version
node --test site/node-runtime.test.mjs
node site/build.mjs
```

Update the machine or scheduler that invokes `site/tracker.mjs` to the same patched Node release before its next run. A guard stops an old runtime; it cannot replace that machine's executable. No tracker network requests or new posts are needed to validate this patch.

Do not change `compatibility_date` as a substitute for a Node upgrade. Merge/deploy this fix through normal review, verify the build's actual `node --version`, and check any dashboard override. Cloudflare owns workerd patching. This audit identifies vulnerable-version/configuration exposure; it is not evidence of exploitation or a forensic review.

Open landing-page PR #2 also touches `site/build.mjs`; preserve this runtime guard when resolving that overlap and apply it to any additional Node entry points introduced there.
