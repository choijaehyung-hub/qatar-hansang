
/* ==========================================================
   QATAR-HANSANG — SHARED LANGUAGE INITIALIZER
   English / Korean language support for all website pages.
   Requires i18n.js to load before this file.
   ========================================================== */

(function () {
  "use strict";

  var KEY = "qh_lang";

  var ORIGINAL_TEXT = new WeakMap();
  var ORIGINAL_ATTRS = new WeakMap();

  var translating = false;
  var observer = null;

  /* --------------------------------------------------------
     Language storage
     -------------------------------------------------------- */

  function getLang() {
    try {
      var saved = localStorage.getItem(KEY);
      return saved === "ko" ? "ko" : "en";
    } catch (e) {
      return "en";
    }
  }

  function saveLang(lang) {
    lang = lang === "ko" ? "ko" : "en";

    try {
      localStorage.setItem(KEY, lang);
    } catch (e) {}

    return lang;
  }

  /* --------------------------------------------------------
     Translation lookup
     -------------------------------------------------------- */

  function translate(value, lang) {
    if (lang !== "ko") return value;

    var dictionary = window.QH_I18N || {};

    return Object.prototype.hasOwnProperty.call(dictionary, value)
      ? dictionary[value]
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
      null
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

    var elements = [];

    if (root.matches &&
        root.matches("[placeholder], [aria-label], [alt], [title]")) {
      elements.push(root);
    }

    root.querySelectorAll(
      "[placeholder], [aria-label], [alt], [title]"
    ).forEach(function (element) {
      elements.push(element);
    });

    elements.forEach(function (element) {
      if (!ORIGINAL_ATTRS.has(element)) {
        ORIGINAL_ATTRS.set(element, {});
      }

      var saved = ORIGINAL_ATTRS.get(element);

      attributes.forEach(function (attribute) {
        if (!element.hasAttribute(attribute)) return;

        if (!(attribute in saved)) {
          saved[attribute] = element.getAttribute(attribute);
        }

        element.setAttribute(
          attribute,
          translate(saved[attribute], lang)
        );
      });
    });
  }

  /* --------------------------------------------------------
     Apply language
     -------------------------------------------------------- */

  function applyAll(lang) {
    lang = lang === "ko" ? "ko" : "en";

    document.documentElement.lang = lang;
    document.documentElement.dir = "ltr";

    if (document.body) {
      applyText(document.body, lang);
      applyAttributes(document.body, lang);
    }

    document.querySelectorAll(
      ".lang button[data-l]"
    ).forEach(function (button) {
      var active = button.dataset.l === lang;

      button.classList.toggle("on", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  /* --------------------------------------------------------
     Change language
     -------------------------------------------------------- */

  function setLang(lang) {
    lang = saveLang(lang);

    applyAll(lang);

    document.dispatchEvent(
      new CustomEvent("qh:langchange", {
        detail: lang
      })
    );
  }

  /* --------------------------------------------------------
     Language button events
     -------------------------------------------------------- */

  function bindButtons() {
    document.addEventListener("click", function (event) {
      var target = event.target;

      if (!target.closest) return;

      var button = target.closest(".lang button[data-l]");

      if (!button) return;

      event.preventDefault();
      setLang(button.dataset.l);
    });
  }

  /* --------------------------------------------------------
     Save language before navigating to another page
     -------------------------------------------------------- */

  function bindNavigation() {
    document.addEventListener("click", function (event) {
      var target = event.target;

      if (!target.closest) return;

      var link = target.closest("a[href]");

      if (!link) return;

      var href = link.getAttribute("href");

      if (
        !href ||
        href.charAt(0) === "#" ||
        link.target === "_blank" ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      try {
        var destination = new URL(href, window.location.href);

        if (destination.origin === window.location.origin) {
          saveLang(document.documentElement.lang || getLang());
        }
      } catch (e) {}
    }, true);
  }

  /* --------------------------------------------------------
     Observe dynamically added content
     -------------------------------------------------------- */

  function observeChanges() {
    if (!document.body || observer) return;

    observer = new MutationObserver(function (records) {
      if (translating) return;

      var lang = document.documentElement.lang || getLang();

      records.forEach(function (record) {
        record.addedNodes.forEach(function (added) {
          if (added.nodeType === Node.ELEMENT_NODE) {
            if (
              added.matches(".lang") ||
              (added.closest && added.closest(".lang"))
            ) {
              return;
            }

            applyText(added, lang);
            applyAttributes(added, lang);
          }

          if (added.nodeType === Node.TEXT_NODE) {
            var parent = added.parentElement;

            if (
              !parent ||
              parent.closest("script, style, noscript, .lang")
            ) {
              return;
            }

            if (!ORIGINAL_TEXT.has(added)) {
              ORIGINAL_TEXT.set(added, added.nodeValue);
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
     Initialise
     -------------------------------------------------------- */

  function initialise() {
    // Leave the Feel Korea page's independent language engine alone.
    if (document.getElementById("fk")) return;

    bindButtons();
    bindNavigation();

    var lang = getLang();

    try {
      var urlLang = new URLSearchParams(
        window.location.search
      ).get("lang");

      if (urlLang === "ko" || urlLang === "en") {
        lang = saveLang(urlLang);
      }
    } catch (e) {}

    applyAll(lang);
    observeChanges();
  }

  /* --------------------------------------------------------
     Restore language when browser restores a page
     -------------------------------------------------------- */

  window.addEventListener("pageshow", function () {
    if (document.getElementById("fk")) return;
    applyAll(getLang());
  });

  /* --------------------------------------------------------
     Public functions
     -------------------------------------------------------- */

  window.QH_setLang = setLang;
  window.QH_applyAll = applyAll;
  window.QH_getLang = getLang;

  /* --------------------------------------------------------
     Start
     -------------------------------------------------------- */

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialise, {
      once: true
    });
  } else {
    initialise();
  }

})();
