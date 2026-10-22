// Security floors from the 2026-10-21 Node.js security release.
// A major-only selector can reuse a vulnerable cached patch release.
const floors = new Map([[22, [23, 4]], [24, [22, 1]], [26, [12, 1]]]);

export function isSupportedNode(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) return false;
  const [major, minor, patch] = match.slice(1).map(Number);
  const floor = floors.get(major);
  return Boolean(floor && (minor > floor[0] || (minor === floor[0] && patch >= floor[1])));
}

export function assertSupportedNode() {
  if (!isSupportedNode(process.versions.node)) {
    throw new Error(`Unsupported Node.js ${process.versions.node}. Use Node 22.23.4+, 24.22.1+, or 26.12.1+ within those release lines. See .node-version and docs/node-security-2026-10.md.`);
  }
}
