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
    if (btn) {
      updateButton();
      btn.addEventListener("click", function () {
        var next = current() === "dark" ? "light" : "dark";
        try { localStorage.setItem(KEY, next); } catch (e) {}
        apply(next);
      });
    }

    document.querySelectorAll("[data-copy-btn]").forEach(function (b) {
      b.addEventListener("click", function () {
        var field = document.querySelector('[data-copy="' + b.dataset.copyBtn + '"]');
        if (!field) return;
        var text = field.dataset.copy;
        var done = function () {
          var label = b.textContent;
          b.textContent = "Copied";
          setTimeout(function () { b.textContent = label; }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () {});
        } else {
          var r = document.createRange();
          r.selectNodeContents(field);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(r);
          done();
        }
      });
    });

    var form = document.querySelector("[data-apply-form]");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var data = new FormData(form);
        var subject = "Registration for Maspor";
        var body =
          "Name: " + (data.get("name") || "") + "\n" +
          "Email: " + (data.get("email") || "") + "\n\n" +
          (data.get("message") || "");
        window.location.href =
          "mailto:apply@maspor.org?subject=" + encodeURIComponent(subject) +
          "&body=" + encodeURIComponent(body);
      });
    }
  });
})();
