/* ------------------------------------------------------------------
   FastFixIt Electronics: site settings
   ------------------------------------------------------------------
   This is the one file to edit for contact details. Leave a value
   empty and the page shows a clearly marked placeholder instead.

   There is no storefront, so there is no street address here. The
   site shows the city and state only.
   ------------------------------------------------------------------ */

window.FFI_CONFIG = {
  // Contact details.
  phone: "252-320-1212",
  email: "repairs@fastfixitelectronics.com",

  // Location. `city` is also used in body copy around the site.
  city: "Kinston",
  region: "NC",
  country: "US",

  // Opening hours, as one line.
  hours: "Mon-Sat 9AM-7PM",

  // The deployed Cloudflare Worker endpoint.
  // Leave empty to make the form fall back to the visitor's email app.
  formEndpoint: "https://api.fastfixitelectronics.com/repair-request",

  // Cloudflare Turnstile site key (public). Leave empty to hide the widget.
  turnstileSiteKey: "0x4AAAAAAGIeVmCJ8hgSB8JN",

  // Canonical site URL. Used for structured data.
  siteUrl: "https://fastfixitelectronics.com",

  // RepairTrackerV2. The inbox links tickets and customer status pages here.
  trackerUrl: "https://tracker.fastfixitelectronics.com"
};