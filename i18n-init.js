/* =====================================================================
   Qatar-Hansang — i18n-init.js
   Applies EN or KO to any page, remembers the choice, and keeps
   dynamically-rendered content in sync via the "qh:langchange" event.

   IMPORTANT BEHAVIOUR:
   - Only runs the initial language pass ONCE at DOMContentLoaded.
   - Never re-applies "en" after the user has clicked "ko".
   - Skips pages that already have their own language engine (#fk).
   ===================================================================== */
(function () {
  "use strict";

  /* --------------------------------------------------------------
     Skip pages that already have their own language engine.
     feel-korea-in-qatar.html defines its own setLang()/I18N.
     We still sync the shared localStorage key so back-nav is
     consistent across pages.
     -------------------------------------------------------------- */
  if (document.getElementById("fk")) {
    document.querySelectorAll(".lang button[data-l]").forEach(function (b) {
      b.addEventListener("click", function () {
        try { localStorage.setItem("qh_lang", b.dataset.l); } catch (e) {}
      });
    });
    return;
  }

  var DICT      = window.QH_I18N || {};
  var KEY       = "qh_lang";
  var ORIG      = new WeakMap();   // text node -> original English string
  var ORIG_ATTR = new WeakMap();   // element  -> { attrName: originalValue }
  var INIT_DONE = false;           // guard: apply initial language only once

  /* --------------------------------------------------------------
     Helpers
     -------------------------------------------------------------- */
  function getLang() {
    try { return localStorage.getItem(KEY) || "en"; }
    catch (e) { return "en"; }
  }

  function currentDocLang() {
    return document.documentElement.lang === "ko" ? "ko" : "en";
  }

  function translate(value, lang) {
    if (lang === "en") return value;
    if (Object.prototype.hasOwnProperty.call(DICT, value)) return DICT[value];
    return value;
  }

  /* --------------------------------------------------------------
     Translate all text nodes inside `root`
     -------------------------------------------------------------- */
  function applyText(root, lang) {
    if (!root) return;
    window.__qhTranslating = true;

    try {
      var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
      var nodes = [];
      var n;

      while ((n = walker.nextNode())) {
        var pn = n.parentNode && n.parentNode.nodeName;
        if (pn === "SCRIPT" || pn === "STYLE" || pn === "NOSCRIPT") continue;
        nodes.push(n);
      }

      nodes.forEach(function (t) {
        if (!ORIG.has(t)) ORIG.set(t, t.nodeValue);

        var orig    = ORIG.get(t);
        var trimmed = orig.trim();
        if (!trimmed) return;

        var pre  = orig.match(/^\s*/)[0];
        var post = orig.match(/\s*$/)[0];

        t.nodeValue = pre + translate(trimmed, lang) + post;
      });
    } finally {
      window.__qhTranslating = false;
    }
  }

  /* --------------------------------------------------------------
     Translate placeholder / aria-label / alt / title
     -------------------------------------------------------------- */
  function applyAttrs(root, lang) {
    if (!root || !root.querySelectorAll) return;

    var ATTRS = ["placeholder", "aria-label", "alt", "title"];

    root.querySelectorAll(
      "[placeholder], [aria-label], [alt], [title]"
    ).forEach(function (el) {
      if (!ORIG_ATTR.has(el)) ORIG_ATTR.set(el, {});
      var bag = ORIG_ATTR.get(el);

      ATTRS.forEach(function (attr) {
        if (!el.hasAttribute(attr)) return;
        if (!(attr in bag)) bag[attr] = el.getAttribute(attr);
        el.setAttribute(attr, translate(bag[attr], lang));
      });
    });
  }

  /* --------------------------------------------------------------
     Apply a language to the whole page
     -------------------------------------------------------------- */
  function applyAll(lang) {
    lang = (lang === "ko") ? "ko" : "en";

    // Set <html lang> FIRST so any observer firing mid-pass reads
    // the correct language from the DOM, not from a stale closure.
    document.documentElement.lang = lang;
    document.documentElement.dir  = "ltr";

    applyText(document.body, lang);
    applyAttrs(document.body, lang);

    document.querySelectorAll(".lang button[data-l]").forEach(function (b) {
      var active = b.dataset.l === lang;
      b.classList.toggle("on", active);
      b.setAttribute("aria-pressed", String(active));
    });
  }

  /* --------------------------------------------------------------
     Public setter (called by the language toggle buttons)
     -------------------------------------------------------------- */
  function setLang(lang) {
    lang = (lang === "ko") ? "ko" : "en";
    try { localStorage.setItem(KEY, lang); } catch (e) {}
    applyAll(lang);
    document.dispatchEvent(new CustomEvent("qh:langchange", { detail: lang }));
  }

  /* --------------------------------------------------------------
     Bind the EN / 한국어 buttons (delegated — works even if new
     buttons are added later)
     -------------------------------------------------------------- */
  function bindButtons() {
    document.addEventListener("click", function (e) {
      var btn = e.target.closest(".lang button[data-l]");
      if (!btn) return;
      // Avoid re-processing if it's already active
      if (btn.dataset.l === currentDocLang()) return;
      setLang(btn.dataset.l);
    });
  }

  /* --------------------------------------------------------------
     Startup
     -------------------------------------------------------------- */
  function initialise() {
    if (INIT_DONE) return;
    INIT_DONE = true;

    bindButtons();

    // URL param wins, then saved value, then English
    var lang = "en";
    try {
      var urlLang = new URLSearchParams(location.search).get("lang");
      lang = urlLang === "ko" || urlLang === "en"
        ? urlLang
        : (getLang() || "en");
    } catch (e) {}

    // Apply once. This is the ONLY place the initial language is
    // written. We never re-apply "en" later — no window.load listener,
    // no interval, no observer-driven re-translation of the whole page.
    if (lang !== "en") {
      applyAll(lang);
    } else {
      // Even for English we still set documentElement.lang to "en"
      // and hook up the buttons' visual state.
      document.documentElement.lang = "en";
      document.documentElement.dir  = "ltr";
      document.querySelectorAll(".lang button[data-l]").forEach(function (b) {
        var active = b.dataset.l === "en";
        b.classList.toggle("on", active);
        b.setAttribute("aria-pressed", String(active));
      });
    }

    // MutationObserver: translate NEW content only.
    // Skips while our own translation pass is writing, so it can
    // never fight applyAll() and revert to English.
    var observer = new MutationObserver(function (records) {
      if (window.__qhTranslating) return;

      var langNow = currentDocLang();

      records.forEach(function (record) {
        record.addedNodes.forEach(function (added) {
          if (added.nodeType === Node.ELEMENT_NODE) {
            applyText(added, langNow);
            applyAttrs(added, langNow);
          } else if (added.nodeType === Node.TEXT_NODE) {
            var parent = added.parentElement;
            if (parent && !parent.closest("script, style, noscript, .lang")) {
              // Translate just this one text node to avoid re-walking
              // large subtrees unnecessarily.
              if (!ORIG.has(added)) ORIG.set(added, added.nodeValue);
              var orig = ORIG.get(added);
              var trimmed = orig.trim();
              if (trimmed) {
                var pre  = orig.match(/^\s*/)[0];
                var post = orig.match(/\s*$/)[0];
                added.nodeValue = pre + translate(trimmed, langNow) + post;
              }
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /* --------------------------------------------------------------
     Bootstrap
     -------------------------------------------------------------- */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialise);
  } else {
    initialise();
  }

  /* --------------------------------------------------------------
     Public API
     -------------------------------------------------------------- */
  window.QH_setLang  = setLang;
  window.QH_applyAll = applyAll;
  window.QH_getLang  = getLang;

})();
