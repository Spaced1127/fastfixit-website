# FastFixIt Electronics

A static website for FastFixIt Electronics, LLC: game console and electronics repair. It is built to be hosted on **GitHub Pages**, with the domain served by **Cloudflare** and the repair request form handled by a small **Cloudflare Worker** that sends email through **Resend**.

No build step. Upload the files and the site runs.

---

## What is here

| Page | File | What it does |
| --- | --- | --- |
| Home | `index.html` | Hero, live bench estimate, services index, process, test standards, shop, FAQ, contact |
| Services | `services.html` | Rate card, console / controller / computer / board-level detail, scope, warranty |
| About | `about.html` | The shop, how it works, equipment, photographs |
| Start a repair | `request.html` | The repair intake form with validation, photo attachments and a success state |
| Privacy | `privacy.html` | Plain-language privacy note for the form |
| 404 | `404.html` | Not-found page |

The design direction is **the work order**: warm newsprint, ink and brass, one typeface, document-like tables and a printed process slip. No stock icons, no gradients, no invented reviews.

---

## Read this before publishing

The site is finished, but it is addressed to **your** business. These are the things to replace or confirm.

### 1. Contact details and city

Edit **`assets/js/config.js`**. Every page reads from it.

```js
phone: "(512) 555-0142",
email: "repairs@fastfixit.com",
street: "123 Example Ave",
city: "Austin",
region: "TX",
postal: "78701",
country: "US",
hours: "Mon–Fri 10–6, Sat 10–2",
mapUrl: "",
formEndpoint: "https://api.fastfixit.com/repair-request",
turnstileSiteKey: "",
siteUrl: "https://fastfixit.com"
```

If a value is left empty, the page shows a bracket placeholder such as `[PHONE]` or `[CITY]`. Those are deliberate so nothing fake is published as real.

`mapUrl` adds a small "Directions" link under the address on the home page. `country` is used in the structured data; change it if you are not in the US.

### 2. Prices and policies

- **Starting prices** for the estimator live in **`assets/js/data.js`**. The `diagnostic` value and each fault's `from` value are sample numbers. Change them.
- The **rate card** on `services.html` is static HTML. Keep it in sync with `data.js` before launch.
- The service lists are deliberately broad. Remove anything you don't actually take on (phones, TVs, turntables, mail-in), and confirm the equipment list on `about.html` matches your bench.
- The following promises are also static and should be confirmed by you:
  - 24–48 hour diagnosis
  - 2–5 day typical repair
  - 90-day workmanship warranty
  - $45 bench diagnostic, credited on approval
  - 24-hour soak test
  - "written quote before work"
  - one bench, one technician
  - local drop-off or post
- If a number changes, search the HTML for it. `$45` is rendered from `data.js` wherever `<span data-diagnostic>` appears.

### 3. Photographs

The five photographs in `assets/img/` are **AI-generated placeholders**, not photographs of your shop. Replace them with real photos of your bench, your tools and your work as soon as you can. The design will only get stronger.

Recommended replacements:

| File | Crop | Use |
| --- | --- | --- |
| `bench-solder.webp` | 4:5 | Hero crossfade |
| `bench-hdmi.webp` | 4:5 | Hero crossfade, services |
| `bench-stick.webp` | 4:5 | Hero crossfade, services, about |
| `bench-wide.webp` | 3:2 | Home shop section, About |
| `bench-test.webp` | 3:2 | Standards, services, About |

Keep the `-sm.webp` versions for phones, or regenerate them. The generated placeholders exist only as WebP; replace them with your own photos at the same paths. Update the `alt` text when you change a photo.

### 4. Privacy note

`privacy.html` describes the form as built (email through Cloudflare and Resend, no analytics). Read it, adjust the retention period and the shop details, and have it checked if you want legal certainty. It is not legal advice.

### 5. Reviews

There are no testimonials, star ratings, customer logos or invented statistics on this site. If you want social proof, add real Google reviews or a link to your listing. Do not fill the gap with made-up quotes.

---

## Run it locally

Any static server works. From this folder:

```powershell
npx serve .
```

Or, with Python:

```powershell
python -m http.server 3000
```

Open `http://localhost:3000`.

Without a form endpoint configured, the form falls back to opening the visitor's email app, as long as the shop email is filled in `assets/js/config.js`. To test the real form, run the Worker locally (below) and set:

```js
formEndpoint: "http://localhost:8787/repair-request"
```

The page can also be opened directly from disk, but the form's relative paths and email fallback behave better through a server.

---

## Deploy the site to GitHub Pages

### 1. Create the repository

Create a new repository at <https://github.com/new>. Name it `fastfixit-website` (or anything you like). Do not add a README, `.gitignore` or licence; this folder already has them.

This folder is already a git repository with an initial commit on `main`. Add the remote and push:

```powershell
git remote add origin https://github.com/YOUR-USERNAME/fastfixit-website.git
git push -u origin main
```

If you copied only the site files and do not have the `.git` folder, initialise first:

```powershell
git init -b main
git add .
git commit -m "FastFixIt website"
git remote add origin https://github.com/YOUR-USERNAME/fastfixit-website.git
git push -u origin main
```

### 2. Turn on Pages

In the repository: **Settings → Pages**

- **Source:** Deploy from a branch
- **Branch:** `main`
- **Folder:** `/ (root)`
- Save

GitHub gives you a `https://YOUR-USERNAME.github.io/fastfixit-website/` preview in a minute or two.

### 3. Connect the domain in Cloudflare

In the repository: **Settings → Pages → Custom domain**, enter your apex domain (for example `fastfixit.com`) and save. GitHub will create a `CNAME` file in the repo and check DNS.

In the **Cloudflare dashboard → your domain → DNS**, create:

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
| CNAME | `www` | `YOUR-USERNAME.github.io` | DNS only |

Remove any old `A`, `AAAA` or `CNAME` records for `@` and `www` first.

Leave the proxy status on **DNS only** (grey cloud) while GitHub issues the certificate. It is the reliable path. Once the certificate is active and **Enforce HTTPS** is available, turn that on in GitHub Pages. If you later want Cloudflare's proxy, set SSL/TLS mode to **Full (strict)** and test; some GitHub Pages + proxy combinations are more trouble than they are worth for a five-page site.

Do not edit the `CNAME` file by hand in normal use. GitHub manages it when you set the custom domain. If you prefer to start from the template, copy `CNAME.example` to `CNAME` and replace the domain.

The initial certificate can take up to 24 hours. If GitHub reports a DNS error, re-check that the records are unproxied and that `www` points at `YOUR-USERNAME.github.io`, not at the repository path.

---

## Deploy the repair form Worker

GitHub Pages cannot receive a POST. The form sends JSON to a Cloudflare Worker. The Worker verifies the spam token, validates the request, emails the shop through Resend, and sends the customer a confirmation. It is on the free Workers plan for this volume.

### 1. Verify a sending domain in Resend

1. Create an account at <https://resend.com>.
2. **Domains → Add domain**, enter your domain, and add the DNS records Resend shows (DKIM and SPF). If Cloudflare is your DNS host, these are normal TXT/MX records; keep them **DNS only**.
3. Wait for **Verified**.
4. **API Keys → Create API key**, sending access only. Copy it once.

The `FROM_EMAIL` in the Worker must be on the verified domain. `TO_EMAIL` can be any inbox you read, including a Gmail address.

### 2. Configure and deploy

```powershell
cd worker
npx wrangler login
npx wrangler deploy
```

Set the real values in `worker/wrangler.toml` first:

```toml
[vars]
SITE_ORIGIN = "https://YOUR-DOMAIN.com,https://www.YOUR-DOMAIN.com"
TO_EMAIL = "repairs@YOUR-DOMAIN.com"
FROM_EMAIL = "FastFixIt Repairs <repairs@YOUR-DOMAIN.com>"
```

`SITE_ORIGIN` is the exact origin the browser sends: scheme + host, no path, no trailing slash. Include `www` if you use it. For local testing, include `http://localhost:3000`.

Add the two secrets:

```powershell
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put TURNSTILE_SECRET
```

The first deploy gives you a `https://fastfixit-repairs.YOUR-SUBDOMAIN.workers.dev` URL. You can use that as the form endpoint while testing.

### 3. Add a custom domain for the Worker

In **Cloudflare dashboard → Workers & Pages → fastfixit-repairs → Settings → Domains & Routes → Add custom domain**, enter `api.YOUR-DOMAIN.com`.

That creates a proxied DNS record. Do not point the site domain at the Worker; only `api` needs it.

Alternatively, uncomment the `[[routes]]` block in `wrangler.toml` and redeploy.

### 4. Point the site at the Worker

In `assets/js/config.js`:

```js
formEndpoint: "https://api.YOUR-DOMAIN.com/repair-request"
```

Also set `turnstileSiteKey` (below). Commit and push.

### 5. Turnstile (spam protection)

1. **Cloudflare dashboard → Turnstile → Add site**.
2. Add your domain. Widget mode: Managed.
3. Copy the **site key** into `assets/js/config.js` as `turnstileSiteKey`.
4. Copy the **secret key** into the Worker with `npx wrangler secret put TURNSTILE_SECRET`.

The widget only appears when a site key is set. If the secret is set on the Worker, a missing token is rejected. Set both or neither.

### 6. Test it

- Submit a request with a real email address and a real photo.
- Confirm the shop inbox receives it with the photo attached.
- Confirm the customer inbox receives the auto-reply; reply to that email to check it reaches the shop.
- Submit with the spam field filled (use browser dev tools) and confirm nothing is sent.
- Submit with a fast timer and confirm nothing is sent.
- Check the reference number (`FF-YYMMDD-XXXX`) appears on both emails.

### 7. Optional rate limit

In **Cloudflare → Security → WAF → Rate limiting rules**, add a rule for host `api.YOUR-DOMAIN.com`, path `/repair-request`, 10 requests per minute per IP, block for 10 minutes. The free plan includes one rule. Turnstile is the primary protection; this is a second layer.

### Worker environment reference

| Variable | Secret? | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | yes | Sends both emails |
| `TO_EMAIL` | no | Shop inbox (comma-separated allowed) |
| `FROM_EMAIL` | no | Verified Resend sender |
| `SITE_ORIGIN` | no | Allowed browser origins, comma-separated |
| `TURNSTILE_SECRET` | yes | Verifies the spam token; optional |

For local Worker development:

```powershell
cd worker
Copy-Item .dev.vars.example .dev.vars
# edit .dev.vars with a real Resend key and a test recipient
npx wrangler dev
```

The Worker listens on `http://localhost:8787`. Set the site's `formEndpoint` to `http://localhost:8787/repair-request` and add `http://localhost:3000` to `SITE_ORIGIN`.

---

## How to edit the content

### Services and estimator

- **`assets/js/data.js`** — the device/fault tree, the check text, turnaround and starting labour. The home estimator and the request form prefill both read this file.
- **`services.html`** — the visible rate card and service descriptions. Keep the numbers consistent with `data.js`.
- **`index.html`** — the home services index and process slip.

### Contact details

- **`assets/js/config.js`** — one file for all pages. Elements with `data-contact="phone"`, `email`, `city`, `address-line1`, `address-line2` and `hours` are filled from it.
- If you leave a value empty, the placeholder remains visible.
- The structured data (`ElectronicsStore`) is only injected when `siteUrl`, `phone`, `street` and `city` are real.

### Photos

Replace a `.webp` at the same path and keep the same aspect ratio. Update `alt` text and, if the crop changes, the `width`/`height` attributes. The site uses WebP; browsers since 2020 support it.

### Fonts

Archivo is self-hosted in `assets/fonts/archivo-var.woff2` under the SIL Open Font License. The licence is in `assets/fonts/OFL.txt`.

### 404

GitHub Pages serves `404.html` automatically for missing paths on the custom domain. If you use a project path (`username.github.io/repo/`), it works there too.

### Sitemap and social preview

There is no `sitemap.xml` because the domain was not known when the site was built. After the domain is live, you can add one, or submit the site directly in Google Search Console. Add an Open Graph image once you have a real photo:

```html
<meta property="og:image" content="https://YOUR-DOMAIN.com/assets/img/bench-wide.webp">
```

The spec wants an absolute URL, so do this after the domain is live.

---

## Design notes

- **One typeface:** Archivo, self-hosted, weights 100–900 from one variable file.
- **Palette:** newsprint `#e8e5de`, ink `#161512`, brass `#c9a227`. Brass is used for actions, list marks and the work-order foot.
- **The idea:** the repair work order, printed and followed. The process is a slip; the estimate is a ticket; the test pass is a table; the services are an index.
- **The live thing:** the bench estimate. It uses real service content, updates the ticket, and hands a prefilled request to the form.
- **Motion:** a slow hero crossfade between three bench details, staggered section entrances, control feedback. All content is visible with JavaScript off; the estimator and form have plain fallbacks.
- **Accessibility:** skip link, keyboard-operable estimator and menu, visible focus, labelled fields, error summary and inline errors, `aria-live` status, reduced-motion support, 4.5:1 text contrast.
- **No fake proof:** no invented reviews, customer logos, staff names or statistics. The About page is written as the shop's approach, not a fabricated history.

---

## File tree

```text
.
├── index.html
├── services.html
├── about.html
├── request.html
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
│   ├── css/site.css
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
│       └── form.js
└── worker
    ├── src/index.js
    ├── wrangler.toml
    └── .dev.vars.example
```

---

## Launch checklist

- [ ] Fill `assets/js/config.js` (phone, email, address, city, hours, site URL).
- [ ] Add a `mapUrl` if you want the "Directions" link, and set `country` if you are outside the US.
- [ ] Set your own starting prices in `assets/js/data.js` and `services.html`.
- [ ] Confirm the warranty, turnaround, diagnostic fee and test promises.
- [ ] Remove any service you don't offer and confirm the equipment list on `about.html`.
- [ ] Replace the five AI photographs with real shop photos and update alt text.
- [ ] Read and adjust `privacy.html`; add your legal entity details if needed.
- [ ] Deploy the Worker, verify Resend, set `formEndpoint`.
- [ ] Turn on Turnstile and set both keys.
- [ ] Submit a real test request with a photo; check both emails and spam folders.
- [ ] Set the custom domain in GitHub Pages and the Cloudflare DNS records.
- [ ] Turn on Enforce HTTPS.
- [ ] Check every page at 390 px, 768 px and 1440 px.
- [ ] Check the 404 page, the privacy link and the footer links.
- [ ] Remove the `[YOUR-DOMAIN]` values from `wrangler.toml` and `CNAME.example` if you don't want them in the repo.

---

## Credits

- Logo: supplied by FastFixIt Electronics.
- Typeface: [Archivo](https://github.com/Omnibus-Type/Archivo), SIL Open Font License 1.1.
- Photography: generated placeholder images, not the client's own work. Replace before launch.
- Built as a static site. No framework, no analytics, no third-party JavaScript except the optional Cloudflare Turnstile widget.