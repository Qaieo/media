import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseFrontierFeed, loadFrontier } from "./frontier.mjs";

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

test("rejects untrusted routes, source schemes, malformed dates and duplicates", () => {
  for (const patch of [
    { url: "https://yeki.ai.evil.test/qaieo/media/a-public-award" },
    { url: "https://yeki.ai/qaieo/media/a-public-award?tracking=1" },
    { url: "https://user@yeki.ai/qaieo/media/a-public-award" },
    { source: { label: "Source", href: "javascript:alert(1)" } },
    { source: { label: "Source", href: "https://user:password@example.com/" } },
    { date: "2026-02-30" }, { date: "invalid" }, { title: "" },
    { slug: "../sign-in" }, { tags: [null] },
  ]) assert.throws(() => parseFrontierFeed(feed([{ ...article, ...patch }])));
  assert.throws(() => parseFrontierFeed(feed([article, article])));
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
    assert.equal(status.textContent, "Read the latest articles in the Frontier archive.");
  }
});

test("generated root preserves research and lab alias while offering Frontier", () => {
  const home = readFileSync(new URL("./public/index.html", import.meta.url), "utf8");
  const lab = readFileSync(new URL("./public/lab.html", import.meta.url), "utf8");
  assert.equal(home, lab);
  for (const expected of ["Research lab", "Research agenda", "The last photonic framework standing", "Qaieo Frontier", 'href="https://yeki.ai/qaieo/media"', 'type="module" src="frontier.mjs"']) assert.ok(home.includes(expected), expected);
  assert.ok(!home.includes("Follow the contracts awarding the future."));
  assert.ok(!home.includes("First clips publish here"));
});
