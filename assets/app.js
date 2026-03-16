"use strict";

/* ─────────────────────────────────────────
   UTILITIES
───────────────────────────────────────── */
function parsePct(str) {
  if (!str || String(str).trim() === "") return 0;
  var n = parseFloat(String(str).replace(/[%,]/g, "").trim());
  return isNaN(n) ? NaN : n;
}

function parseDollar(str) {
  if (!str || String(str).trim() === "") return 0;
  var n = parseFloat(String(str).replace(/[$,]/g, "").trim());
  return isNaN(n) ? NaN : n;
}

function fmt(n) {
  if (isNaN(n) || n === null) return "$0";
  return "$" + Math.round(n).toLocaleString("en-US");
}

function fmtShort(n) {
  if (isNaN(n) || n === null) return "$0";
  var abs = Math.abs(n);
  if (abs >= 1000000) return "$" + (n / 1000000).toFixed(2) + "M";
  if (abs >= 1000)    return "$" + (n / 1000).toFixed(1) + "K";
  return "$" + Math.round(n).toLocaleString("en-US");
}

function $(id) { return document.getElementById(id); }

/* ─────────────────────────────────────────
   CALCULATION CORE
───────────────────────────────────────── */
function calcOffer(inputs, horizonYears) {
  var base       = inputs.base;
  var bonusPct   = inputs.bonusPct / 100;
  var bonusProb  = inputs.bonusProb / 100;
  var signing    = inputs.signing;
  var equityYear = inputs.equityYear;
  var benefits   = inputs.benefits;
  var raisePct   = inputs.raisePct / 100;

  var years = [];
  var total = 0;

  for (var y = 1; y <= horizonYears; y++) {
    var salary      = base * Math.pow(1 + raisePct, y - 1);
    var bonus       = salary * bonusPct * bonusProb;
    var cash        = salary + bonus;
    var signingThisYear = (y === 1) ? signing : 0;
    var yearTotal   = cash + benefits + equityYear + signingThisYear;

    years.push({
      year:    y,
      salary:  salary,
      bonus:   bonus,
      cash:    cash,
      equity:  equityYear,
      benefits:benefits,
      signing: signingThisYear,
      total:   yearTotal
    });

    total += yearTotal;
  }

  return {
    years:     years,
    total:     total,
    avgPerYear:total / horizonYears,
    year1:     years[0].total
  };
}

/* ─────────────────────────────────────────
   READ INPUTS
───────────────────────────────────────── */
function readOffer(prefix) {
  var bonusProbRaw = $(prefix + "-bonus-prob").value.trim();
  var bonusProbParsed = parsePct(bonusProbRaw);

  return {
    base:       parseDollar($(prefix + "-base").value),
    bonusPct:   parsePct($(prefix + "-bonus-pct").value),
    bonusProb:  bonusProbRaw === "" ? 100 : bonusProbParsed,
    signing:    parseDollar($(prefix + "-signing").value),
    equityYear: parseDollar($(prefix + "-equity").value),
    benefits:   parseDollar($(prefix + "-benefits").value),
    raisePct:   parsePct($(prefix + "-raise").value)
  };
}

/* ─────────────────────────────────────────
   VALIDATION
───────────────────────────────────────── */
function clearErrors() {
  document.querySelectorAll(".field-error").forEach(function (el) { el.textContent = ""; });
  document.querySelectorAll(".input-error").forEach(function (el) { el.classList.remove("input-error"); });
}

function showError(id, msg) {
  var el = $(id);
  var err = $(id + "-error");
  if (el) el.classList.add("input-error");
  if (err) err.textContent = msg;
}

function validateOffer(prefix, label) {
  var base = parseDollar($(prefix + "-base").value);
  if (isNaN(base) || $(prefix + "-base").value.trim() === "") {
    showError(prefix + "-base", "Enter a valid annual salary for " + label + ".");
    return false;
  }
  if (base <= 0) {
    showError(prefix + "-base", "Base salary must be greater than 0.");
    return false;
  }

  var fields = ["bonus-pct", "bonus-prob", "signing", "equity", "benefits", "raise"];
  for (var i = 0; i < fields.length; i++) {
    var id = prefix + "-" + fields[i];
    var el = $(id);
    if (!el || el.value.trim() === "") continue;
    var v = (fields[i] === "bonus-pct" || fields[i] === "bonus-prob" || fields[i] === "raise")
      ? parsePct(el.value)
      : parseDollar(el.value);
    if (isNaN(v)) {
      showError(id, "Enter a valid number or leave blank.");
      return false;
    }
  }
  return true;
}

/* ─────────────────────────────────────────
   RENDER RESULTS
───────────────────────────────────────── */
function renderResults(resA, resB, horizon) {
  var section = $("results");
  section.classList.remove("is-off");
  section.classList.add("is-on");

  /* Winner logic */
  var diff = Math.abs(resA.total - resB.total);
  var pct  = diff / Math.max(resA.total, resB.total);
  var winnerEl = $("winner-label");
  var winnerBox = $("winner-box");

  if (pct <= 0.02) {
    winnerEl.textContent = "These offers are close (within 2%)";
    winnerBox.className = "winner-box winner-close";
  } else if (resA.total > resB.total) {
    winnerEl.textContent = "Offer A leads by " + fmt(resA.total - resB.total) + " over " + horizon + " year" + (horizon > 1 ? "s" : "");
    winnerBox.className = "winner-box winner-a";
  } else {
    winnerEl.textContent = "Offer B leads by " + fmt(resB.total - resA.total) + " over " + horizon + " year" + (horizon > 1 ? "s" : "");
    winnerBox.className = "winner-box winner-b";
  }

  /* Summary cards */
  function fillCard(prefix, res) {
    setVal(prefix + "-total",   fmt(res.total));
    setVal(prefix + "-avg",     fmt(res.avgPerYear));
    setVal(prefix + "-year1",   fmt(res.year1));
  }
  fillCard("a", resA);
  fillCard("b", resB);

  /* Year-by-year table */
  var tbody = $("compare-tbody");
  tbody.innerHTML = "";
  for (var y = 0; y < horizon; y++) {
    var ya = resA.years[y];
    var yb = resB.years[y];
    var diff_y = ya.total - yb.total;
    var tr = document.createElement("tr");
    var leadClass = diff_y > 0 ? "lead-a" : diff_y < 0 ? "lead-b" : "";
    tr.innerHTML =
      "<td>Year " + ya.year + "</td>" +
      "<td class='mono'>" + fmt(ya.total) + "</td>" +
      "<td class='mono'>" + fmt(yb.total) + "</td>" +
      "<td class='mono " + leadClass + "'>" +
        (diff_y >= 0 ? "A +" : "B +") + fmt(Math.abs(diff_y)).replace("$","") +
      "</td>";
    tbody.appendChild(tr);
  }

  /* Totals row */
  var tfoot = $("compare-tfoot");
  tfoot.innerHTML = "";
  var tfr = document.createElement("tr");
  var totalDiff = resA.total - resB.total;
  tfr.className = "totals-row";
  tfr.innerHTML =
    "<td>Total</td>" +
    "<td class='mono'>" + fmt(resA.total) + "</td>" +
    "<td class='mono'>" + fmt(resB.total) + "</td>" +
    "<td class='mono " + (totalDiff >= 0 ? "lead-a" : "lead-b") + "'>" +
      (totalDiff >= 0 ? "A +" : "B +") + fmt(Math.abs(totalDiff)).replace("$","") +
    "</td>";
  tfoot.appendChild(tfr);

  setTimeout(function () {
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 60);
}

function setVal(id, txt) {
  var el = $(id);
  if (el) el.textContent = txt;
}

/* ─────────────────────────────────────────
   FORM HANDLERS
───────────────────────────────────────── */
function handleSubmit(e) {
  e.preventDefault();
  clearErrors();

  var validA = validateOffer("a", "Offer A");
  var validB = validateOffer("b", "Offer B");
  if (!validA || !validB) return;

  var horizon = parseInt($("horizon").value, 10) || 4;
  var offerA  = readOffer("a");
  var offerB  = readOffer("b");
  var resA    = calcOffer(offerA, horizon);
  var resB    = calcOffer(offerB, horizon);

  renderResults(resA, resB, horizon);
}

function handleReset() {
  clearErrors();
  var section = $("results");
  if (section) {
    section.classList.add("is-off");
    section.classList.remove("is-on");
  }
}

/* ─────────────────────────────────────────
   DOLLAR FORMAT ON BLUR
───────────────────────────────────────── */
function attachFormatters() {
  document.querySelectorAll(".dollar-input").forEach(function (input) {
    input.addEventListener("blur", function () {
      var v = parseDollar(this.value);
      if (!isNaN(v) && this.value.trim() !== "") {
        this.value = Math.round(v).toLocaleString("en-US");
      }
    });
    input.addEventListener("focus", function () {
      var v = parseDollar(this.value);
      if (!isNaN(v) && this.value.trim() !== "") {
        this.value = Math.round(v);
      }
    });
  });
}

/* ─────────────────────────────────────────
   INIT
───────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", function () {
  attachFormatters();

  var form = $("comp-form");
  if (form) form.addEventListener("submit", handleSubmit);

  var resetBtn = $("reset-btn");
  if (resetBtn) resetBtn.addEventListener("click", handleReset);
});
