/**
 * FastFixIt Electronics — repair request and mail-in intake
 *
 * POST /repair-request       public intake (drop-off or mail-in)
 * GET  /admin/requests       protected list of recent requests
 * PATCH /admin/requests/:ref protected status update
 * GET  /health
 *
 * Storage: Cloudflare D1 when the DB binding is present. Email through
 * Resend when the email variables are present. The form still works with
 * either one configured; both is the intended setup.
 */

const MAX_BODY_BYTES = 12 * 1024 * 1024;
const MAX_PHOTOS = 3;
const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
const MAX_TOTAL_PHOTO_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_STATUSES = new Set([
  "new",
  "awaiting-device",
  "received",
  "diagnosing",
  "quoted",
  "waiting-on-customer",
  "approved",
  "repairing",
  "testing",
  "ready",
  "shipped",
  "closed",
  "canceled"
]);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (url.pathname === "/health" && request.method === "GET") {
      return json(
        {
          ok: true,
          service: "fastfixit-repairs",
          storage: Boolean(env.DB),
          tracker: Boolean(env.TRACKER_URL && env.TRACKER_INTAKE_TOKEN)
        },
        200,
        cors
      );
    }

    if (url.pathname === "/admin/requests") {
      return handleAdminList(request, env, cors);
    }

    if (url.pathname === "/admin/settings") {
      return handleAdminSettings(request, env, cors);
    }

    if (url.pathname.startsWith("/admin/requests/") && url.pathname.endsWith("/sync")) {
      const reference = url.pathname.slice(
        "/admin/requests/".length,
        url.pathname.length - "/sync".length
      );
      return handleAdminSync(request, env, cors, reference);
    }

    if (url.pathname.startsWith("/admin/requests/")) {
      return handleAdminUpdate(request, env, cors, url.pathname.slice("/admin/requests/".length));
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

    if (!env.DB && (!env.RESEND_API_KEY || !env.TO_EMAIL || !env.FROM_EMAIL)) {
      console.error("repair endpoint is missing both storage and email configuration");
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "new",
      name: clip(clean(body.name), 120),
      email: clip(clean(body.email), 200),
      phone: clip(clean(body.phone), 60),
      contact: clip(clean(body.contact), 40),
      source: clip(clean(body.source), 80),
      sourceDetail: clip(clean(body.sourceDetail), 300),
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
      mailIn: body.mailIn === true || clean(body.handoff) === "Mail it in",
      returnStreet: clip(clean(body.returnStreet), 200),
      returnCity: clip(clean(body.returnCity), 120),
      returnState: clip(clean(body.returnState), 2).toUpperCase(),
      returnZip: clip(clean(body.returnZip), 10),
      returnAddress: "",
      shippingCarrier: clip(clean(body.shippingCarrier), 40),
      trackingNumber: clip(clean(body.trackingNumber), 100),
      accessories: clip(clean(body.accessories), 300),
      estimate: clip(clean(body.estimate), 300),
      photoCount: 0,
      emailStatus: "pending",
      trackerTicketNumber: null,
      trackerTicketId: "",
      trackerPublicToken: "",
      trackerStatus: "",
      trackerSyncedAt: "",
      trackerError: "",
      ip: request.headers.get("CF-Connecting-IP") || "",
      country: (request.cf && request.cf.country) || ""
    };

    record.returnAddress = formatAddress(record);

    const problems = validate(record, body);
    const photos = collectPhotos(body.photos);
    record.photoCount = photos.attachments.length;
    if (photos.error) problems.push(photos.error);

    if (problems.length) {
      return json({ ok: false, error: problems[0] }, 400, cors);
    }

    const stored = await storeRequest(env, record);
    let emailed = false;
    let emailError = "";

    if (stored) {
      await syncTicket(env, record, { force: false });
    }

    if (env.RESEND_API_KEY && env.TO_EMAIL && env.FROM_EMAIL) {
      try {
        emailed = await sendShopEmail(env, record, photos.attachments);
        if (!emailed) emailError = "Resend rejected the request.";
      } catch (error) {
        emailError = error && error.message ? error.message : "Email failed.";
        console.error("shop email failed", record.reference, emailError);
      }
    } else {
      emailError = "Email is not configured.";
    }

    record.emailStatus = emailed ? "sent" : "failed";
    if (stored) await updateEmailStatus(env, record);

    if (!stored && !emailed) {
      console.error("request not stored or emailed", record.reference);
      return json(
        {
          ok: false,
          error: "We couldn't save or send the request. Please email the shop directly."
        },
        502,
        cors
      );
    }

    if (emailed && record.email) {
      ctx.waitUntil(
        sendCustomerEmail(env, record).catch((error) => {
          console.error("customer email failed", record.reference, error && error.message);
        })
      );
    }

    return json(
      {
        ok: true,
        reference: record.reference,
        stored,
        emailed,
        message: "Request received."
      },
      200,
      cors
    );
  }
};

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */

async function handleAdminList(request, env, cors) {
  if (request.method !== "GET" && request.method !== "OPTIONS") {
    return json({ ok: false, error: "Method not allowed." }, 405, cors);
  }
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  const auth = requireAdmin(request, env);
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status, cors);
  if (!env.DB) {
    return json({ ok: false, error: "Storage is not configured." }, 503, cors);
  }

  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 200);

  try {
    const result = await env.DB.prepare(
      "SELECT * FROM repair_requests ORDER BY created_at DESC LIMIT ?"
    )
      .bind(limit)
      .all();
    const requests = (result.results || []).map((row) => ({
      ...row,
      track_url: row.tracker_public_token
        ? `${trackerPublicBase(env)}/track/${row.tracker_public_token}`
        : ""
    }));
    return json({ ok: true, requests }, 200, cors);
  } catch (error) {
    console.error("admin list failed", error && error.message);
    return json({ ok: false, error: "Could not read requests." }, 500, cors);
  }
}

async function handleAdminSettings(request, env, cors) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  const auth = requireAdmin(request, env);
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status, cors);
  if (!env.DB) {
    return json({ ok: false, error: "Storage is not configured." }, 503, cors);
  }

  if (request.method === "GET") {
    return json(
      {
        ok: true,
        autoCreate: await trackerAutoCreate(env),
        trackerConfigured: Boolean(env.TRACKER_URL && env.TRACKER_INTAKE_TOKEN)
      },
      200,
      cors
    );
  }

  if (request.method !== "PATCH") {
    return json({ ok: false, error: "Method not allowed." }, 405, cors);
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return json({ ok: false, error: "Invalid request." }, 400, cors);
  }

  if (typeof body.autoCreate !== "boolean") {
    return json({ ok: false, error: "Send autoCreate as true or false." }, 400, cors);
  }

  await setTrackerAutoCreate(env, body.autoCreate);
  return json({ ok: true, autoCreate: body.autoCreate }, 200, cors);
}

function rowToRecord(row) {
  return {
    reference: row.reference,
    name: row.name,
    email: row.email,
    phone: row.phone,
    source: row.source || "",
    sourceDetail: row.source_detail || "",
    device: row.device,
    model: row.model,
    serial: row.serial,
    accessories: row.accessories,
    previous: row.previous,
    liquid: row.liquid,
    faultLabel: row.fault_label,
    details: row.details,
    handoff: row.handoff,
    returnAddress: row.return_address,
    trackerTicketNumber: row.tracker_ticket_number ?? null,
    trackerTicketId: row.tracker_ticket_id || "",
    trackerPublicToken: row.tracker_public_token || "",
    trackerStatus: row.tracker_status || "",
    trackerSyncedAt: row.tracker_synced_at || "",
    trackerError: row.tracker_error || ""
  };
}

async function handleAdminSync(request, env, cors, encodedReference) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST") {
    return json({ ok: false, error: "Method not allowed." }, 405, cors);
  }

  const auth = requireAdmin(request, env);
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status, cors);
  if (!env.DB) {
    return json({ ok: false, error: "Storage is not configured." }, 503, cors);
  }

  let reference;
  try {
    reference = decodeURIComponent(encodedReference);
  } catch (error) {
    return json({ ok: false, error: "Invalid reference." }, 400, cors);
  }

  if (!/^FF-\d{6}-[A-Z0-9]{4}$/.test(reference)) {
    return json({ ok: false, error: "Invalid reference." }, 400, cors);
  }

  const row = await env.DB.prepare("SELECT * FROM repair_requests WHERE reference = ?")
    .bind(reference)
    .first();

  if (!row) {
    return json({ ok: false, error: "Request not found." }, 404, cors);
  }

  if (row.tracker_ticket_number) {
    return json(
      {
        ok: true,
        already: true,
        ticketNumber: row.tracker_ticket_number,
        trackUrl: row.tracker_public_token
          ? `${trackerPublicBase(env)}/track/${row.tracker_public_token}`
          : ""
      },
      200,
      cors
    );
  }

  const record = rowToRecord(row);
  const result = await syncTicket(env, record, { force: true });

  if (!result.ok) {
    return json({ ok: false, error: result.error || "Could not create the ticket." }, 502, cors);
  }

  return json(
    {
      ok: true,
      ticketNumber: record.trackerTicketNumber,
      trackUrl: trackUrl(env, record)
    },
    200,
    cors
  );
}

async function handleAdminUpdate(request, env, cors, encodedReference) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "PATCH") {
    return json({ ok: false, error: "Method not allowed." }, 405, cors);
  }

  const auth = requireAdmin(request, env);
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status, cors);
  if (!env.DB) {
    return json({ ok: false, error: "Storage is not configured." }, 503, cors);
  }

  let reference;
  try {
    reference = decodeURIComponent(encodedReference);
  } catch (error) {
    return json({ ok: false, error: "Invalid reference." }, 400, cors);
  }

  if (!/^FF-\d{6}-[A-Z0-9]{4}$/.test(reference)) {
    return json({ ok: false, error: "Invalid reference." }, 400, cors);
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return json({ ok: false, error: "Invalid request." }, 400, cors);
  }

  const status = clean(body.status);
  if (!ALLOWED_STATUSES.has(status)) {
    return json({ ok: false, error: "Unknown status." }, 400, cors);
  }

  try {
    const result = await env.DB.prepare(
      "UPDATE repair_requests SET status = ?, updated_at = ? WHERE reference = ?"
    )
      .bind(status, new Date().toISOString(), reference)
      .run();

    if (!result.meta || result.meta.changes === 0) {
      return json({ ok: false, error: "Request not found." }, 404, cors);
    }

    return json({ ok: true, reference, status }, 200, cors);
  } catch (error) {
    console.error("admin update failed", reference, error && error.message);
    return json({ ok: false, error: "Could not update the request." }, 500, cors);
  }
}

function requireAdmin(request, env) {
  if (!env.ADMIN_TOKEN) {
    return { ok: false, status: 503, error: "Admin access is not configured." };
  }
  const header = request.headers.get("Authorization") || "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (!constantTimeEqual(token, env.ADMIN_TOKEN)) {
    return { ok: false, status: 401, error: "Admin token rejected." };
  }
  return { ok: true };
}

function constantTimeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/* ------------------------------------------------------------------ */
/* Request helpers                                                     */
/* ------------------------------------------------------------------ */

function corsHeaders(request, env) {
  const allowed = allowedOrigins(env);
  const origin = request.headers.get("Origin") || "";
  const headers = new Headers({
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    Vary: "Origin"
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
  if (!origin) return true;
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

function formatAddress(record) {
  if (!record.returnStreet && !record.returnCity) return "";
  const cityLine = [record.returnCity, record.returnState].filter(Boolean).join(", ");
  return [record.returnStreet, cityLine, record.returnZip].filter(Boolean).join(", ");
}

function validate(record, body) {
  const problems = [];
  if (record.name.length < 2) problems.push("Please add your name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(record.email)) {
    problems.push("Please add an email address we can reply to.");
  }
  if (!record.device) problems.push("Please choose the kind of device.");
  if (!record.faultLabel) problems.push("Please choose what the device is doing.");
  if (record.details.length < 12) problems.push("Please add a sentence about the fault.");

  if (record.mailIn) {
    if (record.returnStreet.length < 4) problems.push("Please add the return street address.");
    if (record.returnCity.length < 2) problems.push("Please add the return city.");
    if (!/^[A-Z]{2}$/.test(record.returnState)) problems.push("Please add the two-letter state.");
    if (!/^\d{5}(-\d{4})?$/.test(record.returnZip)) problems.push("Please add a valid ZIP code.");
    if (body.packingAck !== true) problems.push("Please confirm you will pack the device securely.");
  }

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
/* D1                                                                  */
/* ------------------------------------------------------------------ */

async function storeRequest(env, record) {
  if (!env.DB) return false;

  const fields = {
    reference: record.reference,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
    status: record.status,
    name: record.name,
    email: record.email,
    phone: record.phone,
    contact: record.contact,
    source: record.source,
    source_detail: record.sourceDetail,
    device: record.device,
    device_id: record.deviceId,
    model: record.model,
    serial: record.serial,
    fault_category: record.faultCategory,
    fault_label: record.faultLabel,
    details: record.details,
    previous: record.previous,
    liquid: record.liquid,
    handoff: record.handoff,
    mail_in: record.mailIn ? 1 : 0,
    return_street: record.returnStreet,
    return_city: record.returnCity,
    return_state: record.returnState,
    return_zip: record.returnZip,
    return_address: record.returnAddress,
    shipping_carrier: record.shippingCarrier,
    tracking_number: record.trackingNumber,
    accessories: record.accessories,
    estimate: record.estimate,
    photo_count: record.photoCount,
    email_status: record.emailStatus,
    tracker_ticket_number: record.trackerTicketNumber ?? null,
    tracker_ticket_id: record.trackerTicketId || "",
    tracker_public_token: record.trackerPublicToken || "",
    tracker_status: record.trackerStatus || "",
    tracker_synced_at: record.trackerSyncedAt || "",
    tracker_error: record.trackerError || "",
    notes: ""
  };

  const columns = Object.keys(fields);
  const sql = `INSERT INTO repair_requests (${columns.join(", ")}) VALUES (${columns
    .map(() => "?")
    .join(", ")})`;

  try {
    await env.DB.prepare(sql)
      .bind(...Object.values(fields))
      .run();
    return true;
  } catch (error) {
    console.error("d1 insert failed", record.reference, error && error.message);
    return false;
  }
}

async function updateEmailStatus(env, record) {
  if (!env.DB) return;
  try {
    await env.DB.prepare(
      "UPDATE repair_requests SET email_status = ?, updated_at = ? WHERE reference = ?"
    )
      .bind(record.emailStatus, new Date().toISOString(), record.reference)
      .run();
  } catch (error) {
    console.error("d1 email status update failed", record.reference, error && error.message);
  }
}

/* ------------------------------------------------------------------ */
/* Repair tracker intake                                               */
/* ------------------------------------------------------------------ */

function trackerBase(env) {
  return String(env.TRACKER_URL || "").replace(/\/+$/, "");
}

function trackerPublicBase(env) {
  return String(env.TRACKER_PUBLIC_URL || env.TRACKER_URL || "").replace(/\/+$/, "");
}

function trackUrl(env, record) {
  const base = trackerPublicBase(env);
  if (!base || !record.trackerPublicToken) return "";
  return `${base}/track/${record.trackerPublicToken}`;
}

async function trackerAutoCreate(env) {
  const fallback = String(env.TRACKER_AUTO_CREATE ?? "1") !== "0";
  if (!env.DB) return fallback;
  try {
    const row = await env.DB.prepare("SELECT value FROM settings WHERE key = ?")
      .bind("tracker_auto_create")
      .first();
    if (!row) return fallback;
    return String(row.value) === "1";
  } catch (error) {
    return fallback;
  }
}

async function setTrackerAutoCreate(env, enabled) {
  if (!env.DB) return false;
  await env.DB.prepare(
    "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) " +
      "ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at"
  )
    .bind("tracker_auto_create", enabled ? "1" : "0", new Date().toISOString())
    .run();
  return true;
}

async function saveTrackerFields(env, record) {
  if (!env.DB) return;
  try {
    await env.DB.prepare(
      "UPDATE repair_requests SET tracker_ticket_number = ?, tracker_ticket_id = ?, " +
        "tracker_public_token = ?, tracker_status = ?, tracker_synced_at = ?, tracker_error = ?, " +
        "updated_at = ? WHERE reference = ?"
    )
      .bind(
        record.trackerTicketNumber ?? null,
        record.trackerTicketId || "",
        record.trackerPublicToken || "",
        record.trackerStatus || "",
        record.trackerSyncedAt || "",
        record.trackerError || "",
        new Date().toISOString(),
        record.reference
      )
      .run();
  } catch (error) {
    console.error("d1 tracker update failed", record.reference, error && error.message);
  }
}

/**
 * Creates the ticket in RepairTrackerV2. Failures are recorded on the request
 * instead of failing the submission, so the inbox can retry later.
 */
async function syncTicket(env, record, options = {}) {
  const base = trackerBase(env);
  const token = env.TRACKER_INTAKE_TOKEN || "";

  if (!base || !token) {
    record.trackerError = "Tracker is not configured.";
    return { ok: false, skipped: true, error: record.trackerError };
  }

  if (!options.force && !(await trackerAutoCreate(env))) {
    record.trackerError = "Automatic ticketing is paused.";
    return { ok: false, skipped: true, error: record.trackerError };
  }

  const condition = [
    record.previous ? `Previous work: ${record.previous}` : "",
    record.liquid ? `Liquid: ${record.liquid}` : ""
  ]
    .filter(Boolean)
    .join(". ");

  try {
    const response = await fetch(`${base}/api/intake`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        reference: record.reference,
        name: record.name,
        email: record.email,
        phone: record.phone || "",
        deviceType: record.device || "",
        brand: "",
        model: record.model || "",
        serial: record.serial || "",
        accessories: record.accessories || "",
        condition,
        fault: record.faultLabel || "Repair request",
        details: record.details || "",
        delivery: record.handoff || "",
        address: record.returnAddress || ""
      }),
      signal: AbortSignal.timeout(8000)
    });

    let result = null;
    try {
      result = await response.json();
    } catch (error) {
      result = null;
    }

    if (!response.ok || !result || result.ok !== true) {
      record.trackerError =
        (result && result.error) || `The tracker returned ${response.status}.`;
      await saveTrackerFields(env, record);
      return { ok: false, error: record.trackerError };
    }

    record.trackerTicketNumber = result.ticketNumber;
    record.trackerTicketId = result.ticketId || "";
    record.trackerPublicToken = result.publicToken || "";
    record.trackerStatus = "Received";
    record.trackerSyncedAt = new Date().toISOString();
    record.trackerError = "";
    await saveTrackerFields(env, record);

    return {
      ok: true,
      ticketNumber: record.trackerTicketNumber,
      publicToken: record.trackerPublicToken
    };
  } catch (error) {
    record.trackerError =
      error && error.name === "TimeoutError"
        ? "The tracker did not answer in time."
        : "The tracker could not be reached.";
    console.error("tracker sync failed", record.reference, error && error.message);
    await saveTrackerFields(env, record);
    return { ok: false, error: record.trackerError };
  }
}

/* ------------------------------------------------------------------ */
/* Email                                                               */
/* ------------------------------------------------------------------ */

async function sendShopEmail(env, record, attachments) {
  const to = String(env.TO_EMAIL || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const subject = `${record.mailIn ? "MAIL-IN " : ""}Repair request ${record.reference} — ${headerSafe(
    record.device
  ) || "device"} — ${headerSafe(record.name)}`;

  return resend(env, {
    from: env.FROM_EMAIL,
    to,
    reply_to: record.email,
    subject,
    html: shopHtml(record, env),
    text: shopText(record, env),
    attachments
  });
}

async function sendCustomerEmail(env, record) {
  const subject = `We got your repair request (${record.reference})`;
  return resend(env, {
    from: env.FROM_EMAIL,
    to: [record.email],
    reply_to: String(env.TO_EMAIL || "").split(",")[0].trim(),
    subject,
    html: customerHtml(record, env),
    text: customerText(record, env)
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

function shopHtml(record, env) {
  const rows = [
    ["Reference", record.reference],
    ["Received", record.createdAt],
    ["Status", record.status],
    ["Name", record.name],
    ["Email", record.email],
    ["Phone", record.phone || "—"],
    ["Preferred contact", record.contact || "—"],
    ["Heard about us", record.source || "—"],
    ["Campaign / referrer", record.sourceDetail || "—"],
    ["Device", record.device],
    ["Make and model", record.model || "—"],
    ["Serial", record.serial || "—"],
    ["Reported fault", record.faultLabel],
    ["Estimate selection", record.estimate || "—"],
    ["Previous work", record.previous || "—"],
    ["Liquid contact", record.liquid || "—"],
    ["Handoff", record.handoff || "—"],
    ["Diagnosis", "Free"],
    ["Warranty", "90 days on every repair"],
    [
      "Tracker ticket",
      record.trackerTicketNumber ? `#${record.trackerTicketNumber}` : record.trackerError || "Not created"
    ],
    ["Customer status link", trackUrl(env, record) || "—"],
    ["Photos", String(record.photoCount || 0)]
  ];

  if (record.mailIn) {
    rows.push(
      ["Mail-in", "Yes"],
      ["Return address", record.returnAddress || "—"],
      ["Carrier", record.shippingCarrier || "Not shipped yet"],
      ["Tracking", record.trackingNumber || "—"],
      ["Accessories", record.accessories || "—"]
    );
  }

  const table = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:9px 14px;background:#ece8df;color:#666b73;font:13px Arial,sans-serif;width:170px;vertical-align:top">${escapeHtml(
          label
        )}</td><td style="padding:9px 14px;background:#ffffff;color:#17191c;font:15px Arial,sans-serif;vertical-align:top">${escapeHtml(
          String(value)
        )}</td></tr>`
    )
    .join("");

  const shopAddress = env.SHOP_ADDRESS && String(env.SHOP_ADDRESS).trim();

  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f4f1ea">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #d9d5cb;border-radius:12px;overflow:hidden">
    <tr><td style="padding:20px 24px;background:#17191c;color:#ecedef;font:600 20px Arial,sans-serif">FastFixIt Electronics — new repair request</td></tr>
    ${
      record.mailIn
        ? `<tr><td style="padding:12px 24px;background:#c2410c;color:#ffffff;font:600 14px Arial,sans-serif">MAIL-IN — do not ship until you have replied with the address and reference</td></tr>`
        : ""
    }
    <tr><td style="padding:20px 24px 4px"><p style="margin:0;font:15px Arial,sans-serif;color:#17191c">A request came in from the website. Reply to this email to answer the customer directly.${
      shopAddress ? ` The shop address on file is ${escapeHtml(shopAddress)}.` : ""
    }</p></td></tr>
    <tr><td style="padding:16px 24px 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${table}</table></td></tr>
    ${
      record.trackerTicketNumber
        ? `<tr><td style="padding:0 24px 20px"><p style="margin:0;font:14px Arial,sans-serif;color:#17191c">Ticket #${escapeHtml(
            String(record.trackerTicketNumber)
          )} is in the tracker. <a href="${escapeHtml(trackerBase(env))}/app/tickets" style="color:#c2410c">Open the tracker</a></p></td></tr>`
        : ""
    }
    <tr><td style="padding:0 24px 24px"><p style="margin:0 0 6px;font:600 14px Arial,sans-serif;color:#666b73">Fault description</p><p style="margin:0;padding:14px;background:#f4f1ea;color:#17191c;font:15px/1.55 Arial,sans-serif;white-space:pre-wrap">${escapeHtml(
      record.details
    )}</p></td></tr>
    <tr><td style="padding:0 24px 24px;font:13px Arial,sans-serif;color:#666b73">Sent from the FastFixIt website${
      record.country ? " · " + escapeHtml(record.country) : ""
    }</td></tr>
  </table></body></html>`;
}

function shopText(record, env) {
  const lines = [
    `${record.mailIn ? "MAIL-IN — " : ""}New repair request — ${record.reference}`,
    "",
    `Name: ${record.name}`,
    `Email: ${record.email}`,
    `Phone: ${record.phone || "—"}`,
    `Preferred contact: ${record.contact || "—"}`,
    `Heard about us: ${record.source || "—"}`,
    `Campaign / referrer: ${record.sourceDetail || "—"}`,
    `Device: ${record.device}`,
    `Model: ${record.model || "—"}`,
    `Serial: ${record.serial || "—"}`,
    `Fault: ${record.faultLabel}`,
    `Estimate selection: ${record.estimate || "—"}`,
    `Previous work: ${record.previous || "—"}`,
    `Liquid: ${record.liquid || "—"}`,
    `Handoff: ${record.handoff || "—"}`,
    "Diagnosis: Free",
    "Warranty: 90 days on every repair",
    `Photos: ${record.photoCount || 0}`,
    ""
  ];

  if (record.trackerTicketNumber) lines.push(`Tracker ticket: #${record.trackerTicketNumber}`);
  if (trackUrl(env, record)) lines.push(`Track your repair: ${trackUrl(env, record)}`);
  if (record.trackerTicketNumber || trackUrl(env, record)) lines.push("");

  if (record.mailIn) {
    lines.push(
      "Mail-in details:",
      `Return address: ${record.returnAddress || "—"}`,
      `Carrier: ${record.shippingCarrier || "Not shipped yet"}`,
      `Tracking: ${record.trackingNumber || "—"}`,
      `Accessories: ${record.accessories || "—"}`,
      ""
    );
  }

  lines.push("Details:", record.details);
  return lines.join("\n");
}

function customerHtml(record, env) {
  const shopAddress = env.SHOP_ADDRESS && String(env.SHOP_ADDRESS).trim();
  const mailInIntro = record.mailIn
    ? `<p style="margin:0 0 14px;font:15px/1.6 Arial,sans-serif;color:#17191c"><strong>This is a mail-in request.</strong> Don't ship yet. We'll reply with the shipping address and packing instructions. Put your reference inside the box, and reply with the carrier and tracking number after you ship.</p>
       <p style="margin:0 0 14px;padding:14px;background:#fbe9e1;border:1px solid #f3c8b5;border-radius:8px;font:14px/1.6 Arial,sans-serif;color:#17191c">${
         shopAddress
           ? `Ship to: <strong>${escapeHtml(shopAddress)}</strong>`
           : "We'll send the shipping address in our reply."
       }</p>`
    : "";

  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f4f1ea">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #d9d5cb;border-radius:12px;overflow:hidden">
    <tr><td style="padding:20px 24px;background:#17191c;color:#ecedef;font:600 20px Arial,sans-serif">FastFixIt Electronics</td></tr>
    <tr><td style="padding:24px">
      <p style="margin:0 0 14px;font:15px/1.6 Arial,sans-serif;color:#17191c">Hi ${escapeHtml(record.name)},</p>
      <p style="margin:0 0 14px;font:15px/1.6 Arial,sans-serif;color:#17191c">We've got your repair request. Your reference is <strong style="font-family:Arial,sans-serif">${escapeHtml(
        record.reference
      )}</strong>.</p>
      ${mailInIntro}
      <p style="margin:0 0 14px;font:15px/1.6 Arial,sans-serif;color:#17191c"><strong>Diagnosis is free.</strong> You'll get a written quote before any work. Every repair includes a 90-day workmanship warranty.</p>
      ${
        trackUrl(env, record)
          ? `<p style="margin:0 0 14px;padding:14px;background:#fbe9e1;border:1px solid #f3c8b5;border-radius:8px;font:15px/1.6 Arial,sans-serif;color:#17191c"><strong>Track it yourself.</strong> Your repair is ticket #${escapeHtml(
              String(record.trackerTicketNumber)
            )}. <a href="${escapeHtml(trackUrl(env, record))}" style="color:#c2410c">Open your repair status</a> any time to see where it is, approve the quote, or pay an invoice.</p>`
          : ""
      }
      <p style="margin:0 0 6px;font:600 14px Arial,sans-serif;color:#666b73">What you sent</p>
      <p style="margin:0 0 14px;padding:14px;background:#f4f1ea;color:#17191c;font:14px/1.6 Arial,sans-serif">${escapeHtml(
        record.device
      )}${record.model ? " · " + escapeHtml(record.model) : ""}<br>${escapeHtml(
        record.faultLabel
      )}<br><span style="color:#666b73">${escapeHtml(record.details.slice(0, 500))}${
        record.details.length > 500 ? "…" : ""
      }</span></p>
      <p style="margin:0 0 6px;font:600 14px Arial,sans-serif;color:#666b73">What happens next</p>
      <ol style="margin:0 0 18px;padding-left:18px;font:14px/1.6 Arial,sans-serif;color:#17191c">
        <li>We read the request and reply within one business day.</li>
        <li>Free bench diagnosis, usually 24–48 hours.</li>
        <li>You get a written quote. Nothing happens until you approve it.</li>
        <li>Repair, then a 24-hour test.</li>
        <li>${record.mailIn ? "We confirm return shipping and send it back with tracking." : "Collect in person, or we ship it back with tracking."}</li>
      </ol>
      <p style="margin:0;font:13px/1.5 Arial,sans-serif;color:#666b73">Diagnosis is free. If we can't find the fault, you still get a written explanation. This is not a quote.</p>
    </td></tr>
    <tr><td style="padding:16px 24px;background:#ece8df;font:13px/1.5 Arial,sans-serif;color:#666b73">FastFixIt Electronics, LLC</td></tr>
  </table></body></html>`;
}

function customerText(record, env) {
  const lines = [
    `Hi ${record.name},`,
    "",
    `We've got your repair request. Your reference is ${record.reference}.`,
    record.mailIn
      ? "This is a mail-in request. Don't ship yet. We'll reply with the shipping address and packing instructions. Put your reference inside the box, and reply with the carrier and tracking number after you ship."
      : "A person at the bench will reply within one business day.",
    "",
    `Device: ${record.device}${record.model ? " · " + record.model : ""}`,
    `Fault: ${record.faultLabel}`,
    "",
    "Diagnosis is free. You'll get a written quote before any work. Every repair includes a 90-day workmanship warranty.",
    ""
  ];

  if (trackUrl(env, record)) {
    lines.push(
      `Ticket #${record.trackerTicketNumber}: ${trackUrl(env, record)}`,
      "Open that link any time to see the repair status, approve the quote, or pay an invoice.",
      ""
    );
  }

  lines.push(
    record.mailIn
      ? "What happens next: we reply with the shipping address, then free diagnosis, a written quote, the repair, a 24-hour test, and return shipping with tracking."
      : "What happens next: free diagnosis, a written quote, the repair, a 24-hour test, then collect in person or we ship it back.",
    "",
    "FastFixIt Electronics, LLC"
  );

  return lines.join("\n");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}