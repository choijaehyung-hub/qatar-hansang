
(function () {
  "use strict";

  const KEY = "qh_lang";
  const DICT = window.QH_I18N || {};
  const originalText = new WeakMap();
  const originalAttrs = new WeakMap();

  function translate(value, lang) {
    if (lang === "en") return value;
    return Object.prototype.hasOwnProperty.call(DICT, value)
      ? DICT[value]
      : value;
  }

  function translateText(root, lang) {
    if (!root) return;

    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      null
    );

    const nodes = [];
    let node;

    while ((node = walker.nextNode())) {
      const parent = node.parentElement;

      if (
        !parent ||
        parent.closest("script, style, noscript, .lang")
      ) continue;

      nodes.push(node);
    }

    nodes.forEach(function (item) {
      if (!originalText.has(item)) {
        originalText.set(item, item.nodeValue);
      }

      const original = originalText.get(item);
      const trimmed = original.trim();

      if (!trimmed) return;

      const leading = original.match(/^\s*/)[0];
      const trailing = original.match(/\s*$/)[0];

      item.nodeValue =
        leading + translate(trimmed, lang) + trailing;
    });
  }

  function translateAttributes(root, lang) {
    root.querySelectorAll("[placeholder], [aria-label], [alt], [title]").forEach(function (el) {
  ["placeholder", "aria-label", "alt", "title"].forEach(function (attr) {
    if (!el.hasAttribute(attr)) return;
    if (!originalAttrs.has(el)) originalAttrs.set(el, {});
    const saved = originalAttrs.get(el);
    if (!(attr in saved)) saved[attr] = el.getAttribute(attr);
    el.setAttribute(attr, translate(saved[attr], lang));
  });
});
  }

  function applyLanguage(lang) {
    lang = lang === "ko" ? "ko" : "en";

    document.documentElement.lang = lang;
    document.documentElement.dir = "ltr";

    translateText(document.body, lang);
    translateAttributes(document.body, lang);

    document.querySelectorAll(".lang button[data-l]").forEach(function (button) {
      const active = button.dataset.l === lang;
      button.classList.toggle("on", active);
      button.setAttribute("aria-pressed", String(active));
    });

    try {
      localStorage.setItem(KEY, lang);
    } catch (e) {}

    document.dispatchEvent(
      new CustomEvent("qh:langchange", { detail: lang })
    );
  }

  function initialise() {
    // Delegated click handler
    document.addEventListener("click", function (event) {
      const button = event.target.closest(".lang button[data-l]");
      if (button) applyLanguage(button.dataset.l);
    });

    // Apply saved language
    let lang = "en";

    try {
      const urlLang = new URLSearchParams(location.search).get("lang");
      lang = urlLang || localStorage.getItem(KEY) || "en";
    } catch (e) {}

    applyLanguage(lang);

    // Translate newly added page content
    const observer = new MutationObserver(function (records) {
      const langNow = document.documentElement.lang || "en";

      records.forEach(function (record) {
        record.addedNodes.forEach(function (added) {
          if (added.nodeType === Node.ELEMENT_NODE) {
            translateText(added, langNow);
            translateAttributes(added, langNow);
          } else if (added.nodeType === Node.TEXT_NODE) {
            const parent = added.parentElement;
            if (parent && !parent.closest("script, style, noscript, .lang")) {
              translateText(parent, langNow);
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

  window.QH_setLang = applyLanguage;
  window.QH_getLang = function () {
    return document.documentElement.lang || "en";
  };
  window.QH_applyAll = applyLanguage;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialise);
  } else {
    initialise();
  }
})();
