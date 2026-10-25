import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseFrontierFeed, frontierDate, latestFrontierArticles, loadFrontier, startFrontier } from "./frontier.mjs";

const article = {
  title: "A public award", date: "2026-10-22", slug: "a-public-award",
  url: "https://yeki.ai/qaieo/media/a-public-award", tags: ["Robotics"],
  source: { label: "Awarding agency", href: "https://example.com/award" },
};
const feed = (articles = [article]) => ({ version: 1, publication: "Qaieo Frontier", archiveUrl: "https://yeki.ai/qaieo/media", articles });

test("accepts public v1 metadata and orders articles by date", () => {
  const older = { ...article, date: "2026-10-21", slug: "older", url: "https://yeki.ai/qaieo/media/older" };
  assert.deepEqual(parseFrontierFeed(feed([older, article])), [article, older]);
});

test("rejects untrusted routes, source schemes and malformed dates", () => {
  for (const patch of [
    { url: "https://yeki.ai.evil.test/qaieo/media/a-public-award" },
    { url: "https://yeki.ai/qaieo/media/a-public-award?tracking=1" },
    { url: "https://user@yeki.ai/qaieo/media/a-public-award" },
    { source: { label: "Source", href: "javascript:alert(1)" } },
    { source: { label: "Source", href: "https://user:password@example.com/" } },
    { date: "2026-02-30" }, { date: "invalid" }, { title: "" },
    { slug: "../sign-in" }, { tags: [null] },
  ]) assert.throws(() => parseFrontierFeed(feed([{ ...article, ...patch }])));
  assert.throws(() => parseFrontierFeed({ ...feed(), version: 2 }));
  assert.throws(() => parseFrontierFeed({ ...feed(), archiveUrl: "https://elsewhere.test" }));
});

test("unavailable or malformed feeds preserve the archive fallback", async () => {
  for (const fetchFeed of [
    async () => { throw new Error("Offline"); },
    async () => ({ ok: false }),
    async () => ({ ok: true, text: async () => "not JSON" }),
    async () => ({ ok: true, text: async () => JSON.stringify(feed([{ ...article, url: "https://evil.test" }])) }),
  ]) {
    const status = { textContent: "" };
    const list = { replaceChildren() { assert.fail("Failed feeds must not change content"); } };
    await loadFrontier({ getElementById: (id) => id === "frontier-status" ? status : list }, fetchFeed);
    assert.equal(status.textContent, "Articles are temporarily unavailable. Read the Frontier archive.");
  }
});

const dated = (slug, date) => ({ ...article, slug, date, title: slug, url: `https://yeki.ai/qaieo/media/${slug}` });
const response = (articles) => new Response(JSON.stringify(feed(articles)));

test("latest three published articles skip calendar gaps, future posts and duplicate slugs", () => {
  const articles = parseFrontierFeed(feed([
    dated("newest", "2026-10-25"), dated("oldest", "2026-10-01"),
    dated("third", "2026-10-15"), dated("second", "2026-10-21"),
    dated("newest", "2026-10-24"), dated("newest", "2026-10-24"),
  ]));
  assert.deepEqual(latestFrontierArticles("2026-10-24", articles).map(item => item.date), ["2026-10-24", "2026-10-21", "2026-10-15"]);
  assert.deepEqual(latestFrontierArticles("2026-09-30", articles), []);
});

test("publication eligibility rolls over at Pacific midnight, including daylight saving time", () => {
  assert.equal(frontierDate(new Date("2026-10-25T06:59:59Z")), "2026-10-24");
  assert.equal(frontierDate(new Date("2026-10-25T07:00:00Z")), "2026-10-25");
  assert.equal(frontierDate(new Date("2026-12-01T07:59:59Z")), "2026-11-30");
  assert.equal(frontierDate(new Date("2026-12-01T08:00:00Z")), "2026-12-01");
});

function documentFixture() {
  class Node {
    constructor(tag) { this.tag = tag; this.children = []; this.textContent = ""; this.replacements = 0; }
    append(...nodes) { this.children.push(...nodes); }
    setAttribute(name, value) { this[name] = value; }
    replaceChildren(fragment) { this.children = fragment.children; this.replacements++; }
  }
  const list = new Node("div"), status = new Node("p");
  const document = Object.assign(new EventTarget(), {
    visibilityState: "visible",
    getElementById: id => id === "frontier-articles" ? list : status,
    createElement: tag => new Node(tag), createDocumentFragment: () => new Node("fragment"),
  });
  return { document, list, status };
}

test("client refresh renders current metadata safely, preserves unchanged nodes and retains last good data on failure", async () => {
  const { document, list, status } = documentFixture();
  const now = new Date("2026-10-24T18:00:00Z");
  const articles = [dated("newest", "2026-10-24"), dated("second", "2026-10-22"), dated("third", "2026-10-21")];
  articles[0].title = "<script>not executable</script>";
  await loadFrontier(document, async (url, options) => {
    assert.equal(url, "/api/frontier");
    assert.equal(options.credentials, "omit");
    return response(articles);
  }, now);
  assert.equal(list.children.length, 3);
  assert.equal(list.children[0].children[1].children[0].children[0].textContent, articles[0].title);
  assert.equal(list.children[0].children[1].children[0].href, articles[0].url);
  assert.equal(status.textContent, "Latest published · Updates automatically");
  const first = list.children[0];
  await loadFrontier(document, async () => response(articles), now);
  assert.equal(list.children[0], first);
  assert.equal(list.replacements, 1);
  await loadFrontier(document, async () => { throw new Error("Offline"); }, now);
  assert.equal(list.children[0], first);
  assert.equal(status.textContent, "Showing the last available articles. Updates will resume automatically.");
  await loadFrontier(document, async () => response([dated("new-release", "2026-10-24"), ...articles]), now);
  assert.equal(list.children.length, 3);
  assert.equal(list.children[0].children[1].children[0].href, "https://yeki.ai/qaieo/media/new-release");
});

test("refresh lifecycle polls each visible minute and on return, coalesces requests, and cleans up", async () => {
  const { document, list } = documentFixture();
  let interval, cleared = false, calls = 0, release;
  const window = Object.assign(new EventTarget(), {
    setInterval(fn, delay) { assert.equal(delay, 60000); interval = fn; return 9; },
    clearInterval(id) { assert.equal(id, 9); cleared = true; },
  });
  const fetchFeed = async () => { calls++; return new Promise(resolve => { release = () => resolve(response([article])); }); };
  const cleanup = startFrontier(document, window, fetchFeed, () => new Date("2026-10-24T18:00:00Z"));
  assert.equal(calls, 1);
  window.dispatchEvent(new Event("focus"));
  await interval();
  assert.equal(calls, 1);
  release();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(list.children.length, 1);
  document.visibilityState = "hidden";
  await interval();
  document.dispatchEvent(new Event("visibilitychange"));
  assert.equal(calls, 1);
  document.visibilityState = "visible";
  document.dispatchEvent(new Event("visibilitychange"));
  assert.equal(calls, 2);
  release();
  await new Promise(resolve => setImmediate(resolve));
  window.dispatchEvent(new Event("focus"));
  assert.equal(calls, 3);
  release();
  await new Promise(resolve => setImmediate(resolve));
  const pending = interval();
  assert.equal(calls, 4);
  release();
  await pending;
  cleanup();
  document.dispatchEvent(new Event("visibilitychange"));
  window.dispatchEvent(new Event("focus"));
  assert.equal(calls, 4);
  assert.equal(cleared, true);
});

test("generated signup homepage preserves the research archive, lab alias and Frontier", () => {
  const home = readFileSync(new URL("./public/index.html", import.meta.url), "utf8");
  const lab = readFileSync(new URL("./public/lab.html", import.meta.url), "utf8");
  assert.equal(home, lab);
  for (const expected of ["The physical economy.", "In your inbox.", "Recent awards, commercialization grants and the companies building the physical economy.", "What we cover", "The last photonic framework standing", "Qaieo Frontier", 'href="https://yeki.ai/qaieo/media"', 'type="module" src="frontier.mjs"']) assert.ok(home.includes(expected), expected);
  assert.equal((home.match(/id="qaieo-subscribe"/g) || []).length, 1);
  assert.ok(home.indexOf('id="qaieo-subscribe"') < home.indexOf('id="frontier"'));
  assert.ok(!home.includes("Quantum Research Lab"));
  assert.ok(!home.includes("Follow the contracts awarding the future."));
  assert.ok(!home.includes("First clips publish here"));
});
