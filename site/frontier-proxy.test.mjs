import test from "node:test";
import assert from "node:assert/strict";
import { ARCHIVE_URL, UPSTREAM_FEED_URL } from "./frontier-data.mjs";
import { frontierResponse } from "./frontier-proxy.mjs";
import worker from "../worker.js";

function feed() {
  return {
    version: 1, publication: "Qaieo Frontier", archiveUrl: ARCHIVE_URL,
    articles: [{
      title: "A published robotics award", date: "2026-10-22", slug: "robotics-award",
      url: `${ARCHIVE_URL}/robotics-award`, tags: ["Robotics"],
      source: { label: "Public award notice", href: "https://example.org/award" },
    }],
  };
}
const request = (options = {}) => new Request("https://qaieo.com/api/frontier", options);
const unavailable = { error: "Frontier feed temporarily unavailable." };

test("fetches only the fixed public feed without caller credentials or parameters", async () => {
  let calls = 0;
  const input = feed();
  input.privateField = "not public";
  input.articles[0].privateField = "not public";
  const response = await frontierResponse(new Request("https://qaieo.com/api/frontier?url=https://evil.test&token=private", {
    headers: { Authorization: "Bearer private", Cookie: "session=private", Referer: "https://private.test/" },
  }), async (url, options) => {
    calls++;
    assert.equal(url, UPSTREAM_FEED_URL);
    assert.deepEqual(options.headers, { Accept: "application/json" });
    assert.equal(options.method, "GET");
    assert.equal(options.credentials, "omit");
    assert.equal(options.referrerPolicy, "no-referrer");
    assert.equal(options.redirect, "manual");
    assert.equal(options.cache, "no-store");
    assert.ok(options.signal instanceof AbortSignal);
    assert.equal(options.body, undefined);
    return Response.json(input);
  });
  assert.equal(calls, 1);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "public, max-age=60");
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
  assert.deepEqual(await response.json(), feed());
});

test("HEAD returns metadata without a body; other methods do not fetch", async () => {
  const head = await frontierResponse(request({ method: "HEAD" }), async () => Response.json(feed()));
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
  assert.equal(head.headers.get("Content-Type"), "application/json; charset=utf-8");
  for (const method of ["POST", "PUT", "DELETE", "OPTIONS"]) {
    const response = await frontierResponse(request({ method }), () => assert.fail("Must not fetch"));
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("Allow"), "GET, HEAD");
  }
});

test("malformed JSON, malformed metadata, and unexpected article destinations fail closed", async () => {
  const invalidUrl = feed();
  invalidUrl.articles[0].url = "https://evil.test/robotics-award";
  for (const body of ["not json", JSON.stringify({ articles: [] }), JSON.stringify(invalidUrl)]) {
    const response = await frontierResponse(request(), async () => new Response(body));
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), unavailable);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
  }
});

test("rejects oversized declared lengths and cancels oversized streamed bodies", async () => {
  const declared = await frontierResponse(request(), async () => new Response("{}", { headers: { "Content-Length": "150001" } }));
  assert.equal(declared.status, 502);
  let cancelled = false;
  const streamed = await frontierResponse(request(), async () => new Response(new ReadableStream({
    pull(controller) { controller.enqueue(new Uint8Array(50_001).fill(32)); },
    cancel() { cancelled = true; },
  })));
  assert.equal(streamed.status, 502);
  assert.ok(cancelled);
  assert.deepEqual(await streamed.json(), unavailable);
});

test("upstream errors and redirects expose no upstream response or exception details", async () => {
  for (const fetchFeed of [
    async () => new Response("private provider details", { status: 500 }),
    async () => new Response(null, { status: 302, headers: { Location: "https://evil.test/" } }),
    async () => { throw new Error("private credentials in error"); },
  ]) {
    const response = await frontierResponse(request(), fetchFeed);
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), unavailable);
  }
});

test("aborts an unresponsive upstream after eight seconds", async t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let signal;
  const pending = frontierResponse(request(), async (_url, options) => {
    signal = options.signal;
    return new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true }));
  });
  t.mock.timers.tick(7_999);
  assert.equal(signal.aborted, false);
  t.mock.timers.tick(1);
  assert.equal(signal.aborted, true);
  const response = await pending;
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), unavailable);
});

test("Worker serves the Frontier route before static assets", async t => {
  t.mock.method(globalThis, "fetch", async () => Response.json(feed()));
  const response = await worker.fetch(request(), { ASSETS: { fetch: () => assert.fail("Must not reach assets") } });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), feed());
});
