/* ============================================================
   PIRGL — site interactions
   ============================================================ */

/* ---------- Background scenes (auto-cycle paused for now) ---------- */
const AUTO_CYCLE_SCENES = true;           // set false to pause cycling
const SCENE_DUR = 6500;                    // ms per scene when cycling

const sceneEls = Array.from(document.querySelectorAll(".scene"));
const sceneLabel = document.querySelector(".scene-label");
const sceneLabelName = document.getElementById("sceneLabelName");
const sceneLabelIndex = document.getElementById("sceneLabelIndex");

let sceneIdx = 0;

/* Inject non-breaking space after standalone "I", "a", "A" so the
   letter never ends a line — used when we set the cycling quote text. */
function fixOrphans(text) {
  return text.replace(/(^|[\s ])([IaA])\s+/g, "$1$2 ");
}

function showScene(i) {
  sceneEls.forEach((el, k) => el.classList.toggle("is-active", k === i));
  const sceneEl = sceneEls[i];
  if (!sceneEl) return;

  if (sceneLabel) sceneLabel.classList.add("is-changing");
  const heroQuote = document.querySelector(".hero-quote");
  if (heroQuote) {
    heroQuote.classList.add("is-changing");
    heroQuote.classList.remove("show-source");  // hide source on quote transition
  }

  setTimeout(() => {
    if (sceneLabelName) sceneLabelName.textContent = sceneEl.dataset.name || "";
    if (sceneLabelIndex) sceneLabelIndex.textContent = String(i + 1).padStart(2, "0");
    if (sceneLabel) sceneLabel.classList.remove("is-changing");

    const quoteText = document.querySelector(".hero-quote-text");
    const quoteAuthor = document.querySelector(".hero-quote-author");
    if (quoteText && sceneEl.dataset.quote) {
      quoteText.textContent = fixOrphans(sceneEl.dataset.quote);
    }
    if (quoteAuthor && sceneEl.dataset.author) {
      quoteAuthor.textContent = "— " + sceneEl.dataset.author;
    }
    if (heroQuote) heroQuote.classList.remove("is-changing");
  }, 420);
}

let cycleTimerId = null;

function startAutoCycle() {
  if (cycleTimerId) clearInterval(cycleTimerId);
  if (!AUTO_CYCLE_SCENES || sceneEls.length <= 1) return;
  cycleTimerId = setInterval(() => {
    sceneIdx = (sceneIdx + 1) % sceneEls.length;
    showScene(sceneIdx);
  }, SCENE_DUR);
}

function goToScene(direction) {
  sceneIdx = (sceneIdx + direction + sceneEls.length) % sceneEls.length;
  showScene(sceneIdx);
  startAutoCycle();   // reset the timer so a fresh interval starts after manual nav
}

const prevBtn = document.querySelector(".scene-nav-prev");
const nextBtn = document.querySelector(".scene-nav-next");
if (prevBtn) prevBtn.addEventListener("click", () => goToScene(-1));
if (nextBtn) nextBtn.addEventListener("click", () => goToScene(1));

/* ---------- Click hero-quote to reveal source ---------- */
const heroQuoteEl = document.querySelector(".hero-quote");
const heroQuoteSourceEl = document.querySelector(".hero-quote-source");

if (heroQuoteEl) {
  heroQuoteEl.addEventListener("click", () => {
    const currentScene = sceneEls[sceneIdx];
    if (!currentScene || !heroQuoteSourceEl) return;
    const showing = heroQuoteEl.classList.contains("show-source");
    if (showing) {
      heroQuoteEl.classList.remove("show-source");
    } else {
      heroQuoteSourceEl.textContent = currentScene.dataset.source || "";
      heroQuoteEl.classList.add("show-source");
    }
  });
}

startAutoCycle();

/* ---------- Header scroll state ---------- */
function onScroll() {
  if (window.scrollY > 12) {
    document.body.classList.add("scrolled");
  } else {
    document.body.classList.remove("scrolled");
  }
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ---------- Reveal-on-scroll with stagger ---------- */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        // Stagger: delay based on this element's position among
        // its sibling .reveal elements (capped so long lists don't drag)
        const parent = e.target.parentElement;
        const siblings = parent
          ? Array.from(parent.querySelectorAll(":scope > .reveal"))
          : [];
        const idx = siblings.indexOf(e.target);
        const delay = Math.min(Math.max(idx, 0), 6) * 80;
        e.target.style.transitionDelay = `${delay}ms`;
        e.target.classList.add("visible");
        revealObserver.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

/* ---------- CV scroll progress (vertical line filling as user scrolls) ---------- */
(function () {
  const cvSection = document.querySelector(".experience");
  const cvProgress = document.querySelector(".cv-progress");
  if (!cvSection || !cvProgress) return;

  function updateCvProgress() {
    const sectionRect = cvSection.getBoundingClientRect();
    const labelEl = cvSection.querySelector(".section-label");
    if (!labelEl) return;
    const labelRect = labelEl.getBoundingClientRect();
    const winH = window.innerHeight;
    // 0% when "04 Curriculum Vitae" label first reaches the viewport bottom.
    // 100% when the section has scrolled by exactly its own height past that
    // moment — which is the same instant the next section's label hits the
    // bottom of the viewport.
    const progress = Math.max(0, Math.min(1, (winH - labelRect.top) / sectionRect.height));
    cvProgress.style.setProperty("--cv-progress", `${(progress * 100).toFixed(2)}%`);
  }

  window.addEventListener("scroll", updateCvProgress, { passive: true });
  window.addEventListener("resize", updateCvProgress, { passive: true });
  updateCvProgress();
})();

/* ---------- Subtle scroll-driven hue shift on --bg-dark ---------- */
(function () {
  const root = document.documentElement;
  // Warm at top, cool at bottom
  const warm = { r: 12, g: 13, b: 10 };  // #0c0d0a
  const cool = { r: 8,  g: 11, b: 22 };  // #080b16

  function lerp(a, b, t) {
    return Math.round(a + (b - a) * t);
  }

  function updateHue() {
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    if (docH <= 0) return;
    const t = Math.max(0, Math.min(1, window.scrollY / docH));
    const r = lerp(warm.r, cool.r, t);
    const g = lerp(warm.g, cool.g, t);
    const b = lerp(warm.b, cool.b, t);
    root.style.setProperty("--bg-dark", `rgb(${r}, ${g}, ${b})`);
  }

  window.addEventListener("scroll", updateHue, { passive: true });
  window.addEventListener("resize", updateHue, { passive: true });
  updateHue();
})();

/* ---------- Typography: prevent single-letter orphans ----------
   Replaces the space after standalone "I", "a", "A" with a non-breaking
   space so the letter never ends a line. Walks text nodes only, so any
   <strong>/<em> tags inside the paragraphs stay intact. */
(function preventOrphans() {
  const targets = document.querySelectorAll(
    ".about-copy, .hero-intro-copy, .exp-desc, .project-desc, .contact-headline, .contact-subtitle, .notes-headline, .hero-quote-text"
  );
  const re = /(^|[\s ])([IaA])\s+/g;

  targets.forEach((el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach((node) => {
      const original = node.nodeValue;
      const fixed = original.replace(re, "$1$2 ");
      if (fixed !== original) node.nodeValue = fixed;
    });
  });
})();

/* ---------- macOS Dock-style magnify on PIRGL logo letters ---------- */
(function () {
  const logo = document.querySelector(".logo");
  if (!logo) return;
  const letters = Array.from(logo.querySelectorAll(".logo-letter"));
  if (letters.length === 0) return;

  const MAX_DIST = 38;     // px from cursor at which effect ends
  const MAX_SCALE = 1.4;   // peak magnification on the closest letter

  logo.addEventListener("mousemove", (e) => {
    const cursorX = e.clientX;
    letters.forEach((letter) => {
      const rect = letter.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const distance = Math.abs(cursorX - center);
      const proximity = Math.max(0, 1 - distance / MAX_DIST);
      const scale = 1 + proximity * (MAX_SCALE - 1);
      letter.style.transform = `scale(${scale.toFixed(3)})`;
    });
  });

  logo.addEventListener("mouseleave", () => {
    letters.forEach((letter) => {
      letter.style.transform = "";
    });
  });
})();

/* ---------- Year stamp ---------- */
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ---------- Menu sheet open / close ---------- */
const menuTrigger = document.querySelector(".menu-trigger");
const menuClick = document.getElementById("menuClick");
const menuSheet = document.getElementById("menuSheet");
const menuHome = document.querySelector(".menu-home");
const menuLinks = document.querySelectorAll(".menu-link");

function moveLabel(label, event, offsetX = 10, offsetY = -10) {
  if (!label) return;
  label.style.left = `${event.clientX + offsetX}px`;
  label.style.top = `${event.clientY + offsetY}px`;
}

function jitter() {
  if (!menuTrigger) return;
  menuTrigger.classList.remove("is-jittering");
  void menuTrigger.offsetWidth;
  menuTrigger.classList.add("is-jittering");
}

function openMenu() {
  document.body.classList.add("menu-open");
  if (menuSheet) menuSheet.setAttribute("aria-hidden", "false");
}

function closeMenu() {
  document.body.classList.remove("menu-open");
  if (menuSheet) menuSheet.setAttribute("aria-hidden", "true");
}

if (menuTrigger) {
  menuTrigger.addEventListener("mouseenter", () => jitter());
  menuTrigger.addEventListener("mouseleave", () => menuTrigger.classList.remove("is-jittering"));
  menuTrigger.addEventListener("click", openMenu);
}

/* ---------- CLICK label follows the cursor over clickable elements ----------
   Skipped inside the menu sheet and on the PIRGL logo. */
document.querySelectorAll("a, button, .menu-home").forEach((el) => {
  if (el.closest(".menu-sheet")) return;
  if (el.classList.contains("logo")) return;
  el.addEventListener("mouseenter", () => {
    if (menuClick) menuClick.classList.add("visible");
  });
  el.addEventListener("mousemove", (event) => moveLabel(menuClick, event, 12, -12));
  el.addEventListener("mouseleave", () => {
    if (menuClick) menuClick.classList.remove("visible");
  });
});

if (menuHome) menuHome.addEventListener("click", closeMenu);

/* close menu when a menu link is clicked, then smooth-scroll to target */
menuLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    const target = link.dataset.target;
    if (!target) return;
    e.preventDefault();
    closeMenu();
    const targetEl = document.getElementById(target);
    if (!targetEl) return;
    setTimeout(() => {
      targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 380); // wait for menu to slide down a bit
  });
});

/* close menu with Escape */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && document.body.classList.contains("menu-open")) {
    closeMenu();
  }
});

/* ---------- Smooth scroll for in-page anchors ---------- */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  // skip menu-links — they have their own handler that also closes the menu
  if (a.classList.contains("menu-link")) return;
  a.addEventListener("click", (e) => {
    const href = a.getAttribute("href");
    if (!href || href === "#") return;
    const targetEl = document.querySelector(href);
    if (!targetEl) return;
    e.preventDefault();
    targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});
