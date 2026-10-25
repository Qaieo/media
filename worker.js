// Qaieo worker: serves static assets, plus POST /api/subscribe which adds the
// email to the Qaieo Kit form. KIT_API_KEY is a Worker secret;
// KIT_FORM_ID is a non-secret form ID.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/subscribe") {
      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
      }
      let email = "";
      let honeypot = "";
      const attribution = {};
      try {
        const form = await request.formData();
        email = (form.get("email") || "").toString().trim().toLowerCase();
        honeypot = (form.get("company") || "").toString();
        // Attribution fields the landing page sends; used for Kit form attribution.
        for (const k of ["source", "utm_source", "utm_medium", "utm_campaign", "utm_content", "referrer"]) {
          const v = (form.get(k) || "").toString().trim().slice(0, 200);
          if (v) attribution[k] = v;
        }
      } catch {
        return Response.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
      }
      // Honeypot: bots fill it, humans don't. Pretend success either way.
      if (honeypot) return Response.json({ ok: true });
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return Response.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
      }
      if (!env.KIT_API_KEY || !/^\d+$/.test(env.KIT_FORM_ID || "")) {
        return Response.json({ ok: false, error: "Newsletter signup is temporarily unavailable. Please try again later." }, { status: 503 });
      }
      const headers = { "X-Kit-Api-Key": env.KIT_API_KEY, "Content-Type": "application/json" };
      try {
        // Create inactive only. Kit preserves the state of existing subscribers.
        // Confirmation must be enabled on the Kit form, with auto-confirm OFF.
        const created = await fetch("https://api.kit.com/v4/subscribers", {
          method: "POST", headers, signal: AbortSignal.timeout(8000),
          body: JSON.stringify({ email_address: email, state: "inactive" }),
        });
        if (!created.ok) throw new Error("Kit subscriber request failed");
        const { subscriber } = await created.json();
        if (!Number.isSafeInteger(subscriber?.id) || subscriber.id <= 0) throw new Error("Invalid subscriber response");
        // Do not reactivate cancelled/bounced/complained subscribers through the API.
        if (!["active", "inactive"].includes(subscriber.state)) {
          return Response.json({ ok: false, error: "Please contact Qaieo to review your subscription preferences." }, { status: 409 });
        }
        const referrer = new URL("https://qaieo.com/");
        for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content"]) {
          if (attribution[key]) referrer.searchParams.set(key, attribution[key]);
        }
        const added = await fetch(`https://api.kit.com/v4/forms/${env.KIT_FORM_ID}/subscribers/${subscriber.id}`, {
          method: "POST", headers, signal: AbortSignal.timeout(8000),
          body: JSON.stringify({ referrer: referrer.href }),
        });
        if (!added.ok) throw new Error("Kit form request failed");
        return Response.json({ ok: true });
      } catch {
        // Never log provider bodies, subscriber details, or API keys.
        return Response.json({ ok: false, error: "Something went wrong. Try again in a bit." }, { status: 502 });
      }
    }

    return env.ASSETS.fetch(request);
  },
};
