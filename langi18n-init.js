/* =====================================================================
   Qatar-Hansang — lang/i18n-init.js
   Applies EN ↔ KO on any page (no Arabic).
   Skips pages with their own engine (Feel Korea in Qatar).
   ===================================================================== */
(function () {
  "use strict";

  // Pages with their own internal language engine — do not interfere.
  if (document.getElementById("fk")) {
    document.querySelectorAll(".lang button[data-l]").forEach(function (b) {
      b.addEventListener("click", function () {
        try { localStorage.setItem("qh_lang", b.dataset.l); } catch (e) {}
      });
    });
    return;
  }

  var DICT = window.QH_I18N || {};
  var KEY = "qh_lang";
  var ORIG = new WeakMap();
  var ORIG_ATTR = new WeakMap();

  function getLang() {
    try { return localStorage.getItem(KEY) || "en"; }
    catch (e) { return "en"; }
  }

  function translate(value, lang) {
    if (lang === "en") return value;
    if (Object.prototype.hasOwnProperty.call(DICT, value)) return DICT[value];
    return value;
  }

  function applyText(root, lang) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    var nodes = [], n;
    while ((n = walker.nextNode())) {
      var pn = n.parentNode && n.parentNode.nodeName;
      if (pn === "SCRIPT" || pn === "STYLE") continue;
      nodes.push(n);
    }
    nodes.forEach(function (t) {
      if (!ORIG.has(t)) ORIG.set(t, t.nodeValue);
      var orig = ORIG.get(t);
      var trimmed = orig.trim();
      if (!trimmed) return;
      var pre = orig.match(/^\s*/)[0];
      var post = orig.match(/\s*$/)[0];
      t.nodeValue = pre + translate(trimmed, lang) + post;
    });
  }

  function applyAttrs(root, lang) {
    root.querySelectorAll("[placeholder],[aria-label]").forEach(function (el) {
      ["placeholder", "aria-label"].forEach(function (a) {
        if (!el.hasAttribute(a)) return;
        if (!ORIG_ATTR.has(el)) ORIG_ATTR.set(el, {});
        var bag = ORIG_ATTR.get(el);
        if (!(a in bag)) bag[a] = el.getAttribute(a);
        el.setAttribute(a, translate(bag[a], lang));
      });
    });
  }

  function applyAll(lang) {
    if (lang !== "ko") lang = "en";
    var html = document.documentElement;
    html.lang = lang;
    html.dir = "ltr";
    applyText(document.body, lang);
    applyAttrs(document.body, lang);
    document.querySelectorAll(".lang button[data-l]").forEach(function (b) {
      b.classList.toggle("on", b.dataset.l === lang);
    });
  }

  function setLang(lang) {
    if (lang !== "ko") lang = "en";
    try { localStorage.setItem(KEY, lang); } catch (e) {}
    applyAll(lang);
    document.dispatchEvent(new CustomEvent("qh:langchange", { detail: lang }));
  }

  try {
    var urlLang = new URLSearchParams(location.search).get("lang");
    if (urlLang === "ko" || urlLang === "en") {
      localStorage.setItem(KEY, urlLang);
    }
  } catch (e) {}

  function bindButtons() {
    document.querySelectorAll(".lang button[data-l]").forEach(function (b) {
      b.addEventListener("click", function () { setLang(b.dataset.l); });
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindButtons);
  } else {
    bindButtons();
  }

  var saved = getLang();
  if (saved && saved !== "en") {
    window.addEventListener("load", function () { applyAll(saved); });
  }

  window.QH_setLang = setLang;
  window.QH_applyAll = applyAll;
  window.QH_getLang = getLang;
})();
