/* ==========================================================================
   STORY — preloader, smooth scroll, hero, and the pinned journey: a timeline
   that drives the world camera, Tito's poses, copy and photos, played one
   scene per scroll gesture at a fixed pace.
   ========================================================================== */
gsap.registerPlugin(ScrollTrigger, Observer);
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];

/* ---------------- smooth scroll ---------------- */
let lenis = null;
if (window.Lenis) {
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
}
$$('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
  const target = $(a.getAttribute("href")); if (!target) return;
  e.preventDefault();
  if (typeof steps !== "undefined") steps.release();          // the journey may be holding the scroll
  lenis ? lenis.scrollTo(target, { duration: 1.6 }) : target.scrollIntoView({ behavior: "smooth" });
}));

/* ---------------- helpers ---------------- */
function splitWords(el) {                      // wraps every word in a masked span, keeps <em>/<br>
  const walk = node => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
          const w = document.createElement("span"); w.className = "wmask";
          const i = document.createElement("span"); i.className = "w"; i.textContent = part;
          w.appendChild(i); frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== "BR") walk(n);
    });
  };
  walk(el);
  return el.querySelectorAll(".w");
}
const style = document.createElement("style");
style.textContent = ".wmask{display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.1em;margin-bottom:-.1em}.wmask>.w{display:inline-block}";
document.head.appendChild(style);

/* ---------------- deferred images ----------------
   Everything except the hero photo waits until the loader is gone,
   so the first screen gets the whole bandwidth. */
function loadDeferredImages() {
  $$("img[data-src]").forEach(img => { img.decoding = "async"; img.src = img.dataset.src; img.removeAttribute("data-src"); });
}

const heroWords = splitWords($("#heroTitle"));
gsap.set(heroWords, { yPercent: 110 });
gsap.set(".hero-fade", { opacity: 0, y: 20 });

window.__loader.then(() => {
  const tl = gsap.timeline({ onComplete: () => { document.body.classList.remove("loading"); lenis && lenis.start(); ScrollTrigger.refresh(); } });
  tl.to(".ld-steam", { opacity: 0, duration: .3 }, 0)
    .to(".ld-center", { y: -40, opacity: 0, duration: .7, ease: "power3.in" }, .1)
    .to(".ld-foot", { opacity: 0, duration: .4 }, .1)
    .to("#loader", { clipPath: "inset(0% 0% 100% 0%)", duration: 1.1, ease: "power4.inOut" }, .35)
    .from("#heroMedia", { scale: 1.25, duration: 2.2, ease: "power3.out" }, .45)
    .to(heroWords, { yPercent: 0, duration: 1.2, stagger: .07, ease: "power4.out" }, .85)
    .to(".hero-fade", { opacity: 1, y: 0, duration: 1, stagger: .12, ease: "power3.out" }, 1.25)
    .set("#loader", { display: "none" })
    .call(loadDeferredImages, null, .6);
});

/* ---------------- header + hero parallax ---------------- */
ScrollTrigger.create({ trigger: ".hero", start: "bottom 80px", end: "max", toggleClass: { targets: "#hdr", className: "solid" } });
gsap.to("#heroMedia", { yPercent: 18, scale: 1.08, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
gsap.to(".hero-inner", { yPercent: -30, opacity: 0, ease: "none", scrollTrigger: { trigger: ".hero", start: "40% top", end: "bottom top", scrub: true } });

/* ---------------- intro statement ---------------- */
const stWords = splitWords($("#statement"));
gsap.set(stWords, { opacity: .14 });
gsap.to(stWords, { opacity: 1, stagger: .1, ease: "none", scrollTrigger: { trigger: "#statement", start: "top 80%", end: "bottom 45%", scrub: true } });
$$("[data-speed]").forEach(img => gsap.fromTo(img, { yPercent: -10 }, { yPercent: -10 + +img.dataset.speed, ease: "none",
  scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true } }));

/* ==========================================================================
   JOURNEY
   ========================================================================== */
World.build();
const journey = $("#journey"), actor = $("#actor");
const L = { far: $("#lFar"), mid: $("#lMid"), main: $("#lMain"), props: $("#lProps"), fore: $("#lFore") };
const state = { p: 400, cam: 0, lift: 0, tilt: 0, map: 0 };   // p = Tito's world x
const dry = { q: 0 };                                           // progress of the drying-bed scene (drying.js)
const roast = { r: 0, k: 0 };                                   // roastery and packing scenes (roastery.js)
const P = Tito.pose;
let u = 1, W = 1, H = 1, screenX = 0;
const FEET = 872;   // Tito walks on the path, a bit in front of the ground line (y = 820)

function measure() {
  W = document.documentElement.clientWidth; H = window.innerHeight; u = H / 1000;   // journey is always 100vh
  screenX = W * (W < 760 ? 0.5 : 0.6);
  journey.style.setProperty("--u", u + "px");
  journey.style.setProperty("--wx", screenX + 58 * u + "px");   // where the box lands: the wipe grows from there
  journey.style.setProperty("--wy", (FEET - 24) * u + "px");
  World.resize(u);
}
measure();
window.addEventListener("resize", measure);
ScrollTrigger.addEventListener("refreshInit", measure);

/* clouds */
const cloudPath = "M30 80 Q0 80 2 58 Q4 36 32 38 Q38 8 74 10 Q104 12 112 36 Q140 28 150 54 Q156 80 126 80Z";
const clouds = Array.from({ length: 18 }, (_, i) => {
  const el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  el.setAttribute("viewBox", "0 0 156 82");
  const d = 0.25 + Math.random() * 1.1, high = i < 4;
  el.innerHTML = `<path d="${cloudPath}" fill="#fff" opacity="${high ? .8 : .95}"/>`;
  $("#clouds").appendChild(el);
  return { el, x: Math.random() * 3600, y: high ? 40 + Math.random() * 140 : 120 + Math.random() * 640, d: high ? 0.08 : d, s: (high ? 1.1 : 0.6 + d) * 160, high };
});

/* camera: positions every layer from Tito's world x and the vertical camera */
let lastP = state.p;
function render(time) {
  const base = screenX - state.p * u;
  L.far.style.transform = `translate3d(${base * World.FACTOR.far}px, ${state.cam * u * .3}px,0)`;
  L.mid.style.transform = `translate3d(${base * World.FACTOR.mid}px, ${state.cam * u * .6}px,0)`;
  L.main.style.transform = L.props.style.transform = `translate3d(${base}px, ${state.cam * u}px,0)`;
  L.fore.style.transform = `translate3d(${base * World.FACTOR.fore}px, ${state.cam * u * 1.3}px,0)`;
  actor.style.transform = `translate3d(${screenX - 100 * u}px, ${(FEET - 300 - state.lift) * u}px,0) rotate(${state.tilt}deg)`;

  const f = Math.min(1, state.cam / 800), span = 3600;
  clouds.forEach(c => {
    const x = ((c.x - state.p * c.d * .6) % span + span) % span - 400;
    const y = c.high ? c.y + state.cam * .1 : c.y + (1 - f) * 900 * c.d;
    c.el.style.cssText = `width:${c.s * u}px;transform:translate3d(${x * u}px,${y * u}px,0);opacity:${c.high ? 1 : f}`;
  });

  const dp = state.p - lastP; lastP = state.p;
  Tito.update(dp, time);
  Drying.update(dry.q, time, FEET - 300 - state.lift);    // after Tito, so the scene poses win
  Roastery.update(roast.r, roast.k, time, FEET - 300 - state.lift);
  Flight.update(state.map, state.cam / 800, time, screenX, W, H, skyEl.style.getPropertyValue("--sky2") || "#DCEBF0");
}
gsap.ticker.add(render);

/* ---------------- chapters + photos ---------------- */
const chapters = $$(".chapter"), shots = $$(".frame .shot");
const chapterWords = chapters.map(c => splitWords(c.querySelector("h2")));
chapters.forEach((c, i) => { if (i) gsap.set(chapterWords[i], { yPercent: 110 }); });
gsap.set(chapters[0], { autoAlpha: 1 });
gsap.set(shots[0], { clipPath: "inset(0% 0% 0% 0% round 16px)" });
gsap.set(shots[0].querySelector("img"), { scale: 1, filter: "blur(0px)" });

/* ---------------- master timeline (100 units) ---------------- */
gsap.set("#bcherries circle", { scale: 0, transformOrigin: "50% 50%" });
gsap.set(["#plane", "#planeFront"], { scale: 0, svgOrigin: "100 250" });
// the sky colours live on the sky and the sun only: set on #journey they would restyle the whole world every frame
const skyEl = $("#sky"), sunEl = $("#sun");
gsap.set([skyEl, sunEl], { "--sky1": "#F3D9AE", "--sky2": "#F8ECD8", "--sun": "#FFE3A3" });
gsap.set(journey, { backgroundColor: "#F8ECD8" });

const tl = gsap.timeline({ paused: true, defaults: { ease: "none" }, onUpdate: () => hud() });

function chapterSwap(i, t) {
  const prev = chapters[i - 1], next = chapters[i];
  tl.to(prev.querySelectorAll(".w"), { yPercent: -110, duration: .8, stagger: .03, ease: "power2.in" }, t)
    .to(prev.querySelectorAll(".eyebrow, .copy, .facts"), { opacity: 0, y: -16, duration: .6 }, t)
    .set(prev, { autoAlpha: 0 }, t + 1.2)
    .set(next, { autoAlpha: 1 }, t + 1)
    .fromTo(next.querySelectorAll(".eyebrow, .copy, .facts"), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1, stagger: .2, ease: "power2.out" }, t + 1.2)
    .to(chapterWords[i], { yPercent: 0, duration: 1, stagger: .05, ease: "power3.out" }, t + 1);
  // photo: previous wipes up, next reveals from below while de-blurring
  tl.to(shots[i - 1], { clipPath: "inset(0% 0% 100% 0% round 16px)", duration: 1, ease: "power2.inOut" }, t)
    .fromTo(shots[i], { clipPath: "inset(100% 0% 0% 0% round 16px)" }, { clipPath: "inset(0% 0% 0% 0% round 16px)", duration: 1.2, ease: "power3.out" }, t + .5)
    .to(shots[i].querySelector("img"), { scale: 1, filter: "blur(0px)", duration: 2, ease: "power2.out" }, t + .5);
}
const sky = (t, d, s1, s2, sun) => tl.to([skyEl, sunEl], { "--sky1": s1, "--sky2": s2, ...(sun ? { "--sun": sun } : {}), duration: d }, t)
  .to(journey, { backgroundColor: s2, duration: d }, t);

/* 01 — FARM: walk to the bush, pick cherries */
tl.to(state, { p: 1180, duration: 10, ease: "power1.inOut" }, 0)
  .to(P, { walk: 0, reach: 1, duration: 1.5, ease: "power2.inOut" }, 10)
  .to("#pickCherries > g", { x: -30, y: 145, duration: 1, stagger: .7, ease: "power2.in" }, 11.5)
  .to("#pickCherries > g", { opacity: 0, duration: .2, stagger: .7 }, 12.3)
  .to("#bcherries circle", { scale: 1, duration: .6, stagger: .9, ease: "back.out(3)" }, 12.4)
  .to(P, { reach: 0, walk: 1, duration: 1.5, ease: "power2.inOut" }, 16.5);

/* 02 — DRY & ROAST */
chapterSwap(1, 18);
sky(18, 8, "#CFE3EA", "#F6EBD9");
tl.to("#sun", { top: "8%", left: "48%", duration: 30 }, 0)
  .fromTo(state, { p: 1180 }, { p: 2320, duration: 5.5, ease: "power1.inOut", immediateRender: false }, 18)
  .fromTo(dry, { q: 0 }, { q: 1, duration: 12, immediateRender: false, onUpdate: () => { state.p = Drying.titoX(dry.q); } }, 23.5)
  .fromTo(state, { p: 2840 }, { p: 3220, duration: 3.5, ease: "power1.inOut", immediateRender: false }, 35.5)
  // the roastery: sack into the huller, belt, roast, into the cooling tray (Tito's x comes from the scene)
  .fromTo(roast, { r: 0 }, { r: 1, duration: 6, immediateRender: false, onUpdate: () => { state.p = Roastery.titoR(roast.r); } }, 39);

/* 03 — BAG */
chapterSwap(2, 45);
// packing: bucket to the filler, the line fills, seals and dates the bags into the box he carries off
tl.fromTo(roast, { k: 0 }, { k: 1, duration: 10.5, immediateRender: false, onUpdate: () => { state.p = Roastery.titoK(roast.k); } }, 45)
  .to(P, { carry: 1, duration: .01 }, 55.49)
  .fromTo(state, { p: 4520 }, { p: 5150, duration: 6, ease: "power1.inOut", immediateRender: false }, 55.5);

/* 04 — FLIGHT */
chapterSwap(3, 59);
tl.to(P, { walk: 0, duration: .8 }, 61.5)
  .to(["#plane", "#planeFront"], { opacity: 1, scale: 1, rotation: 0, duration: 1.4, ease: "back.out(1.6)" }, 61.8)
  .to(P, { sit: 1, duration: 1, ease: "power2.inOut" }, 62.4)
  .to(state, { tilt: -7, duration: 1.5, ease: "power2.out" }, 63.5)
  .to(state, { lift: 210, duration: 5, ease: "power2.inOut" }, 63.5)
  .to(state, { cam: 800, duration: 5, ease: "power2.inOut" }, 63.8)
  .to(state, { p: 7350, duration: 16.5, ease: "power1.in" }, 63.5)
  .to(state, { tilt: 3, duration: 3, ease: "sine.inOut", yoyo: true, repeat: 3 }, 66)
  .to("#minimap", { opacity: 1, y: 0, duration: 1 }, 63)
  .fromTo(state, { map: 0 }, { map: 1, duration: 16 }, 64)
  .to("#minimap", { opacity: 0, duration: 1 }, 81);
sky(62, 5, "#8EC1DD", "#DCEBF0", "#FFF1C9");
sky(70, 8, "#E98A5B", "#F7C98F", "#FFB070");
tl.to("#sun", { top: "58%", left: "70%", duration: 14 }, 66).to("#sun", { opacity: 0, duration: 3 }, 80);
// swap the far scenery while the camera is up in the clouds
tl.to(["#farHills", "#midHills"], { opacity: 0, duration: 2 }, 70)
  .to(["#farCity", "#midCity"], { opacity: 1, duration: 2 }, 78.5);

/* 05 — LANDING + DOORSTEP */
sky(79, 6, "#3D3A68", "#D98A72");
tl.to("#dusk", { opacity: .33, duration: 5 }, 79)
  .to(".glow", { opacity: 1, duration: 2, stagger: .3 }, 81)
  .to(".cwin", { opacity: .95, duration: 3 }, 81)
  .to(state, { cam: 0, duration: 5, ease: "power2.inOut" }, 80)
  .to(state, { lift: 0, duration: 5, ease: "power2.inOut" }, 80.2)
  .to(state, { p: 7850, duration: 5, ease: "power2.out" }, 80)
  .to(state, { tilt: 5, duration: 2.5, ease: "power1.inOut", yoyo: true, repeat: 1 }, 80);
chapterSwap(4, 83);
tl.to(["#plane", "#planeFront"], { scale: 0, rotation: 25, opacity: 0, duration: .9, ease: "back.in(2)" }, 85)
  .fromTo("#puff", { opacity: 0, scale: .4, svgOrigin: "100 250" }, { opacity: 1, scale: 1.3, duration: .5 }, 85.5)
  .to("#puff", { opacity: 0, scale: 1.6, duration: .8 }, 86)
  .to(P, { sit: 0, walk: 1, duration: 1, ease: "power2.inOut" }, 85.6)
  .to(state, { p: 8380, duration: 6.5, ease: "power1.inOut" }, 86.5)
  .to(P, { walk: 0, carry: 0, duration: 1, ease: "power2.inOut" }, 93)
  .to("#box", { opacity: 0, duration: .3 }, 93.5)
  .fromTo("#dropBox", { opacity: 0, y: -40 }, { opacity: 1, y: 0, duration: .6, ease: "bounce.out" }, 93.5)
  .to(["#porchGlow", "#winLight"], { opacity: .9, duration: 1 }, 94)
  .to(P, { wave: 1, duration: .8, ease: "power2.out" }, 94.5)
  .fromTo("#wipe", { "--r": "0%" }, { "--r": "150%", duration: 3.5, ease: "power2.in" }, 97)
  .fromTo("#wipe > div > *", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, stagger: .25, ease: "power3.out" }, 99)
  .to({}, { duration: 2 });

/* ---------------- HUD ---------------- */
const nodes = $$("#routeNodes li"), fill = $("#routeFill"), dot = $("#routeDot");
const bounds = [0, 18, 45, 59, 83];
function hud() {
  const p = tl.progress(), t = tl.time();
  fill.style.transform = `scaleX(${p})`; dot.style.left = p * 100 + "%";
  const idx = bounds.filter(b => t >= b + 1).length - 1;
  nodes.forEach((n, i) => n.classList.toggle("on", i <= Math.max(0, idx)));
  $("#shotNum").textContent = String(Math.max(0, idx) + 1).padStart(2, "0");
  const x = state.p;
  // real distances: a couple of miles around the finca, the great circle to Boston, then to the door
  const miles = x < 5150 ? (x - 400) / 4750 * 2 : x < 7850 ? 2 + state.map * Flight.MILES : 2 + Flight.MILES + (x - 7850) / 530 * 6;
  $("#miles").textContent = Math.max(0, Math.round(miles)).toLocaleString("en-US");
  Flight.minimap(state.map);
}
hud();

/* ---------------- scene copy ----------------
   Within a chapter the paragraph follows the scenes: whichever paragraph's
   data-from the timeline has passed is shown, cross-fading when it changes. */
const copies = chapters.map(c => [...c.querySelectorAll(".copy p")].map(p => ({ p, from: +p.dataset.from })));
const shownCopy = copies.map(() => 0);
function sceneCopy() {
  const t = tl.time();
  copies.forEach((list, ci) => {
    let i = 0;
    list.forEach((c, j) => { if (t > c.from + .001) i = j; });
    if (i === shownCopy[ci]) return;
    const out = list[shownCopy[ci]].p, inn = list[i].p, down = i > shownCopy[ci];
    shownCopy[ci] = i;
    gsap.to(out, { autoAlpha: 0, y: down ? -10 : 10, duration: .35, ease: "power1.in", overwrite: true });
    gsap.fromTo(inn, { autoAlpha: 0, y: down ? 12 : -12 }, { autoAlpha: 1, y: 0, duration: .5, delay: .2, ease: "power2.out", overwrite: true });
  });
}
tl.eventCallback("onUpdate", () => { hud(); sceneCopy(); });

/* ---------------- one scene per scroll ----------------
   The journey is pinned and holds the page scroll. Each gesture (wheel, swipe,
   arrow keys, space, page up/down) plays the next or previous scene at its own
   fixed length, so the pace never depends on how hard someone scrolls. Gestures
   during a scene are ignored (trackpad inertia would otherwise skip ahead). Past
   the last scene the page scrolls on to the shop; before the first, back up. */
const SCENES = [   // [timeline time where the scene ends, seconds it takes]
  [10, 2.6],    // walk to the coffee
  [17.5, 2.6],  // pick the ripe cherries
  [23.5, 2],    // walk to the drying beds
  [28.7, 3.2],  // tip the basket, spread the cherries
  [35.5, 3.8],  // push the dry batch into the sack, shoulder it
  [41.4, 3.4],  // to the roastery, sack into the huller, up the belt
  [45, 3.6],    // roast, drop into the cooling tray
  [49.4, 3],    // tray into the bucket, carry it to the filler
  [51.6, 2.2],  // pour it into the filler
  [55.5, 4.2],  // fill, seal and date the bags; close and lift the box
  [63.5, 2.8],  // up the hill, the paper plane
  [80, 4.2],    // the flight
  [86.5, 2.4],  // landing
  [94.5, 2.6],  // to the door, drop the box
  [tl.duration(), 2.6],
];
const steps = (() => {
  const stops = [0, ...SCENES.map(s => s[0])];
  let locked = false, busy = false, play = null;
  const pin = ScrollTrigger.create({
    trigger: "#journey", start: "top top", end: "+=100%", pin: true, anticipatePin: 1,
    onEnter: () => { lock(); go(1); },         // the scroll that brings you here starts the first scene
    onEnterBack: () => lock(),
    onLeave: () => release(), onLeaveBack: () => release(),
  });
  const obs = Observer.create({
    target: window, type: "wheel,touch", wheelSpeed: -1, tolerance: 10, preventDefault: true,
    onUp: () => go(1), onDown: () => go(-1),
  });
  obs.disable();
  function lock() {
    if (locked) return;
    locked = true; busy = false;
    // hold the page one pixel inside the pin: exactly at its start would count as having left it
    if (lenis) { lenis.stop(); lenis.scrollTo(pin.start + 1, { immediate: true, force: true }); } else window.scrollTo(0, pin.start + 1);
    obs.enable();
  }
  function release() {
    if (!locked) return;
    locked = false; obs.disable();
    lenis && lenis.start();
  }
  function go(dir) {
    if (!locked || busy) return;
    const t = tl.time();
    const i = dir > 0 ? stops.findIndex(s => s > t + .01) : stops.findLastIndex(s => s < t - .01);
    if (i < 0) {                                          // past either end: hand the scroll back
      release();
      const y = dir > 0 ? pin.end + 2 : pin.start - window.innerHeight * .7;
      lenis ? lenis.scrollTo(y, { duration: 1.2 }) : window.scrollTo({ top: y, behavior: "smooth" });
      return;
    }
    busy = true;
    const scene = SCENES[dir > 0 ? i - 1 : i];             // the scene between the two stops
    play && play.kill();
    play = gsap.to(tl, { time: stops[i], duration: dir > 0 ? scene[1] : scene[1] * .6, ease: "sine.inOut",
      onComplete: () => gsap.delayedCall(.2, () => { busy = false; }) });
  }
  window.addEventListener("keydown", e => {
    if (!locked) return;
    const next = ["ArrowDown", "PageDown", " ", "Spacebar"].includes(e.key), prev = ["ArrowUp", "PageUp"].includes(e.key);
    if (!next && !prev) return;
    e.preventDefault(); go(next ? 1 : -1);
  });
  return { release, go };
})();

/* ---------------- shop reveals ---------------- */
$$(".js-reveal").forEach(el => gsap.from(el, { y: 50, opacity: 0, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" } }));

window.addEventListener("load", () => ScrollTrigger.refresh());
