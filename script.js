/* =====================================================================
   Qatar-Hansang — script.js
   Powers: hero slideshow, mobile menu, language switch,
           photo lightbox, directory filter, smooth scrolling.
   ===================================================================== */
(function () {
  "use strict";

  /* ---------- 1. Hero slideshow ---------- */
  (function heroSlideshow() {
    const slides = document.querySelectorAll(".hero .slide");
    const dots = document.querySelectorAll(".hero .dots button");
    if (slides.length < 2) return;

    let current = 0;
    let timer = null;

    function show(i) {
      current = i % slides.length;
      slides.forEach((s, idx) => s.classList.toggle("on", idx === current));
      dots.forEach((d, idx) => d.classList.toggle("on", idx === current));
    }

    function next() { show(current + 1); }

    function start() {
      stop();
      timer = setInterval(next, 6000);
    }
    function stop() { if (timer) clearInterval(timer); timer = null; }

    dots.forEach((dot, i) => {
      dot.addEventListener("click", () => { show(i); start(); });
    });

    // Pause when the tab is hidden to save CPU
    document.addEventListener("visibilitychange", () => {
      document.hidden ? stop() : start();
    });

    show(0);
    start();
  })();

  /* ---------- 2. Mobile menu ---------- */
  (function mobileMenu() {
    const btn = document.getElementById("hb");
    const nav = document.getElementById("hn");
    if (!btn || !nav) return;
    btn.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
    });
    // Close menu when a link is clicked
    nav.addEventListener("click", (e) => {
      if (e.target.tagName === "A") nav.classList.remove("open");
    });
  })();

  /* ---------- 3. Language switcher ---------- */
  (function languageSwitch() {
    const buttons = document.querySelectorAll(".lang button[data-l]");
    if (!buttons.length) return;

    const dict = {
      en: {},                       // English = original text, no swap needed
      ko: {},                       // Place translations here if desired
      ar: {}
    };

    function apply(lang) {
      buttons.forEach(b => b.classList.toggle("on", b.dataset.l === lang));
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
      // If you add translations, walk [data-i18n] keys here:
      // document.querySelectorAll("[data-i18n]").forEach(el => {
      //   const k = el.dataset.i18n;
      //   if (dict[lang][k]) el.textContent = dict[lang][k];
      // });
    }

    buttons.forEach(b => b.addEventListener("click", () => apply(b.dataset.l)));
  })();

  /* ---------- 4. Photo lightbox ---------- */
  (function photoLightbox() {
    const lb = document.getElementById("lb");
    if (!lb) return;

    const img = lb.querySelector("img");
    const album = document.querySelectorAll(".album figure img");
    if (!album.length) return;

    function open(src, alt) {
      img.src = src;
      img.alt = alt || "";
      lb.hidden = false;
      document.body.style.overflow = "hidden";
    }
    function close() {
      lb.hidden = true;
      img.removeAttribute("src");
      document.body.style.overflow = "";
    }

    album.forEach(thumb => {
      thumb.addEventListener("click", (e) => {
        e.preventDefault();
        open(thumb.currentSrc || thumb.src, thumb.alt);
      });
    });

    lb.addEventListener("click", close);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !lb.hidden) close();
    });
  })();

  /* ---------- 5. Business Directory filter ---------- */
  (function directoryFilter() {
    const searchInput = document.querySelector('.controls input[type="search"], .controls input[type="text"]');
    const countrySel  = document.querySelector(".controls select[name='country'], .controls select#country");
    const industrySel = document.querySelector(".controls select[name='industry'], .controls select#industry");
    const cards = document.querySelectorAll(".member");

    if (!cards.length) return;

    function apply() {
      const q = (searchInput?.value || "").trim().toLowerCase();
      const country  = (countrySel?.value  || "").toLowerCase();
      const industry = (industrySel?.value || "").toLowerCase();

      cards.forEach(card => {
        const hay = card.textContent.toLowerCase();
        const cardCountry  = (card.dataset.country  || "").toLowerCase();
        const cardIndustry = (card.dataset.industry || "").toLowerCase();

        const matchQ        = !q        || hay.includes(q);
        const matchCountry  = !country  || cardCountry  === country;
        const matchIndustry = !industry || cardIndustry === industry;

        card.hidden = !(matchQ && matchCountry && matchIndustry);
      });
    }

    searchInput?.addEventListener("input", apply);
    countrySel?.addEventListener("change", apply);
    industrySel?.addEventListener("change", apply);
  })();

  /* ---------- 6. Smooth scroll for in-page anchors ---------- */
  (function smoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id.length > 1) {
          const target = document.querySelector(id);
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      });
    });
  })();
})();