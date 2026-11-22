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
| PS5 / Xbox HDMI | `ps5-hdmi-repair-kinston.html` | Local landing page: symptoms, price, drop-off area, FAQs, Service + FAQ schema |
| Switch drift | `switch-drift-repair-kinston.html` | Local landing page: drift symptoms, price, drop-off area, FAQs, Service + FAQ schema |
| Greenville | `greenville-console-repair.html` | ECU-focused page: appointment drop-off trips, prices, FAQs, Service + FAQ schema |
| Goldsboro | `goldsboro-console-repair.html` | Seymour Johnson AFB-focused page: appointment drop-off trips, second opinions, FAQs |
| Mail-in | `mail-in.html` | Mail-in process, packing list, shipping and returns, mail-in request CTA |
| About | `about.html` | The shop, how we work, equipment, photographs |
| Start a repair | `request.html` | Intake form for drop-off or mail-in, photo attachments, success state |
| Request inbox | `admin.html` | Private, token-gated list of website requests and status updates (noindex, not linked publicly) |
| Review cards | `review.html` | Printable 3.5 × 2 in review cards with a QR code from `reviewUrl` (noindex) |
| Privacy | `privacy.html` | Plain-language privacy note |
| 404 | `404.html` | Not-found page |

The visual system is based on **Repair Bench V2**: warm canvas `#f4f1ea`, white surfaces, ink `#17191c`, burnt-orange accent, Archivo type, 8/12px radii and flat tone-separated cards. It includes a light/dark toggle that follows the system theme by default and saves the choice in `ffi-theme`.

---

## Read this before publishing

### 1. Contact details and city

Edit **`assets/js/config.js`**. Every page reads from it.

```js
phone: "252-320-1212",
email: "repairs@fastfixitelectronics.com",
city: "Kinston",
region: "NC",
country: "US",
hours: "Mon-Sat 9AM-7PM",
formEndpoint: "https://api.fastfixitelectronics.com/repair-request",
turnstileSiteKey: "0x4AAAAAAGIeVmCJ8hgSB8JN",
siteUrl: "https://fastfixitelectronics.com",
  reviewUrl: "",
  cloudflareAnalyticsToken: ""
```

There is **no storefront**, so there is no street address or postal code in the config or the markup. Pages show `city, region` only, with drop-off described as by appointment. Empty values show a clearly marked bracket placeholder such as `[PHONE]` or `[CITY]`.

### 2. Prices, diagnosis and warranty

- **Diagnosis is free.** The estimator uses `diagnostic: 0` in `assets/js/data.js`; any place with `data-diagnostic` renders **Free**. There is no bench fee anywhere in the copy.
- **Every repair includes a 90-day workmanship warranty.** This is stated on the home page, services page, about page, request page, FAQ and customer email.
- **Three published starting prices:** HDMI port replacement $100, stick drift $40, no-power faults from $79. Every other fault is `from: null`, which renders as "Quoted after inspection" in the estimator.
- The **rate card** on `services.html` mirrors those three prices. Keep it in sync with `data.js`.
- Confirm these sample promises: 24–48 hour diagnosis, 2–5 day typical repair, 24-hour soak test, written quote before work, one bench, drop-off by appointment or mail-in. Edit the copy if any of that is not true.
- The service lists are deliberately broad. Remove anything you do not take on (phones, TVs, turntables, mail-in), and confirm the equipment list on `about.html`.

### 3. Mail-in

The request form has a **Drop off / Mail it in** choice. Mail-in adds return address, carrier, tracking number, accessories and a packing confirmation. The API validates the return address and stores it with the request.

The site does **not** publish a shipping address or label. After a mail-in request, the shop replies with the address and packing instructions. Leave `SHOP_ADDRESS` empty on the Worker and the customer auto-reply says the address follows in that reply; set it only if you want the address printed in the email.

Return shipping is quoted before the device goes back. The customer pays inbound shipping. Confirm both policies.

### 4. Photographs

The site now uses the shop's own photos, cropped from the originals in `photos/`. That folder is source material and is ignored by git; the published copies are the `assets/img/*.webp` files.

The Greenville and Goldsboro pages also use two licensed local photos:
`ecu-campus.webp` (Ecu2020, CC BY-SA 4.0) and `sjafb-f15e.webp` (U.S. Air
Force, public domain). Sources, authors, and changes are listed in
`assets/img/CREDITS.md`; keep that file with the images.

The recent bench-work gallery and the PS5 before/after section use the newer
source photos in `photos/` (`ps5_hdmi_replacement`, `PS5_rear_before/after`,
`Xbox_Series_S_HDMI_removed/replaced`, `some_else_attempted`, `after_we_fixed`,
`waterdamagedswitch`, `dirty_ps5`, `IMG_1631`). They are cropped to WebP in
`assets/img/`; keep the originals out of git.

| File | Crop | Source | Shows |
| --- | --- | --- | --- |
| `bench-solder.webp` | 4:5 | `IMG_0404.heic` | Fitted HDMI port, close up |
| `bench-hdmi.webp` | 4:5 | `IMG_1633.jpg` | HDMI port on a console board |
| `bench-stick.webp` | 4:5 | `IMG_1158.HEIC` | Switch charge port board |
| `bench-wide.webp` | 3:2 | `IMG_0810.jpeg` | Console board on the bench |
| `bench-test.webp` | 3:2 | `IMG_1021.heic` | Damaged HDMI port |

Keep the `-sm.webp` versions for phones, and update the `alt` text and any caption when you change a photo. There is no soldering or laptop photo in the set, so the computers section uses the generic bench shot.

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
FROM_EMAIL = "FastFixIt Electronics <website@fastfixitelectronics.com>"
SHOP_ADDRESS = ""
```

`SITE_ORIGIN` must match the browser origin exactly: scheme + host, no path, no trailing slash. Leave `SHOP_ADDRESS` empty while there is no storefront; the mail-in reply then says the shipping address follows in the shop's own reply.

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

### 5. Resend email notifications

Resend is live. `fastfixitelectronics.com` is the verified sending domain (DKIM at `resend._domainkey`, return path on `send.fastfixitelectronics.com`), and the API key is stored as the Worker secret `RESEND_API_KEY`.

Sending from `website@fastfixitelectronics.com` keeps the shop notification and the customer auto-reply out of the `repairs@` mailbox's own sent folder. Replies go to `TO_EMAIL` because the Worker sets `reply_to`.

If you ever rotate the key:

```powershell
npx wrangler secret put RESEND_API_KEY
npx wrangler deploy
```

If email is not configured, the form still stores requests and the request inbox is the notification.

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
| `FROM_EMAIL` | no | Verified Resend sender on the verified domain |
| `SITE_ORIGIN` | no | Allowed browser origins, comma-separated |
| `SHOP_ADDRESS` | no | Included in mail-in replies when set |
| `TURNSTILE_SECRET` | yes | Verifies the spam token; optional |
| `ADMIN_TOKEN` | yes | Protects the request inbox and admin API |
| `TRACKER_URL` | no | RepairTrackerV2 origin for the intake API; leave empty to disable ticketing |
| `TRACKER_PUBLIC_URL` | no | Public origin used in customer links (defaults to `TRACKER_URL`) |
| `TRACKER_AUTO_CREATE` | no | `0` pauses automatic ticket creation at deploy time |
| `TRACKER_INTAKE_TOKEN` | yes | Bearer token for the tracker's `/api/intake` |
| `DB` | binding | D1 request storage; optional but recommended |

---

## RepairTrackerV2 tickets and payments

The request inbox can create a ticket in **RepairTrackerV2** automatically, then
link staff and customers to the tracker's own status portal and Stripe payment
page. The website never stores card data.

### What happens on submit

1. The request is stored in D1 as before.
2. The Worker posts it to `POST <TRACKER_URL>/api/intake` with the shared token.
3. The tracker matches the customer by email (or creates one), creates the
   device, and opens a ticket on the first workflow status ("Received").
4. D1 records `tracker_ticket_number`, `tracker_ticket_id`,
   `tracker_public_token`, `tracker_status` and `tracker_synced_at`.
5. The customer auto-reply includes `…/track/<publicToken>`, where they can
   watch the status, approve a quote, and pay an invoice.

If the tracker is unreachable, the request still saves, the inbox shows the
error, and **Create ticket** retries. The **Auto-create tickets** switch in the
inbox pauses automatic syncing without a deploy.

### Enable it

1. Deploy RepairTrackerV2 (see its `docs/DEPLOY.md`) and set
   `INTAKE_API_TOKEN` plus `INTAKE_ORG_ID` in its `.env`.
2. Put the same token in `worker/.dev.vars` locally and in the Worker secret:

   ```powershell
   npx wrangler secret put TRACKER_INTAKE_TOKEN
   ```

3. Uncomment `TRACKER_URL` and `TRACKER_PUBLIC_URL` in `worker/wrangler.toml`
   and deploy:

   ```powershell
   npx wrangler deploy
   ```

4. Confirm `https://api.fastfixitelectronics.com/health` returns `"tracker":true`.

The tracker expects a public HTTPS origin reachable from Cloudflare. It does not
need to be reachable from the open internet if you put Cloudflare Access in
front, but the Worker must be allowed through.

### The shop server

Deployment and operations notes for the tracker live in the private
RepairTrackerV2 repository (`docs/FFI-SERVER.md`), not here. This public
repository should not carry server addresses, filesystem paths, or credential
file names.

### Database migration

The tracker columns and the settings table are in
`worker/migrations/002-tracker.sql`; the lead-source columns are in
`worker/migrations/003-source.sql`:

```powershell
npx wrangler d1 execute fastfixit-requests --remote --file=migrations/002-tracker.sql
npx wrangler d1 execute fastfixit-requests --remote --file=migrations/003-source.sql
```

The request form asks **How did you hear about us?** and stores it in `source`.
UTM parameters, Google click IDs, and the referring host are stored in
`source_detail`. Both appear in the shop email and the admin request card. Fresh
installs get the same columns from `schema.sql`.

### Invoices and payment

Invoices and Stripe Checkout live entirely in RepairTrackerV2. Once an invoice
exists, the customer sees **View and pay invoice** in their `/track/<token>`
page. The shop can also send the invoice's own `/pay/<payToken>` link from the
tracker. Stripe needs `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` on the
tracker, with `APP_URL` set to its public origin.

---

## How to edit the content

### Services and estimator

- **`assets/js/data.js`** — the device/fault tree, check text, turnaround and starting price. `diagnostic: 0` renders as Free.
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

### Sitemap, structured data and analytics

`sitemap.xml` and `robots.txt` are at the repository root. Submit
`https://fastfixitelectronics.com/sitemap.xml` in Google Search Console and Bing
Webmaster Tools after deployment.

`index.html` and the two local landing pages carry static JSON-LD:
`LocalBusiness`, `Service`, `FAQPage`, and `BreadcrumbList`. The business schema
uses Kinston and the surrounding towns as `areaServed`, with no street address.
Keep the prices and area list in sync with the visible copy.

For privacy-friendly analytics, enable **Cloudflare Web Analytics** for the site
and paste the beacon token into `cloudflareAnalyticsToken` in `config.js`.
`site.js` loads the beacon only when that value is set. Do not also enable the
automatic Cloudflare injection for the same host, or pageviews will double-count.

### Review cards

Create the Google Business Profile, copy its review link, and paste it into
`reviewUrl` in `config.js`. Open `review.html`, print on card stock at 3.5 × 2 in,
and put one in every return bag. Until `reviewUrl` is set, the page shows a setup
note instead of a QR code. The page is `noindex`.

---

## Email

Inbound mail is handled by **Cloudflare Email Routing** for
`fastfixitelectronics.com`:

- `repairs@fastfixitelectronics.com` and `website@fastfixitelectronics.com`
  forward to `mtlewis1127@gmail.com`.
- `consolefix.nc@gmail.com` is a verified Cloudflare destination. Cloudflare
  allows one destination per address, so copying to that inbox needs a Gmail
  filter/forward after Google finishes its forwarding verification.
- Resend's inbound MX record was removed. Cloudflare's MX, SPF and DKIM records
  are in place; Resend still sends the site's outbound mail through its `send.`
  subdomain and DKIM record.

Outbound replies use Gmail's **Send mail as** for
`repairs@fastfixitelectronics.com` through:

```text
Server: smtp.resend.com
Port:   587 (TLS)
User:   resend
Pass:   Resend API key scoped to fastfixitelectronics.com
```

Do not enable Resend receiving on the root domain while Cloudflare Email
Routing is active.

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

- [x] Fill `assets/js/config.js` (phone, email, city, hours, site URL). No street address; there is no storefront.
- [x] Set `formEndpoint` to the deployed Worker.
- [x] Set the three published prices in `assets/js/data.js` and `services.html`.
- [ ] Confirm free diagnosis, 90-day warranty, turnaround and test promises.
- [ ] Confirm the mail-in return-shipping policy and whether `SHOP_ADDRESS` should stay empty.
- [ ] Remove any service you don't offer and confirm the equipment list.
- [x] Replace the five AI photos with real shop photos and update alt text.
- [ ] Read and adjust `privacy.html`.
- [x] Create D1, deploy the Worker, run the schema.
- [x] Set `ADMIN_TOKEN`, then bookmark `admin.html` and test it.
- [x] Set Resend and test the sending path.
- [x] Set Turnstile site key and secret.
- [x] Add the Cloudflare DNS records and set the GitHub Pages custom domain.
- [x] Turn on Enforce HTTPS.
- [ ] Check every page at 390, 768 and 1440 px in light and dark.
- [ ] Check the 404 page, privacy link, mail-in links and footer.
- [ ] Submit a real drop-off request and a real mail-in request.

---

## Credits

- Logo: supplied by FastFixIt Electronics.
- Typeface: [Archivo](https://github.com/Omnibus-Type/Archivo), SIL Open Font License 1.1.
- Photography: the shop's own photos, cropped from `photos/`.
- Built as a static site with a Cloudflare Worker, D1, Resend and Turnstile. No framework, no analytics.