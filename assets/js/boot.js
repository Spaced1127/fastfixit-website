(function () {
  document.documentElement.classList.add("js");
  try {
    var saved = localStorage.getItem("ffi-theme");
    var theme =
      saved === "dark" || saved === "light"
        ? saved
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0f1114" : "#f4f1ea");
  } catch (error) {
    /* Storage can be unavailable; the page still uses the light theme. */
  }
})();