/* ------------------------------------------------------------------
   FastFixIt Electronics — site settings
   ------------------------------------------------------------------
   This is the one file to edit for contact details. Leave a value
   empty and the page shows a clearly marked placeholder instead.
   ------------------------------------------------------------------ */

window.FFI_CONFIG = {
  // Contact details. Examples:
  //   phone: "(512) 555-0142"
  //   email: "repairs@fastfixit.com"
  phone: "",
  email: "",

  // Shop address. `city` is also used in body copy around the site.
  street: "",
  city: "",
  region: "",
  postal: "",
  country: "US",

  // Opening hours, as one line. e.g. "Mon–Fri 10–6, Sat 10–2"
  hours: "",

  // Optional link to a map listing (Google, Apple, OpenStreetMap).
  mapUrl: "",

  // The deployed Cloudflare Worker endpoint, e.g.
  //   "https://api.fastfixit.com/repair-request"
  // Leave empty to make the form fall back to the visitor's email app.
  formEndpoint: "https://api.fastfixitelectronics.com/repair-request",

  // Cloudflare Turnstile site key (public). Leave empty to hide the widget.
  turnstileSiteKey: "0x4AAAAAAGIeVmCJ8hgSB8JN",

  // Canonical site URL, e.g. "https://fastfixit.com". Used for structured data.
  siteUrl: "https://fastfixitelectronics.com"
};