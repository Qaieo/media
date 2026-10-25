import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { FRONTIER_INDUSTRIES, parseFrontierFeed, frontierDate, latestFrontierArticles, frontierArticleIndustries, industryFrontierArticles, loadFrontier, startFrontier } from "./frontier.mjs";

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

test("legacy v1 industry mapping uses exact case-insensitive tags and supports multiple industries", () => {
  const aliases = {
    robotics: ["Robotics", "Space robotics"],
    photonics: ["Photonics", "Optics", "Optical computing", "Optical communications", "Lasers", "Quantum photonics"],
    "aerospace-defense": ["Aerospace & defense", "Aerospace and defense", "Aerospace", "Defense", "Space", "Space robotics", "Spacecraft propulsion", "Aviation", "Navy"],
    energy: ["Energy", "Solar", "Grid", "Energy storage", "Nuclear", "Power systems"],
    "industry-infrastructure": ["Industry & infrastructure", "Industry and infrastructure", "Industrial", "Industry", "Infrastructure", "Hardware", "Manufacturing", "Materials", "Construction", "Logistics", "Semiconductors"],
  };
  for (const [id, tags] of Object.entries(aliases)) {
    for (const tag of tags) assert.ok(frontierArticleIndustries({ tags: [tag.toUpperCase()] }).includes(id), tag);
  }
  assert.deepEqual(frontierArticleIndustries({ tags: ["Space robotics", "Photonics"] }), ["robotics", "photonics", "aerospace-defense"]);
  assert.deepEqual(frontierArticleIndustries({ tags: ["Robotics overview", "Gridiron"] }), ["emerging-frontiers"]);
  assert.deepEqual(frontierArticleIndustries({ tags: [] }), ["emerging-frontiers"]);
  assert.deepEqual(frontierArticleIndustries({ tags: ["Introduction", "Robotics"] }), []);
});

test("optional explicit industries are validated, retained and take precedence over legacy tags", () => {
  for (const industries of [[], ["photonics"], ["robotics", "aerospace-defense"], ["emerging-frontiers"]]) {
    const [parsed] = parseFrontierFeed(feed([{ ...article, industries }]));
    assert.deepEqual(parsed.industries, industries);
    assert.deepEqual(frontierArticleIndustries(parsed), industries);
  }
  assert.deepEqual(frontierArticleIndustries({ tags: ["Introduction"], industries: ["robotics"] }), []);
  for (const industries of [null, "robotics", ["Robotics"], [null], ["robotics", "unknown"], ["<script>"], Array(7).fill("robotics")]) {
    assert.throws(() => parseFrontierFeed(feed([{ ...article, industries }])));
  }
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
  let document;
  class Node {
    constructor(tag) { this.tag = tag; this.children = []; this.textContent = ""; this.replacements = 0; }
    append(...nodes) { this.children.push(...nodes); }
    setAttribute(name, value) { this[name] = value; }
    replaceChildren(fragment) { this.children = fragment.children; this.replacements++; }
    focus(options) { document.activeElement = this; this.focusOptions = options; }
  }
  const list = new Node("div"), status = new Node("p");
  const groups = new Map(FRONTIER_INDUSTRIES.map(industry => [industry.id, { list: new Node("div"), status: new Node("p") }]));
  const elements = new Map([["frontier-articles", list], ["frontier-status", status]]);
  for (const [id, group] of groups) {
    elements.set(`industry-${id}-articles`, group.list);
    elements.set(`industry-${id}-status`, group.status);
  }
  document = Object.assign(new EventTarget(), {
    visibilityState: "visible",
    getElementById: id => elements.get(id) ?? null,
    createElement: tag => new Node(tag), createDocumentFragment: () => new Node("fragment"),
  });
  return { document, list, status, groups };
}

test("industry sections refresh from all published metadata beyond the latest three, excluding future posts and introductions", async () => {
  const { document, list, groups } = documentFixture();
  const now = new Date("2026-10-24T18:00:00Z");
  const articles = [
    dated("newest", "2026-10-24"), dated("second", "2026-10-23"), dated("third", "2026-10-22"),
    { ...dated("older-optics", "2026-10-20"), tags: ["Optics"] },
    { ...dated("future-energy", "2026-10-25"), industries: ["energy"] },
    { ...dated("intro", "2026-10-19"), tags: ["Introduction"] },
    { ...dated("older-optics", "2026-10-18"), tags: ["Optics"] },
  ];
  await loadFrontier(document, async () => response(articles), now);
  assert.equal(list.children.length, 3);
  assert.equal(groups.get("photonics").list.children.length, 1);
  assert.equal(groups.get("photonics").list.children[0].children[1].children[0].href, "https://yeki.ai/qaieo/media/older-optics");
  assert.equal(groups.get("energy").list.children.length, 0);
  assert.equal(groups.get("energy").status.textContent, "No published coverage in this industry yet.");
  assert.equal(groups.get("emerging-frontiers").list.children.length, 0);
  const first = list.children[0];
  const focused = groups.get("photonics").list.children[0].children[1].children[0];
  focused.focus();
  await loadFrontier(document, async () => response([...articles, { ...dated("older-photonics", "2026-10-21"), industries: ["photonics", "energy"] }]), now);
  assert.equal(list.children[0], first);
  assert.equal(groups.get("photonics").list.children.length, 2);
  assert.equal(groups.get("energy").list.children.length, 1);
  assert.equal(document.activeElement.href, focused.href);
  assert.deepEqual(document.activeElement.focusOptions, { preventScroll: true });
  const saved = groups.get("photonics").list.children[0];
  await loadFrontier(document, async () => response([{ ...article, industries: ["bad-id"] }]), now);
  assert.equal(groups.get("photonics").list.children[0], saved);
  assert.equal(groups.get("photonics").status.textContent, "Showing the last available articles. Updates will resume automatically.");
  assert.equal(groups.get("emerging-frontiers").status.textContent, "No published coverage in the last available feed. Updates will resume automatically.");
});

test("industry groups deduplicate published slugs and include cross-sector coverage once in each group", () => {
  const articles = parseFrontierFeed(feed([
    { ...dated("cross-sector", "2026-10-25"), industries: ["photonics"] },
    { ...dated("cross-sector", "2026-10-24"), tags: ["Space robotics", "Robotics"] },
    { ...dated("cross-sector", "2026-10-23"), tags: ["Space robotics"] },
  ]));
  const groups = industryFrontierArticles("2026-10-24", articles);
  assert.equal(groups.get("robotics").length, 1);
  assert.equal(groups.get("aerospace-defense").length, 1);
  assert.equal(groups.get("photonics").length, 0);
});

test("first-load errors and empty feeds leave every industry honest and recover on the next refresh", async () => {
  const { document, list, groups } = documentFixture();
  const now = new Date("2026-10-24T18:00:00Z");
  await loadFrontier(document, async () => { throw new Error("Offline"); }, now);
  for (const { list, status } of groups.values()) {
    assert.equal(list.children.length, 0);
    assert.equal(status.textContent, "Articles are temporarily unavailable. Read the Frontier archive.");
  }
  await loadFrontier(document, async () => response([]), now);
  assert.equal(list.children.length, 0);
  for (const { list, status } of groups.values()) {
    assert.equal(list.children.length, 0);
    assert.equal(status.textContent, "No published coverage in this industry yet.");
  }
  await loadFrontier(document, async () => response([article]), now);
  assert.equal(groups.get("robotics").list.children.length, 1);
});

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
  for (const expected of ["The physical economy.", "In your inbox.", "Awards, milestones and contracts shaping the physical economy.", "What we cover", "The last photonic framework standing", "Qaieo Frontier", 'href="https://yeki.ai/qaieo/media"', 'type="module" src="frontier.mjs"']) assert.ok(home.includes(expected), expected);
  for (const { id } of FRONTIER_INDUSTRIES) {
    for (const expected of [`id="industry-${id}"`, `href="#industry-${id}"`, `id="industry-${id}-articles"`, `id="industry-${id}-status"`]) assert.ok(home.includes(expected), expected);
  }
  assert.equal((home.match(/id="qaieo-subscribe"/g) || []).length, 1);
  assert.ok(home.indexOf('id="qaieo-subscribe"') < home.indexOf('id="frontier"'));
  assert.ok(!home.includes("Quantum Research Lab"));
  assert.ok(!home.includes("Follow the contracts awarding the future."));
  assert.ok(!home.includes("First clips publish here"));
});
