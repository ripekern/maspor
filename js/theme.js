(function () {
  document.addEventListener("DOMContentLoaded", function () {
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
