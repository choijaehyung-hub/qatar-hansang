
/* Qatar-Hansang bilingual language engine */
(function () {
  "use strict";

  const KEY = "qh_lang";
  const DICT = window.QH_I18N || {};

  function getLang() {
    try {
      return localStorage.getItem(KEY) === "ko" ? "ko" : "en";
    } catch (e) {
      return "en";
    }
  }

  function translateText(value, lang) {
    if (lang !== "ko") return value;
    return Object.prototype.hasOwnProperty.call(DICT, value)
      ? DICT[value]
      : value;
  }

  function translateNode(root, lang) {
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

      if (!parent) continue;
      if (parent.closest("script, style, noscript")) continue;
      if (parent.closest(".lang")) continue;

      nodes.push(node);
    }

    nodes.forEach(function (item) {
      if (!item.dataset.qhOriginal) {
        item.dataset.qhOriginal = item.nodeValue;
      }

      const original = item.dataset.qhOriginal;
      const trimmed = original.trim();

      if (!trimmed) return;

      const leading = original.match(/^\s*/)[0];
      const trailing = original.match(/\s*$/)[0];

      item.nodeValue =
        leading + translateText(trimmed, lang) + trailing;
    });
  }

  function applyAttributes(lang) {
    document.querySelectorAll("[placeholder], [aria-label]").forEach(function (el) {
      ["placeholder", "aria-label"].forEach(function (attr) {
        if (!el.hasAttribute(attr)) return;

        const key = "qhOriginal" + attr;
        if (!el.dataset[key]) {
          el.dataset[key] = el.getAttribute(attr);
        }

        el.setAttribute(
          attr,
          translateText(el.dataset[key], lang)
        );
      });
    });
  }

  function applyLanguage(lang) {
    lang = lang === "ko" ? "ko" : "en";

    document.documentElement.lang = lang;
    document.documentElement.dir = "ltr";

    translateNode(document.body, lang);
    applyAttributes(lang);

    document.querySelectorAll(".lang button[data-l]").forEach(function (button) {
      const active = button.dataset.l === lang;
      button.classList.toggle("on", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function setLanguage(lang) {
    lang = lang === "ko" ? "ko" : "en";

    try {
      localStorage.setItem(KEY, lang);
    } catch (e) {}

    applyLanguage(lang);

    document.dispatchEvent(
      new CustomEvent("qh:langchange", { detail: lang })
    );
  }

  // Event delegation: works even if buttons are added later.
  document.addEventListener("click", function (event) {
    const button = event.target.closest(".lang button[data-l]");
    if (!button) return;

    event.preventDefault();
    setLanguage(button.dataset.l);
  });

  function initialise() {
    const urlLang = new URLSearchParams(location.search).get("lang");

    if (urlLang === "ko" || urlLang === "en") {
      try {
        localStorage.setItem(KEY, urlLang);
      } catch (e) {}
    }

    applyLanguage(getLang());

    // Translate newly added page content.
    const observer = new MutationObserver(function (mutations) {
      const lang = getLang();

      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (added) {
          if (added.nodeType === Node.ELEMENT_NODE) {
            translateNode(added, lang);
          } else if (added.nodeType === Node.TEXT_NODE) {
            translateNode(added.parentElement, lang);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  window.QH_setLang = setLanguage;
  window.QH_getLang = getLang;
  window.QH_applyAll = applyLanguage;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialise);
  } else {
    initialise();
  }
})();
