# FastFixIt Electronics

A static website for FastFixIt Electronics, LLC: game console and electronics repair. Hosted on **GitHub Pages**, with **Cloudflare** for DNS and the repair intake API, and **Resend** for email notifications.

**Repository:** <https://github.com/Spaced1127/fastfixit-website>  
**Preview:** <https://spaced1127.github.io/fastfixit-website/>  
**Target domain:** <https://fastfixitelectronics.com>

No build step. Upload the files and the site runs.

---

## What is here

| Page | File | What it does |
| --- | --- | --- |
| Home | `index.html` | Hero, free-diagnosis/90-day promise band, live bench estimate, services, process, test standards, shop, FAQ, contact |
| Services | `services.html` | Rate card, console / controller / computer / board-level detail, scope, warranty |
| Mail-in | `mail-in.html` | Mail-in process, packing list, shipping and returns, mail-in request CTA |
| About | `about.html` | The shop, how we work, equipment, photographs |
| Start a repair | `request.html` | Intake form for drop-off or mail-in, photo attachments, success state |
| Request inbox | `admin.html` | Private, token-gated list of website requests and status updates (noindex, not linked publicly) |
| Privacy | `privacy.html` | Plain-language privacy note |
| 404 | `404.html` | Not-found page |

The visual system is based on **Repair Bench V2**: warm canvas `#f4f1ea`, white surfaces, ink `#17191c`, burnt-orange accent, Archivo type, 8/12px radii and flat tone-separated cards. It includes a light/dark toggle that follows the system theme by default and saves the choice in `ffi-theme`.

---

## Read this before publishing

### 1. Contact details and city

Edit **`assets/js/config.js`**. Every page reads from it.

```js
phone: "(512) 555-0142",
email: "repairs@fastfixitelectronics.com",
street: "123 Example Ave",
city: "Austin",
region: "TX",
postal: "78701",
country: "US",
hours: "Mon–Fri 10–6, Sat 10–2",
mapUrl: "",
formEndpoint: "https://api.fastfixitelectronics.com/repair-request",
turnstileSiteKey: "",
siteUrl: "https://fastfixitelectronics.com"
```

Empty values show a clearly marked bracket placeholder such as `[PHONE]` or `[CITY]`. `mapUrl` adds a Directions link under the home-page address. `country` is used in structured data.

### 2. Prices, diagnosis and warranty

- **Diagnosis is free.** The estimator uses `diagnostic: 0` in `assets/js/data.js`; any place with `data-diagnostic` renders **Free**. There is no bench fee anywhere in the copy.
- **Every repair includes a 90-day workmanship warranty.** This is stated on the home page, services page, about page, request page, FAQ and customer email.
- **Starting prices** for the estimator live in `assets/js/data.js`. They are sample labor prices; change them.
- The **rate card** on `services.html` is static HTML. Keep it in sync with `data.js`.
- Confirm these sample promises: 24–48 hour diagnosis, 2–5 day typical repair, 24-hour soak test, written quote before work, one bench, local drop-off or mail-in. Edit the copy if any of that is not true.
- The service lists are deliberately broad. Remove anything you do not take on (phones, TVs, turntables, mail-in), and confirm the equipment list on `about.html`.

### 3. Mail-in

The request form has a **Drop off / Mail it in** choice. Mail-in adds return address, carrier, tracking number, accessories and a packing confirmation. The API validates the return address and stores it with the request.

The site does **not** publish a shipping label. After a mail-in request, the shop replies with the bench address and packing instructions. Set that address on the Worker as `SHOP_ADDRESS`; the customer auto-reply includes it when present.

Return shipping is quoted before the device goes back. The customer pays inbound shipping. Confirm both policies.

### 4. Photographs

The five photographs in `assets/img/` are **AI-generated placeholders**, not photographs of your shop. Replace them with real photos of your bench, tools and work. Keep the same paths and aspect ratios:

| File | Crop | Use |
| --- | --- | --- |
| `bench-solder.webp` | 4:5 | Hero crossfade |
| `bench-hdmi.webp` | 4:5 | Hero crossfade, services, about, mail-in |
| `bench-stick.webp` | 4:5 | Hero crossfade, services, about, mail-in |
| `bench-wide.webp` | 3:2 | Home shop section, About, Mail-in |
| `bench-test.webp` | 3:2 | Standards, services, About, Mail-in |

Keep the `-sm.webp` versions for phones. Update the `alt` text when you change a photo.

### 5. Privacy note

`privacy.html` describes the form as built: Cloudflare storage and spam check, Resend email, a private token-gated inbox, no advertising trackers. Read it, adjust the retention period and shop details, and have it checked if you want legal certainty. It is not legal advice.

### 6. Reviews

There are no testimonials, star ratings, customer logos or invented statistics on this site. Add real Google reviews or a link to your listing if you want social proof. Do not fill the gap with made-up quotes.

---

## Run it locally

```powershell
npx serve .
```

Or:

```powershell
python -m http.server 3000
```

Open `http://localhost:3000`.

Without a form endpoint configured, the form falls back to opening the visitor's email app, as long as the shop email is in `config.js`. To test the real Worker locally, see the Worker section.

---

## Deploy the site to GitHub Pages

The repository already exists and `main` tracks `origin/main`. Push changes:

```powershell
git add .
git commit -m "Update site"
git push
```

**Settings → Pages** should be:

- Source: Deploy from a branch
- Branch: `main`
- Folder: `/ (root)`

The preview is <https://spaced1127.github.io/fastfixit-website/>. The target custom domain is `fastfixitelectronics.com`.

### Cloudflare DNS for GitHub Pages

In **Cloudflare → fastfixitelectronics.com → DNS → Records**, set:

| Type | Name | Content | Proxy |
| --- | --- | --- | --- |
| A | `@` | `185.199.108.153` | DNS only |
| A | `@` | `185.199.109.153` | DNS only |
| A | `@` | `185.199.110.153` | DNS only |
| A | `@` | `185.199.111.153` | DNS only |
| AAAA | `@` | `2606:50c0:8000::153` | DNS only |
| AAAA | `@` | `2606:50c0:8001::153` | DNS only |
| AAAA | `@` | `2606:50c0:8002::153` | DNS only |
| AAAA | `@` | `2606:50c0:8003::153` | DNS only |
| CNAME | `www` | `spaced1127.github.io` | DNS only |

Remove the old proxied apex/www records first. **Do not touch the MX or TXT records**; email is hosted at IONOS. Do not touch the tracker subdomain unless you are moving it.

After DNS resolves, set **Settings → Pages → Custom domain** to `fastfixitelectronics.com` and wait for the certificate. Turn on **Enforce HTTPS**. Add a `CNAME` file containing `fastfixitelectronics.com` if GitHub does not create it. The `CNAME.example` file shows the format.

Keep the proxy off (gray cloud) while GitHub issues the certificate. If you later put Cloudflare in front, use SSL/TLS **Full (strict)**.

The custom `404.html` is served on the custom domain. On the `github.io` project preview, GitHub may show its own bare 404; the page is still at `/404.html`.

---

## Deploy the Worker, D1 inbox and spam check

The Worker in `worker/` handles:

- `POST /repair-request` — drop-off or mail-in intake
- `GET /admin/requests` — protected request list
- `PATCH /admin/requests/:reference` — protected status update
- `GET /health`

It stores every request in **Cloudflare D1** and can send email through **Resend**. If Resend is not configured, requests are still stored and visible in the inbox. If D1 is not configured, email still works.

### 1. Create the D1 database

```powershell
cd worker
npx wrangler d1 create fastfixit-requests
```

Copy the `database_id` into `worker/wrangler.toml`, uncomment the `[[d1_databases]]` block, and apply the schema:

```powershell
npx wrangler d1 execute fastfixit-requests --remote --file=schema.sql
```

### 2. Set the Worker variables

In `worker/wrangler.toml`:

```toml
SITE_ORIGIN = "https://fastfixitelectronics.com,https://www.fastfixitelectronics.com,https://spaced1127.github.io,http://localhost:3000"
TO_EMAIL = "repairs@fastfixitelectronics.com"
FROM_EMAIL = "FastFixIt Repairs <repairs@send.fastfixitelectronics.com>"
SHOP_ADDRESS = "FastFixIt Electronics, 123 Example Ave, Austin, TX 78701"
```

`SITE_ORIGIN` must match the browser origin exactly: scheme + host, no path, no trailing slash.

### 3. Set secrets

```powershell
npx wrangler secret put ADMIN_TOKEN
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put TURNSTILE_SECRET
```

`ADMIN_TOKEN` is a long random string used by `admin.html`. The site owner should keep it out of the repository and rotate it if it is shared. `RESEND_API_KEY` and `TURNSTILE_SECRET` can be left unset while you bring the rest up.

### 4. Deploy and attach the API domain

```powershell
npx wrangler deploy
```

Then either add `api.fastfixitelectronics.com` in **Workers & Pages → fastfixit-repairs → Settings → Domains & Routes**, or uncomment the `[[routes]]` block in `wrangler.toml` and redeploy. The route is proxied through Cloudflare; leave the site apex on DNS only.

Set `formEndpoint` in `assets/js/config.js` to:

```js
formEndpoint: "https://api.fastfixitelectronics.com/repair-request"
```

Commit and push.

### 5. Resend (optional email notifications)

Use a **sending subdomain**, such as `send.fastfixitelectronics.com`, so you do not disturb the IONOS MX/SPF records on the root domain.

1. In Resend, add `send.fastfixitelectronics.com` as a domain.
2. Add the DNS records Resend shows. Keep them DNS only.
3. Create a sending-only API key.
4. Put the key in the Worker with `npx wrangler secret put RESEND_API_KEY`.
5. Set `FROM_EMAIL` to an address on the verified subdomain.

Until Resend is configured, the form still stores requests and the request inbox is the notification. The customer sees the standard “we'll reply” message; reply from the inbox or your email.

### 6. Turnstile

Cloudflare Turnstile is optional but recommended. Add a Turnstile widget for `fastfixitelectronics.com` and `spaced1127.github.io`. Put the **site key** in `assets/js/config.js` as `turnstileSiteKey` and the **secret** in the Worker:

```powershell
npx wrangler secret put TURNSTILE_SECRET
```

Set both or neither. If the secret is set and the site key is missing, the form will fail.

### 7. The request inbox

Open:

```text
https://fastfixitelectronics.com/admin.html
```

Paste the `ADMIN_TOKEN` you set on the Worker. The token stays in that browser tab (sessionStorage) and is cleared when the tab closes. The inbox shows every request, including:

- contact and preferred method
- device, model, serial and fault
- drop-off or mail-in
- return address, carrier, tracking and accessories for mail-in
- the estimate selection and submitted details
- photos count
- status, with a select and save button

Statuses: New, Awaiting device, Received, Diagnosing, Quoted, Waiting on customer, Approved, Repairing, Testing, Ready, Shipped, Closed, Canceled.

The page is `noindex` and is not linked from the public site. For a stronger lock, put **Cloudflare Access** in front of `/admin.html` and the `api` hostname, and keep the token as a second factor.

### 8. Test it

- Submit a drop-off request and check D1 / the inbox.
- Submit a mail-in request with a return address and confirm the admin shows the address, carrier, tracking and accessories.
- Change a status in the inbox and confirm the badge and row update.
- If Resend is on: check the shop email and the customer auto-reply; reply to the auto-reply to verify it reaches the shop.
- If Turnstile is on: complete the widget and confirm a missing token is rejected.
- Try a mail-in request with no address and confirm it is rejected.
- Try the honeypot and a fast submit; confirm nothing is stored or sent.

### Worker environment reference

| Variable | Secret? | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | yes | Sends shop and customer emails |
| `TO_EMAIL` | no | Shop inbox (comma-separated allowed) |
| `FROM_EMAIL` | no | Verified Resend sender on the sending subdomain |
| `SITE_ORIGIN` | no | Allowed browser origins, comma-separated |
| `SHOP_ADDRESS` | no | Included in mail-in replies when set |
| `TURNSTILE_SECRET` | yes | Verifies the spam token; optional |
| `ADMIN_TOKEN` | yes | Protects the request inbox and admin API |
| `DB` | binding | D1 request storage; optional but recommended |

---

## How to edit the content

### Services and estimator

- **`assets/js/data.js`** — the device/fault tree, check text, turnaround and starting labor. `diagnostic: 0` renders as Free.
- **`services.html`** — the rate card, service descriptions, at-a-glance facts and warranty.
- **`index.html`** — hero, promise band, services index, process slip, test table, FAQ.

### Contact details

- **`assets/js/config.js`** — one file for all pages. Elements with `data-contact="phone"`, `email`, `city`, `address-line1`, `address-line2` and `hours` are filled from it.
- Empty values stay as visible placeholders.
- Structured data is injected only when `siteUrl`, `phone`, `street` and `city` are real.

### Mail-in

- **`mail-in.html`** — the public explanation and CTA. The CTA uses `request.html?mode=mail#request-form`.
- **`request.html`** — the `data-mailin-fields` block and the `handoff` radios.
- **`assets/js/form.js`** — shows the mail-in block, validates the return address and adds the fields to the payload.
- **`worker/wrangler.toml`** — `SHOP_ADDRESS`, `TO_EMAIL`, `FROM_EMAIL`.

### Request inbox

- **`admin.html`**, **`assets/js/admin.js`** — the token gate, request list and status updates.
- **`worker/schema.sql`** — the D1 table.
- **`worker/src/index.js`** — intake, D1, email, admin API.

### Photos, fonts and 404

Replace a `.webp` at the same path. Archivo is self-hosted in `assets/fonts/archivo-var.woff2` under the SIL Open Font License; the license is in `assets/fonts/OFL.txt`. The 404 page is `404.html`.

### Asset versions

CSS and JS are linked with a version query, for example `assets/js/form.js?v=20261119b`. GitHub Pages caches assets for about ten minutes and browsers keep them longer, so a returning visitor can otherwise run an old script against new HTML. After editing anything in `assets/css/` or `assets/js/`, bump the version string in every page. One command does it:

```powershell
node -e "const fs=require('fs');for(const f of ['index.html','services.html','mail-in.html','about.html','request.html','admin.html','privacy.html','404.html']){let h=fs.readFileSync(f,'utf8');h=h.replace(/assets\/(css|js)\/([a-z0-9-]+\.(css|js))\?v=[^\"']+/g,'assets/$1/$2?v=NEWVERSION');fs.writeFileSync(f,h)}"
```

Replace `NEWVERSION` with today's date and a letter, such as `20261119c`.

### Sitemap and social preview

There is no `sitemap.xml` because the site is still being moved to its domain. Submit the domain in Google Search Console when it is live. Add an Open Graph image after a real photo is available:

```html
<meta property="og:image" content="https://fastfixitelectronics.com/assets/img/bench-wide.webp">
```

The spec wants an absolute URL.

---

## Design notes

- **Tracker V2 match:** warm canvas, white surfaces, ink, burnt-orange accent, Archivo, 8/12px radii, flat tone-separated cards and a light/dark toggle. The accent is `#c2410c` in light (a slightly darker burnt orange for text contrast) and `#ff7a3d` in dark. The tracker default is `#d9480f`; change `--accent` in `theme-v2.css` if you want the exact value.
- **The idea:** the repair work order — a written estimate, a process slip, a test table, a mail-in ticket and a private request inbox.
- **The live thing:** the bench estimate. It uses the real service tree, updates the ticket and prefills the request form.
- **Free diagnosis and warranty** are stated in the hero, the promise band, the process slip, the estimator ticket, services, about, request, FAQ and both emails.
- **No fake proof:** no invented reviews, customer logos, staff names or statistics. The About page is the shop's approach, not a fabricated history.
- **Motion:** hero crossfade, slow photo drifts, staggered section entrances and control feedback. Content is visible with JavaScript off; the estimator and form have plain fallbacks.
- **Accessibility:** skip link, keyboard-operable estimator and menu, visible focus, labelled fields, error summary, `aria-live` status, reduced-motion support and 4.5:1+ text contrast.

---

## File tree

```text
.
├── index.html
├── services.html
├── mail-in.html
├── about.html
├── request.html
├── admin.html
├── privacy.html
├── 404.html
├── CNAME.example
├── .nojekyll
├── .gitignore
├── README.md
├── favicon-16.png
├── favicon-32.png
├── apple-touch-icon.png
├── assets
│   ├── brand
│   │   ├── badge-64.png
│   │   ├── badge-96.png
│   │   ├── badge-192.png
│   │   ├── badge-512.png
│   │   ├── badge-1200.webp
│   │   └── _source/Fastfixit-original.png
│   ├── css
│   │   ├── site.css
│   │   └── theme-v2.css
│   ├── fonts
│   │   ├── archivo-var.woff2
│   │   └── OFL.txt
│   ├── img
│   │   ├── bench-solder.webp / -sm.webp
│   │   ├── bench-hdmi.webp / -sm.webp
│   │   ├── bench-stick.webp / -sm.webp
│   │   ├── bench-wide.webp / -sm.webp
│   │   └── bench-test.webp / -sm.webp
│   └── js
│       ├── config.js
│       ├── data.js
│       ├── boot.js
│       ├── site.js
│       ├── estimator.js
│       ├── form.js
│       └── admin.js
└── worker
    ├── schema.sql
    ├── src/index.js
    ├── wrangler.toml
    └── .dev.vars.example
```

---

## Launch checklist

- [ ] Fill `assets/js/config.js` (phone, email, address, city, hours, site URL).
- [ ] Set `formEndpoint` to the deployed Worker.
- [ ] Set your own starting prices in `assets/js/data.js` and `services.html`.
- [ ] Confirm free diagnosis, 90-day warranty, turnaround and test promises.
- [ ] Confirm the mail-in return-shipping policy and `SHOP_ADDRESS`.
- [ ] Remove any service you don't offer and confirm the equipment list.
- [ ] Replace the five AI photos with real shop photos and update alt text.
- [ ] Read and adjust `privacy.html`.
- [ ] Create D1, deploy the Worker, run the schema.
- [ ] Set `ADMIN_TOKEN`, then bookmark `admin.html` and test it.
- [ ] Set Resend on a sending subdomain and test both emails.
- [ ] Set Turnstile site key and secret.
- [ ] Add the Cloudflare DNS records and set the GitHub Pages custom domain.
- [ ] Turn on Enforce HTTPS.
- [ ] Check every page at 390, 768 and 1440 px in light and dark.
- [ ] Check the 404 page, privacy link, mail-in links and footer.
- [ ] Submit a real drop-off request and a real mail-in request.

---

## Credits

- Logo: supplied by FastFixIt Electronics.
- Typeface: [Archivo](https://github.com/Omnibus-Type/Archivo), SIL Open Font License 1.1.
- Photography: generated placeholder images, not the client's own work. Replace before launch.
- Built as a static site with a Cloudflare Worker, D1 and optional Resend/Turnstile. No framework, no analytics.