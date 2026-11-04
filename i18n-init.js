
/* ==========================================================
   QATAR-HANSANG — SHARED LANGUAGE INITIALIZER
   Supports English and Korean across all website pages.
   Requires i18n.js to load before this file.
   ========================================================== */

(function () {
  "use strict";

  var KEY = "qh_lang";
  var DICT = window.QH_I18N || {};

  var ORIGINAL_TEXT = new WeakMap();
  var ORIGINAL_ATTRS = new WeakMap();

  var translating = false;

  /* --------------------------------------------------------
     Get and save language
     -------------------------------------------------------- */

  function getLang() {
    try {
      return localStorage.getItem(KEY) || "en";
    } catch (e) {
      return "en";
    }
  }

  function saveLang(lang) {
    try {
      localStorage.setItem(KEY, lang);
    } catch (e) {}
  }

  /* --------------------------------------------------------
     Translation lookup
     -------------------------------------------------------- */

  function translate(value, lang) {
    if (lang !== "ko") return value;

    return Object.prototype.hasOwnProperty.call(DICT, value)
      ? DICT[value]
      : value;
  }

  /* --------------------------------------------------------
     Translate text nodes
     -------------------------------------------------------- */

  function applyText(root, lang) {
    if (!root) return;

    var walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    var nodes = [];
    var node;

    while ((node = walker.nextNode())) {
      var parent = node.parentElement;

      if (
        !parent ||
        parent.closest("script, style, noscript, .lang")
      ) {
        continue;
      }

      nodes.push(node);
    }

    translating = true;

    try {
      nodes.forEach(function (item) {
        if (!ORIGINAL_TEXT.has(item)) {
          ORIGINAL_TEXT.set(item, item.nodeValue);
        }

        var original = ORIGINAL_TEXT.get(item);
        var trimmed = original.trim();

        if (!trimmed) return;

        var leading = original.match(/^\s*/)[0];
        var trailing = original.match(/\s*$/)[0];

        item.nodeValue =
          leading + translate(trimmed, lang) + trailing;
      });
    } finally {
      translating = false;
    }
  }

  /* --------------------------------------------------------
     Translate attributes
     -------------------------------------------------------- */

  function applyAttributes(root, lang) {
    if (!root || !root.querySelectorAll) return;

    var attributes = [
      "placeholder",
      "aria-label",
      "alt",
      "title"
    ];

    root.querySelectorAll(
      "[placeholder], [aria-label], [alt], [title]"
    ).forEach(function (element) {

      if (!ORIGINAL_ATTRS.has(element)) {
        ORIGINAL_ATTRS.set(element, {});
      }

      var saved = ORIGINAL_ATTRS.get(element);

      attributes.forEach(function (attribute) {
        if (!element.hasAttribute(attribute)) return;

        if (!(attribute in saved)) {
          saved[attribute] =
            element.getAttribute(attribute);
        }

        element.setAttribute(
          attribute,
          translate(saved[attribute], lang)
        );
      });
    });
  }

  /* --------------------------------------------------------
     Apply language to the whole page
     -------------------------------------------------------- */

  function applyAll(lang) {
    lang = lang === "ko" ? "ko" : "en";

    document.documentElement.lang = lang;
    document.documentElement.dir = "ltr";

    applyText(document.body, lang);
    applyAttributes(document.body, lang);

    document.querySelectorAll(
      ".lang button[data-l]"
    ).forEach(function (button) {

      var active = button.dataset.l === lang;

      button.classList.toggle("on", active);
      button.setAttribute(
        "aria-pressed",
        String(active)
      );
    });
  }

  /* --------------------------------------------------------
     Change language
     -------------------------------------------------------- */

  function setLang(lang) {
    lang = lang === "ko" ? "ko" : "en";

    saveLang(lang);
    applyAll(lang);

    document.dispatchEvent(
      new CustomEvent("qh:langchange", {
        detail: lang
      })
    );
  }

  /* --------------------------------------------------------
     Language buttons
     -------------------------------------------------------- */

  function bindButtons() {
    document.addEventListener("click", function (event) {

      var button = event.target.closest(
        ".lang button[data-l]"
      );

      if (!button) return;

      setLang(button.dataset.l);
    });
  }

  /* --------------------------------------------------------
     Dynamically added content
     -------------------------------------------------------- */

  function observeChanges() {
    var observer = new MutationObserver(function (records) {

      if (translating) return;

      var lang = document.documentElement.lang || "en";

      records.forEach(function (record) {

        record.addedNodes.forEach(function (added) {

          if (added.nodeType === Node.ELEMENT_NODE) {

            if (
              added.matches &&
              added.matches(".lang")
            ) return;

            if (
              added.closest &&
              added.closest(".lang")
            ) return;

            applyText(added, lang);
            applyAttributes(added, lang);

          } else if (added.nodeType === Node.TEXT_NODE) {

            var parent = added.parentElement;

            if (
              !parent ||
              parent.closest("script, style, noscript, .lang")
            ) return;

            if (!ORIGINAL_TEXT.has(added)) {
              ORIGINAL_TEXT.set(
                added,
                added.nodeValue
              );
            }

            var original = ORIGINAL_TEXT.get(added);
            var trimmed = original.trim();

            if (!trimmed) return;

            var leading = original.match(/^\s*/)[0];
            var trailing = original.match(/\s*$/)[0];

            added.nodeValue =
              leading + translate(trimmed, lang) + trailing;
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /* --------------------------------------------------------
     Startup
     -------------------------------------------------------- */

  function initialise() {

    // Pages with their own independent language engine
    if (document.getElementById("fk")) {
      return;
    }

    bindButtons();

    var lang = "en";

    try {
      var urlLang = new URLSearchParams(
        window.location.search
      ).get("lang");

      if (urlLang === "ko" || urlLang === "en") {
        lang = urlLang;
        saveLang(lang);
      } else {
        lang = getLang();
      }
    } catch (e) {
      lang = getLang();
    }

    applyAll(lang);
    observeChanges();
  }

  /* --------------------------------------------------------
     Public functions
     -------------------------------------------------------- */

  window.QH_setLang = setLang;
  window.QH_applyAll = applyAll;
  window.QH_getLang = function () {
    return document.documentElement.lang || "en";
  };

  /* --------------------------------------------------------
     Run after page is ready
     -------------------------------------------------------- */

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialise,
      { once: true }
    );
  } else {
    initialise();
  }

})();
