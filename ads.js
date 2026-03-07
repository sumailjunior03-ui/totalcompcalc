(function () {
  "use strict";

  function collapseSlot(el) {
    el.classList.add("is-off");
    el.classList.remove("is-on");
  }

  function tryRenderAds() {
    var cfg = window.SITE_CONFIG;
    if (!cfg) return;

    /* ── Sponsor bar ── */
    var sponsorBar = document.getElementById("sponsor-bar");
    if (sponsorBar) {
      if (cfg.SPONSOR_ACTIVE && cfg.SPONSOR_TEXT && cfg.SPONSOR_HREF) {
        var link = sponsorBar.querySelector("a");
        if (link) {
          link.href = cfg.SPONSOR_HREF;
          link.textContent = cfg.SPONSOR_TEXT;
        }
        sponsorBar.classList.remove("is-off");
        sponsorBar.classList.add("is-on");
      } else {
        collapseSlot(sponsorBar);
      }
    }

    /* ── AdSense slots ── */
    var slotTop    = document.getElementById("ad-slot-top");
    var slotBottom = document.getElementById("ad-slot-bottom");
    var adsReady   = cfg.ADS_ACTIVE && cfg.AD_SLOT_TOP && cfg.AD_SLOT_BOTTOM;

    [
      { el: slotTop,    slotId: cfg.AD_SLOT_TOP },
      { el: slotBottom, slotId: cfg.AD_SLOT_BOTTOM }
    ].forEach(function (item) {
      if (!item.el) return;
      if (!adsReady || !item.slotId) {
        collapseSlot(item.el);
        return;
      }

      var ins = document.createElement("ins");
      ins.className = "adsbygoogle";
      ins.setAttribute("data-ad-client", cfg.ADSENSE_PUB_ID);
      ins.setAttribute("data-ad-slot", item.slotId);
      ins.setAttribute("data-ad-format", "auto");
      ins.setAttribute("data-full-width-responsive", "true");
      item.el.appendChild(ins);

      try { (adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}

      /* No-fill protection: collapse if no iframe appears within 1500ms */
      setTimeout(function () {
        var iframe = item.el.querySelector("iframe");
        if (!iframe || iframe.offsetHeight < 2) {
          collapseSlot(item.el);
        } else {
          item.el.classList.remove("is-off");
          item.el.classList.add("is-on");
        }
      }, 1500);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", tryRenderAds);
  } else {
    tryRenderAds();
  }
})();
