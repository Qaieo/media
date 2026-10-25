import { ARCHIVE_URL, UPSTREAM_FEED_URL, parseFrontierFeed } from "./frontier-data.mjs";

const MAX_FEED_BYTES = 150_000;
const FEED_TIMEOUT_MS = 8_000;

async function readBoundedJson(response) {
  const length = response.headers.get("Content-Length");
  if (length !== null && Number(length) > MAX_FEED_BYTES) {
    await response.body?.cancel();
    throw new Error("Feed too large");
  }
  if (!response.body) throw new Error("Empty feed");
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let bytes = 0;
  let json = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_FEED_BYTES) throw new Error("Feed too large");
      json += decoder.decode(value, { stream: true });
    }
    json += decoder.decode();
    return JSON.parse(json);
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
}

function jsonResponse(request, value, status, cacheControl, extraHeaders = {}) {
  return new Response(request.method === "HEAD" ? null : JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cacheControl,
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders,
    },
  });
}

// Only public publication metadata crosses this boundary. No caller-controlled
// destination, headers, cookies, query parameters, or credentials are forwarded.
export async function frontierResponse(request, fetchFeed = fetch) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return jsonResponse(request, { error: "Method not allowed." }, 405, "no-store", { Allow: "GET, HEAD" });
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FEED_TIMEOUT_MS);
  try {
    const response = await fetchFeed(UPSTREAM_FEED_URL, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "omit",
      referrerPolicy: "no-referrer",
      redirect: "error",
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok || response.redirected) {
      await response.body?.cancel();
      throw new Error("Upstream unavailable");
    }
    const articles = parseFrontierFeed(await readBoundedJson(response));
    return jsonResponse(request, {
      version: 1,
      publication: "Qaieo Frontier",
      archiveUrl: ARCHIVE_URL,
      articles,
    }, 200, "public, max-age=60");
  } catch {
    return jsonResponse(request, { error: "Frontier feed temporarily unavailable." }, 502, "no-store");
  } finally {
    clearTimeout(timer);
  }
}
