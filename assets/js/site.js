/* FastFixIt Electronics — shared page behaviour */
(function () {
  "use strict";

  var config = window.FFI_CONFIG || {};
  var $ = function (selector, root) {
    return (root || document).querySelector(selector);
  };
  var $$ = function (selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  };

  function isPlaceholder(value) {
    return !value || String(value).indexOf("[") !== -1;
  }

  function digits(value) {
    return String(value).replace(/[^\d+]/g, "");
  }

  /* ------------------------------------------------------------
     Contact details from one config file
     ------------------------------------------------------------ */
  function contactValues() {
    var cityLine = [config.city, config.region].filter(Boolean).join(", ");
    var cityFull = [cityLine, config.postal].filter(Boolean).join(" ");
    var streetLine = [config.street, cityFull].filter(Boolean).join(", ");
    return {
      phone: config.phone,
      email: config.email,
      hours: config.hours,
      street: config.street,
      city: config.city,
      "city-line": cityFull,
      address: streetLine,
      "address-line1": config.street,
      "address-line2": cityFull
    };
  }

  function applyContactDetails() {
    var values = contactValues();
    $$("[data-contact]").forEach(function (el) {
      var key = el.getAttribute("data-contact");
      var value = values[key];
      if (!value || isPlaceholder(value)) {
        el.classList.add("is-placeholder");
        el.setAttribute("title", "Add this in assets/js/config.js");
        if (el.tagName === "A") el.removeAttribute("href");
        return;
      }
      el.classList.remove("is-placeholder");
      el.removeAttribute("title");
      el.textContent = value;

      if (el.tagName === "A") {
        if (key === "phone") {
          el.href = "tel:" + digits(value);
        } else if (key === "email") {
          el.href = "mailto:" + value;
        }
      }
    });

    $$("[data-map]").forEach(function (el) {
      if (config.mapUrl && !isPlaceholder(config.mapUrl)) {
        el.href = config.mapUrl;
        el.hidden = false;
      } else {
        el.hidden = true;
      }
    });

    if (config.hours && !isPlaceholder(config.hours)) {
      $$("[data-hours-block]").forEach(function (el) {
        el.hidden = false;
      });
    }
  }

  /* ------------------------------------------------------------
     Mobile navigation
     ------------------------------------------------------------ */
  function initNav() {
    var toggle = $("[data-nav-toggle]");
    var nav = $("#site-nav");
    if (!toggle || !nav) return;

    function close() {
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "Menu";
      nav.classList.remove("is-open");
      document.body.classList.remove("nav-open");
    }

    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      if (open) {
        close();
      } else {
        toggle.setAttribute("aria-expanded", "true");
        toggle.textContent = "Close";
        nav.classList.add("is-open");
        document.body.classList.add("nav-open");
      }
    });

    $$("a", nav).forEach(function (link) {
      link.addEventListener("click", close);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        close();
        toggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) close();
    });
  }

  /* ------------------------------------------------------------
     Section entrances
     ------------------------------------------------------------ */
  function initReveals() {
    var items = $$("[data-reveal]");
    if (!items.length) return;

    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("is-in");
      });
      return;
    }

    items.forEach(function (el) {
      var parent = el.parentElement;
      if (!parent) return;
      var siblings = $$("[data-reveal]", parent);
      var index = siblings.indexOf(el);
      el.style.setProperty("--reveal-delay", Math.min(index, 5) * 70 + "ms");
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    items.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ------------------------------------------------------------
     Hero image crossfade
     ------------------------------------------------------------ */
  function initCrossfade() {
    var stage = $("[data-crossfade]");
    if (!stage) return;
    var slides = $$("img", stage);
    if (slides.length < 2) return;

    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === 0);
      });
      return;
    }

    var current = 0;
    slides.forEach(function (slide, i) {
      slide.classList.toggle("is-active", i === 0);
    });

    window.setInterval(function () {
      if (document.hidden) return;
      slides[current].classList.remove("is-active");
      current = (current + 1) % slides.length;
      slides[current].classList.add("is-active");
    }, 6500);
  }

  /* ------------------------------------------------------------
     Year and structured data
     ------------------------------------------------------------ */
  function initYear() {
    $$("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  function initDiagnosticFee() {
    if (!window.FFI_DATA || window.FFI_DATA.diagnostic == null) return;
    $$("[data-diagnostic]").forEach(function (el) {
      el.textContent = "$" + window.FFI_DATA.diagnostic;
    });
  }

  function initStructuredData() {
    if (!config.siteUrl || isPlaceholder(config.siteUrl)) return;
    if (isPlaceholder(config.phone) || isPlaceholder(config.street) || isPlaceholder(config.city)) return;

    var payload = {
      "@context": "https://schema.org",
      "@type": "ElectronicsStore",
      name: "FastFixIt Electronics, LLC",
      url: config.siteUrl,
      image: config.siteUrl.replace(/\/$/, "") + "/assets/img/bench-wide.webp",
      telephone: config.phone,
      priceRange: "$$",
      address: {
        "@type": "PostalAddress",
        streetAddress: config.street,
        addressLocality: config.city,
        addressRegion: config.region || undefined,
        postalCode: config.postal || undefined,
        addressCountry: config.country || "US"
      }
    };

    if (config.hours && !isPlaceholder(config.hours)) {
      payload.openingHours = config.hours;
    }

    var script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(payload);
    document.head.appendChild(script);
  }

  /* ------------------------------------------------------------ */
  function init() {
    applyContactDetails();
    initNav();
    initReveals();
    initCrossfade();
    initYear();
    initDiagnosticFee();
    initStructuredData();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();