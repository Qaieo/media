import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isSupportedNode, assertSupportedNode } from "./node-runtime.mjs";

test("rejects each vulnerable release line immediately below its security floor", () => {
  for (const version of ["22.23.3", "24.22.0", "26.12.0", "22.22.99", "24.21.99", "26.11.99"]) {
    assert.equal(isSupportedNode(version), false, version);
  }
});

test("accepts the fixed versions and later patches in supported lines", () => {
  for (const version of ["22.23.4", "24.22.1", "26.12.1", "22.23.5", "24.23.0", "26.13.0"]) {
    assert.equal(isSupportedNode(version), true, version);
  }
});

test("rejects unsupported majors, prereleases, and invalid values", () => {
  for (const version of ["20.20.2", "23.11.0", "25.9.0", "27.0.0", "22", "22.23.4-rc.1", "v22.23.4", "invalid", ""]) {
    assert.equal(isSupportedNode(version), false, version);
  }
});

test("build pin is patched and the executing runtime satisfies the policy", () => {
  assert.equal(isSupportedNode(readFileSync(new URL("../.node-version", import.meta.url), "utf8").trim()), true);
  assertSupportedNode();
});
