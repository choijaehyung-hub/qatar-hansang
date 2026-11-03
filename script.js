/* =====================================================================
   Qatar-Hansang — script.js
   Powers: hero slideshow, mobile menu, photo lightbox,
           directory filter, smooth scrolling, active nav highlight.
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
    function start() { stop(); timer = setInterval(next, 6000); }
    function stop() { if (timer) clearInterval(timer); timer = null; }

    dots.forEach((dot, i) => {
      dot.addEventListener("click", () => { show(i); start(); });
    });

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
    nav.addEventListener("click", (e) => {
      if (e.target.tagName === "A") nav.classList.remove("open");
    });
  })();

  /* ---------- 3. Photo lightbox ---------- */
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

  /* ---------- 4. Business Directory filter ---------- */
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

  /* ---------- 5. Smooth scroll for in-page anchors ---------- */
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

  /* ---------- 6. Active nav highlight ---------- */
  (function activeNav() {
    const navLinks = document.querySelectorAll(".navrow nav a, nav#hn a");
    if (!navLinks.length) return;

    const path = location.pathname.split("/").pop() || "index.html";
    const hash = location.hash || "";

    function isActive(href) {
      const [file, frag] = href.split("#");
      const targetFile = file || "index.html";
      const targetHash = frag ? "#" + frag : "";

      // Case 1: link has a hash — match only when current URL has the same hash
      if (targetHash) {
        return (path === targetFile || (targetFile === "index.html" && path === ""))
               && hash === targetHash;
      }

      // Case 2: plain page link — match only when URL has no hash
      return path === targetFile && !hash;
    }

    navLinks.forEach(a => {
      a.classList.remove("on");
      if (isActive(a.getAttribute("href"))) a.classList.add("on");
    });
  })();

})();
