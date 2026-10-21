#!/usr/bin/env node
// Weekly Perceval tracker: checks Quandela/Perceval GitHub releases for anything
// new since the last run, writes a post markdown file into site/posts/.
// State: site/.tracker-state.json. Run from repo root: node site/tracker.mjs
import { assertSupportedNode } from "./node-runtime.mjs";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

assertSupportedNode();

const SITE_DIR = dirname(fileURLToPath(import.meta.url));
const STATE_FILE = join(SITE_DIR, ".tracker-state.json");

function loadState() {
  if (existsSync(STATE_FILE)) return JSON.parse(readFileSync(STATE_FILE, "utf8"));
  return { lastReleaseId: 0, lastCheck: null };
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
}

async function main() {
  const state = loadState();
  const res = await fetch("https://api.github.com/repos/Quandela/Perceval/releases?per_page=5", {
    headers: { "User-Agent": "qaieo-tracker", "Accept": "application/vnd.github+json" },
  });
  if (!res.ok) { console.error(`GitHub API failed: ${res.status}`); process.exit(1); }
  const releases = await res.json();
  const fresh = releases.filter((r) => !r.draft && r.id > (state.lastReleaseId || 0));

  if (!fresh.length) {
    console.log("No new releases.");
  } else {
    for (const r of fresh.reverse()) {
      const date = r.published_at.slice(0, 10);
      const slug = `${date}-${slugify(r.name || r.tag_name)}`;
      const notes = (r.body || "").slice(0, 1200).replace(/\r/g, "");
      const displayName = (r.name || r.tag_name).replace(/^Perceval\s+/i, "");
      const title = /^v?\d/i.test(displayName) ? `Perceval ${displayName}` : displayName;
      const md = `---
title: "${title.replace(/"/g, "")}"
date: ${date}
source: "Quandela/Perceval GitHub release"
source_url: "${r.html_url}"
tags: ["release", "${r.tag_name}"]
tweet: "${title.replace(/"/g, "")} is out. Unofficial tracker:"
---

Quandela published **${r.tag_name}**${r.name && r.name !== r.tag_name ? ` (${r.name})` : ""} of Perceval.

Release notes (abridged, see the full notes at the source link):

${notes}

*This post was auto-generated from the official release notes. Summaries may miss nuance; read the full notes at the source.*
`;
      writeFileSync(join(SITE_DIR, "posts", `${slug}.md`), md);
      console.log(`Wrote post: ${slug}.md`);
    }
  }
  state.lastReleaseId = Math.max(state.lastReleaseId || 0, ...releases.map((r) => r.id));
  state.lastCheck = new Date().toISOString();
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  console.log("State updated.");
}

main().catch((e) => { console.error(e); process.exit(1); });

