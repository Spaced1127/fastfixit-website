/**
 * FastFixIt Electronics — repair request endpoint
 *
 * Receives the JSON form payload from the static site, verifies Turnstile
 * (when configured), emails the shop through Resend, and sends the customer
 * a short confirmation.
 *
 * Required environment:
 *   RESEND_API_KEY   secret
 *   TO_EMAIL         shop inbox (comma-separated allowed)
 *   FROM_EMAIL       verified Resend sender, e.g. "FastFixIt Repairs <repairs@example.com>"
 *
 * Optional:
 *   SITE_ORIGIN      comma-separated allowed origins; "*" allows any
 *   TURNSTILE_SECRET Cloudflare Turnstile secret
 */

const MAX_BODY_BYTES = 12 * 1024 * 1024;
const MAX_PHOTOS = 3;
const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
const MAX_TOTAL_PHOTO_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (url.pathname === "/health" && request.method === "GET") {
      return json({ ok: true, service: "fastfixit-repairs" }, 200, cors);
    }

    if (url.pathname !== "/repair-request") {
      return json({ ok: false, error: "Not found." }, 404, cors);
    }

    if (request.method !== "POST") {
      return json({ ok: false, error: "Method not allowed." }, 405, cors);
    }

    if (!originAllowed(request, env)) {
      return json({ ok: false, error: "Origin not allowed." }, 403, cors);
    }

    if (!env.RESEND_API_KEY || !env.TO_EMAIL || !env.FROM_EMAIL) {
      console.error("repair endpoint is missing email configuration");
      return json({ ok: false, error: "The request form is not configured yet." }, 500, cors);
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return json({ ok: false, error: "Expected a JSON request." }, 415, cors);
    }

    const declaredLength = Number(request.headers.get("content-length") || 0);
    if (declaredLength > MAX_BODY_BYTES) {
      return json({ ok: false, error: "That request is too large." }, 413, cors);
    }

    let raw;
    try {
      raw = await request.text();
    } catch (error) {
      return json({ ok: false, error: "The request could not be read." }, 400, cors);
    }

    if (raw.length > MAX_BODY_BYTES) {
      return json({ ok: false, error: "That request is too large." }, 413, cors);
    }

    let body;
    try {
      body = JSON.parse(raw);
    } catch (error) {
      return json({ ok: false, error: "The request could not be read." }, 400, cors);
    }

    if (!body || typeof body !== "object") {
      return json({ ok: false, error: "The request could not be read." }, 400, cors);
    }

    // Bots fill the hidden field or submit in under two seconds. Accept
    // silently so they don't learn what tripped the filter.
    const startedAt = Number(body.startedAt) || 0;
    const tooFast = startedAt > 0 && Date.now() - startedAt < 2000;
    if (clean(body.website).length > 0 || tooFast) {
      return json({ ok: true, reference: makeReference() }, 200, cors);
    }

    if (env.TURNSTILE_SECRET) {
      const token = clean(body.turnstileToken);
      if (!token) {
        return json({ ok: false, error: "Please complete the verification and try again." }, 400, cors);
      }
      const verified = await verifyTurnstile(token, env, request);
      if (!verified) {
        return json({ ok: false, error: "Verification failed. Refresh the page and try again." }, 400, cors);
      }
    }

    const record = {
      reference: makeReference(),
      receivedAt: new Date().toISOString(),
      name: clip(clean(body.name), 120),
      email: clip(clean(body.email), 200),
      phone: clip(clean(body.phone), 60),
      contact: clip(clean(body.contact), 40),
      deviceId: clip(clean(body.deviceId), 40),
      device: clip(clean(body.device), 80),
      model: clip(clean(body.model), 200),
      serial: clip(clean(body.serial), 200),
      faultCategory: clip(clean(body.faultCategory), 60),
      faultLabel: clip(clean(body.faultLabel), 120),
      details: clip(clean(body.details), 5000),
      previous: clip(clean(body.previous), 80),
      liquid: clip(clean(body.liquid), 80),
      handoff: clip(clean(body.handoff), 80),
      estimate: clip(clean(body.estimate), 300),
      ip: request.headers.get("CF-Connecting-IP") || "",
      country: (request.cf && request.cf.country) || ""
    };

    const problems = validate(record);
    const photos = collectPhotos(body.photos);
    record.photoCount = photos.attachments.length;
    if (photos.error) problems.push(photos.error);

    if (problems.length) {
      return json(
        { ok: false, error: problems[0] || "Please check the form and try again." },
        400,
        cors
      );
    }

    let delivered;
    try {
      delivered = await sendShopEmail(env, record, photos.attachments);
    } catch (error) {
      console.error("shop email failed", record.reference, error && error.message);
      return json(
        { ok: false, error: "We couldn't send the request. Please email the shop directly." },
        502,
        cors
      );
    }

    if (!delivered) {
      return json(
        { ok: false, error: "We couldn't send the request. Please email the shop directly." },
        502,
        cors
      );
    }

    // The customer gets a confirmation, but its failure must not hide the
    // fact that the shop received the request.
    if (record.email) {
      ctx.waitUntil(sendCustomerEmail(env, record).catch((error) => {
        console.error("customer email failed", record.reference, error && error.message);
      }));
    }

    return json(
      { ok: true, reference: record.reference, message: "Request received." },
      200,
      cors
    );
  }
};

/* ------------------------------------------------------------------ */
/* Request helpers                                                     */
/* ------------------------------------------------------------------ */

function corsHeaders(request, env) {
  const allowed = allowedOrigins(env);
  const origin = request.headers.get("Origin") || "";
  const headers = new Headers({
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Vary": "Origin"
  });

  if (!allowed.length || allowed.includes("*")) {
    headers.set("Access-Control-Allow-Origin", "*");
  } else if (origin && allowed.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }

  return headers;
}

function allowedOrigins(env) {
  return String(env.SITE_ORIGIN || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function originAllowed(request, env) {
  const allowed = allowedOrigins(env);
  if (!allowed.length || allowed.includes("*")) return true;
  const origin = request.headers.get("Origin");
  if (!origin) return true; // non-browser clients are still subject to Turnstile
  return allowed.includes(origin);
}

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function clip(value, max) {
  return String(value || "").slice(0, max);
}

function headerSafe(value) {
  return String(value || "")
    .replace(/[\u0000-\u001F\u007F]+/g, " ")
    .slice(0, 160)
    .trim();
}

function validate(record) {
  const problems = [];
  if (record.name.length < 2) problems.push("Please add your name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(record.email)) {
    problems.push("Please add an email address we can reply to.");
  }
  if (!record.device) problems.push("Please choose the kind of device.");
  if (!record.faultLabel) problems.push("Please choose what the device is doing.");
  if (record.details.length < 12) problems.push("Please add a sentence about the fault.");
  return problems;
}

function collectPhotos(input) {
  const attachments = [];
  if (!Array.isArray(input) || input.length === 0) return { attachments };
  if (input.length > MAX_PHOTOS) {
    return { attachments, error: "Add up to three photos." };
  }

  let total = 0;
  for (const photo of input) {
    if (!photo || typeof photo !== "object") {
      return { attachments, error: "One of the photos could not be read." };
    }
    if (!ALLOWED_IMAGE_TYPES.has(photo.type)) {
      return { attachments, error: "Photos must be JPEG, PNG or WebP." };
    }
    const data = typeof photo.data === "string" ? photo.data : "";
    if (!data) {
      return { attachments, error: "One of the photos could not be read." };
    }
    const bytes = Math.floor((data.length * 3) / 4);
    if (bytes > MAX_PHOTO_BYTES) {
      return { attachments, error: "One photo is over 3 MB after resizing." };
    }
    total += bytes;
    if (total > MAX_TOTAL_PHOTO_BYTES) {
      return { attachments, error: "The photos are too large together." };
    }
    attachments.push({
      filename: safeFilename(photo.filename),
      content: data
    });
  }

  return { attachments };
}

function safeFilename(name) {
  const base = String(name || "photo.jpg")
    .replace(/[^\w.\- ]+/g, "_")
    .slice(0, 80);
  return /\.(jpe?g|png|webp)$/i.test(base) ? base : base + ".jpg";
}

function makeReference() {
  const now = new Date();
  const stamp =
    String(now.getUTCFullYear()).slice(2) +
    String(now.getUTCMonth() + 1).padStart(2, "0") +
    String(now.getUTCDate()).padStart(2, "0");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  let suffix = "";
  for (const byte of bytes) suffix += alphabet[byte % alphabet.length];
  return `FF-${stamp}-${suffix}`;
}

async function verifyTurnstile(token, env, request) {
  const form = new FormData();
  form.append("secret", env.TURNSTILE_SECRET);
  form.append("response", token);
  const ip = request.headers.get("CF-Connecting-IP");
  if (ip) form.append("remoteip", ip);

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form
    });
    if (!response.ok) return false;
    const result = await response.json();
    return result && result.success === true;
  } catch (error) {
    console.error("turnstile check failed", error && error.message);
    return false;
  }
}

function json(payload, status, cors) {
  const headers = new Headers(cors);
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(payload), { status, headers });
}

/* ------------------------------------------------------------------ */
/* Email                                                               */
/* ------------------------------------------------------------------ */

async function sendShopEmail(env, record, attachments) {
  const to = String(env.TO_EMAIL)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const subject = `Repair request ${record.reference} — ${headerSafe(record.device) || "device"} — ${headerSafe(record.name)}`;
  const html = shopHtml(record);
  const text = shopText(record);

  return resend(env, {
    from: env.FROM_EMAIL,
    to,
    reply_to: record.email,
    subject,
    html,
    text,
    attachments
  });
}

async function sendCustomerEmail(env, record) {
  const subject = `We got your repair request (${record.reference})`;
  const html = customerHtml(record);
  const text = customerText(record);

  return resend(env, {
    from: env.FROM_EMAIL,
    to: [record.email],
    reply_to: String(env.TO_EMAIL).split(",")[0].trim(),
    subject,
    html,
    text
  });
}

async function resend(env, payload) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let detail = "";
    try {
      detail = await response.text();
    } catch (error) {
      detail = "";
    }
    console.error("resend error", response.status, detail.slice(0, 300));
    return false;
  }

  return true;
}

function shopHtml(record) {
  const rows = [
    ["Reference", record.reference],
    ["Received", record.receivedAt],
    ["Name", record.name],
    ["Email", record.email],
    ["Phone", record.phone || "—"],
    ["Preferred contact", record.contact || "—"],
    ["Device", record.device],
    ["Make and model", record.model || "—"],
    ["Serial", record.serial || "—"],
    ["Reported fault", record.faultLabel],
    ["Estimate selection", record.estimate || "—"],
    ["Previous work", record.previous || "—"],
    ["Liquid contact", record.liquid || "—"],
    ["Drop-off or post", record.handoff || "—"],
    ["Photos", String(record.photoCount || 0)]
  ]
    .map(
      ([label, value]) =>
        `<tr><td style="padding:9px 14px;background:#f1eee7;color:#5f5c54;font:13px Arial,sans-serif;width:170px;vertical-align:top">${escapeHtml(label)}</td><td style="padding:9px 14px;background:#ffffff;color:#161512;font:15px Arial,sans-serif;vertical-align:top">${escapeHtml(String(value))}</td></tr>`
    )
    .join("");

  return `<!doctype html><html><body style="margin:0;padding:24px;background:#e8e8e3">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;margin:0 auto;background:#ffffff">
    <tr><td style="padding:20px 24px;background:#161512;color:#ece9e2;font:600 20px Arial,sans-serif">FastFixIt Electronics — new repair request</td></tr>
    <tr><td style="padding:20px 24px 4px"><p style="margin:0;font:15px Arial,sans-serif;color:#161512">A request came in from the website. Reply to this email to answer the customer directly.</p></td></tr>
    <tr><td style="padding:16px 24px 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table></td></tr>
    <tr><td style="padding:0 24px 24px"><p style="margin:0 0 6px;font:600 14px Arial,sans-serif;color:#5f5c54">Fault description</p><p style="margin:0;padding:14px;background:#f1eee7;color:#161512;font:15px/1.55 Arial,sans-serif;white-space:pre-wrap">${escapeHtml(record.details)}</p></td></tr>
    <tr><td style="padding:0 24px 24px;font:13px Arial,sans-serif;color:#5f5c54">Sent from the FastFixIt website${record.country ? " · " + escapeHtml(record.country) : ""}</td></tr>
  </table></body></html>`;
}

function shopText(record) {
  return [
    `New repair request — ${record.reference}`,
    "",
    `Name: ${record.name}`,
    `Email: ${record.email}`,
    `Phone: ${record.phone || "—"}`,
    `Preferred contact: ${record.contact || "—"}`,
    `Device: ${record.device}`,
    `Model: ${record.model || "—"}`,
    `Serial: ${record.serial || "—"}`,
    `Fault: ${record.faultLabel}`,
    `Estimate selection: ${record.estimate || "—"}`,
    `Previous work: ${record.previous || "—"}`,
    `Liquid: ${record.liquid || "—"}`,
    `Handoff: ${record.handoff || "—"}`,
    `Photos: ${record.photoCount || 0}`,
    "",
    "Details:",
    record.details
  ].join("\n");
}

function customerHtml(record) {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#e8e8e3">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#ffffff">
    <tr><td style="padding:20px 24px;background:#161512;color:#ece9e2;font:600 20px Arial,sans-serif">FastFixIt Electronics</td></tr>
    <tr><td style="padding:24px">
      <p style="margin:0 0 14px;font:15px/1.6 Arial,sans-serif;color:#161512">Hi ${escapeHtml(record.name)},</p>
      <p style="margin:0 0 14px;font:15px/1.6 Arial,sans-serif;color:#161512">We've got your repair request. Your reference is <strong>${escapeHtml(record.reference)}</strong>.</p>
      <p style="margin:0 0 14px;font:15px/1.6 Arial,sans-serif;color:#161512">A person at the bench will reply within one business day. If you have more photos, reply to this email and attach them.</p>
      <p style="margin:0 0 6px;font:600 14px Arial,sans-serif;color:#5f5c54">What you sent</p>
      <p style="margin:0 0 14px;padding:14px;background:#f1eee7;color:#161512;font:14px/1.6 Arial,sans-serif">${escapeHtml(record.device)}${record.model ? " · " + escapeHtml(record.model) : ""}<br>${escapeHtml(record.faultLabel)}<br><span style="color:#5f5c54">${escapeHtml(record.details.slice(0, 500))}${record.details.length > 500 ? "…" : ""}</span></p>
      <p style="margin:0 0 6px;font:600 14px Arial,sans-serif;color:#5f5c54">What happens next</p>
      <ol style="margin:0 0 18px;padding-left:18px;font:14px/1.6 Arial,sans-serif;color:#161512">
        <li>We read the request and reply.</li>
        <li>Bench diagnosis, usually 24–48 hours.</li>
        <li>You get a written quote. Nothing happens until you approve it.</li>
        <li>Repair, then a 24-hour test.</li>
      </ol>
      <p style="margin:0;font:13px/1.5 Arial,sans-serif;color:#5f5c54">The bench diagnostic is credited toward the repair if you approve the quote. This is not a quote.</p>
    </td></tr>
    <tr><td style="padding:16px 24px;background:#f1eee7;font:13px/1.5 Arial,sans-serif;color:#5f5c54">FastFixIt Electronics, LLC</td></tr>
  </table></body></html>`;
}

function customerText(record) {
  return [
    `Hi ${record.name},`,
    "",
    `We've got your repair request. Your reference is ${record.reference}.`,
    `Device: ${record.device}${record.model ? " · " + record.model : ""}`,
    `Fault: ${record.faultLabel}`,
    "",
    "A person at the bench will reply within one business day. If you have more photos, reply to this email and attach them.",
    "",
    "The bench diagnostic is credited toward the repair if you approve the quote. This is not a quote.",
    "",
    "FastFixIt Electronics, LLC"
  ].join("\n");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}