/**
 * Sovereign AI — Embeddable compliance badge
 * Usage: <script src="https://your-domain.com/embed.js" data-model="llama-3.1" data-jurisdiction="EU"></script>
 */
(function () {
  var script = document.currentScript;
  var model = script && script.getAttribute("data-model");
  var jurisdiction = (script && script.getAttribute("data-jurisdiction")) || "EU";
  var base = (script && script.src.replace(/\/embed\.js.*$/, "")) || "";

  if (!model) return;

  fetch(base + "/api/models/" + encodeURIComponent(model))
    .then(function (r) {
      return r.json();
    })
    .then(function (data) {
      if (data.error) return;
      var status = data.compliance && data.compliance[jurisdiction];
      var label = status && status.toLowerCase().includes("compliant") ? "Compliant" : "Check";
      var color = status && status.toLowerCase().includes("compliant") ? "#22c55e" : "#f59e0b";
      var badge = document.createElement("a");
      badge.href = base + "/?q=" + encodeURIComponent(model);
      badge.target = "_blank";
      badge.rel = "noopener noreferrer";
      badge.style.cssText =
        "display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:500;text-decoration:none;color:#fff;background:" +
        color;
      badge.innerHTML =
        '<span>Sovereign AI</span><span>' + label + " (" + jurisdiction + ")</span>";
      script.parentNode.insertBefore(badge, script.nextSibling);
    })
    .catch(function () {});
})();
