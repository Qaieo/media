// Qaieo worker: serves static assets, plus POST /api/subscribe which adds the
// email to the Qaieo Loops mailing list. LOOPS_API_KEY is a wrangler secret;
// LOOPS_LIST_ID is a plain var in wrangler.jsonc.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/subscribe") {
      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
      }
      let email = "";
      let honeypot = "";
      try {
        const form = await request.formData();
        email = (form.get("email") || "").toString().trim().toLowerCase();
        honeypot = (form.get("company") || "").toString();
      } catch {
        return Response.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
      }
      // Honeypot: bots fill it, humans don't. Pretend success either way.
      if (honeypot) return Response.json({ ok: true });
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return Response.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
      }
      const loopsRes = await fetch("https://app.loops.so/api/v1/contacts/create", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + env.LOOPS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          mailingLists: { [env.LOOPS_LIST_ID]: true },
        }),
      });
      if (!loopsRes.ok) {
        const detail = await loopsRes.text().catch(() => "");
        console.error("loops subscribe failed", loopsRes.status, detail.slice(0, 200));
        return Response.json(
          { ok: false, error: "Something went wrong. Try again in a bit." },
          { status: 502 }
        );
      }
      return Response.json({ ok: true });
    }

    return env.ASSETS.fetch(request);
  },
};
