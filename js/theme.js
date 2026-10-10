(function () {
  var root = document.documentElement;
  var KEY = "coa-theme";

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function current() {
    var s = stored();
    return (s === "dark" || s === "light") ? s : "light";
  }

  function updateButton() {
    var btn = document.querySelector("[data-theme-toggle]");
    if (!btn) return;
    var resolved = current();
    var next = resolved === "dark" ? "light" : "dark";
    btn.setAttribute("aria-label", "Switch to " + next + " mode");
    btn.setAttribute("title", "Switch to " + next + " mode");
    btn.setAttribute("aria-pressed", resolved === "dark" ? "true" : "false");
  }

  function apply(theme) {
    root.setAttribute("data-theme", theme);
    updateButton();
  }

  apply(current());

  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.querySelector("[data-theme-toggle]");
    if (!btn) return;
    updateButton();
    btn.addEventListener("click", function () {
      var next = current() === "dark" ? "light" : "dark";
      try { localStorage.setItem(KEY, next); } catch (e) {}
      apply(next);
    });
  });
})();
