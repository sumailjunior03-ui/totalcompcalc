"use strict";

/* ─────────────────────────────────────────
   FOOTER.JS — Framework footer renderer
   Requires: network.js (window.CALC_HQ_NETWORK)
   Renders the Related Tools cluster into #network-links
   Excludes current domain and forbidden domains
   Hub link (calc-hq.com) is in HTML, outside this cluster
───────────────────────────────────────── */

(function () {
  var FORBIDDEN = [];

  /* Load forbidden-domains.json asynchronously; render footer either way */
  function loadForbiddenThenRender() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/forbidden-domains.json", true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            var parsed = JSON.parse(xhr.responseText);
            if (Array.isArray(parsed)) {
              FORBIDDEN = parsed.map(function (d) { return d.toLowerCase().replace(/^www\./, ""); });
            }
          } catch (e) { /* proceed with empty list */ }
        }
        renderNetworkFooter();
      }
    };
    xhr.onerror = function () { renderNetworkFooter(); };
    xhr.send();
  }

  function normalizeHost(str) {
    try {
      return new URL(str).hostname.replace(/^www\./, "").toLowerCase();
    } catch (e) {
      return String(str).toLowerCase().replace(/^www\./, "");
    }
  }

  function renderNetworkFooter() {
    var container = document.getElementById("network-links");
    if (!container || !window.CALC_HQ_NETWORK) return;

    var currentHost = window.location.hostname.replace(/^www\./, "").toLowerCase();

    var links = window.CALC_HQ_NETWORK.filter(function (site) {
      if (!site || site.live !== true) return false;
      var host = normalizeHost(site.url);
      /* Exclude current site */
      if (host === currentHost) return false;
      /* Exclude hub link — rendered separately in HTML outside this cluster */
      if (host === "calc-hq.com") return false;
      /* Exclude forbidden domains */
      if (FORBIDDEN.indexOf(host) !== -1) return false;
      return true;
    });

    container.innerHTML = "";
    links.forEach(function (site) {
      var a = document.createElement("a");
      a.href = site.url;
      a.textContent = site.label;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      container.appendChild(a);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    loadForbiddenThenRender();
  });

})();
