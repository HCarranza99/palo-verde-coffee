/* ==========================================================================
   STORY — preloader, smooth scroll, hero, and the pinned scrollytelling
   timeline that drives the world camera, Tito's poses, copy and photos.
   ========================================================================== */
gsap.registerPlugin(ScrollTrigger);
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

/* ---------------- preloader ---------------- */
function preload() {
  const urls = [...$$("img")].map(i => i.src);
  urls.push("https://images.unsplash.com/photo-1559556064-4161b6be179b?w=2000&q=75&auto=format");
  let done = 0; const counter = { v: 0 };
  const tick = () => {
    gsap.to(counter, { v: Math.round(++done / urls.length * 100), duration: .4, onUpdate: () => {
      $("#pct").textContent = Math.round(counter.v); $("#bar").style.width = counter.v + "%";
    }});
  };
  const loads = urls.map(u => new Promise(r => { const im = new Image(); im.onload = im.onerror = () => { tick(); r(); }; im.src = u; }));
  const timeout = new Promise(r => setTimeout(r, 6000));
  return Promise.race([Promise.all([...loads, document.fonts.ready, new Promise(r => setTimeout(r, 1200))]), timeout]);
}

const heroWords = splitWords($("#heroTitle"));
gsap.set(heroWords, { yPercent: 110 });
gsap.set(".hero-fade", { opacity: 0, y: 20 });

preload().then(() => {
  $("#pct").textContent = "100"; $("#bar").style.width = "100%";
  const tl = gsap.timeline({ onComplete: () => { document.body.classList.remove("loading"); lenis && lenis.start(); ScrollTrigger.refresh(); } });
  tl.to("#loader .mark", { opacity: 0, y: -20, duration: .5 }, .2)
    .to("#loader", { yPercent: -100, duration: 1.1, ease: "power4.inOut" }, .4)
    .from("#heroMedia", { scale: 1.25, duration: 2.2, ease: "power3.out" }, .5)
    .to(heroWords, { yPercent: 0, duration: 1.2, stagger: .07, ease: "power4.out" }, .9)
    .to(".hero-fade", { opacity: 1, y: 0, duration: 1, stagger: .12, ease: "power3.out" }, 1.3)
    .set("#loader", { display: "none" });
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
const L = { far: $("#lFar"), mid: $("#lMid"), main: $("#lMain"), fore: $("#lFore") };
const state = { p: 400, cam: 0, lift: 0, tilt: 0, map: 0 };   // p = Tito's world x
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
  L.main.style.transform = `translate3d(${base}px, ${state.cam * u}px,0)`;
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
journey.style.setProperty("--sky1", "#F3D9AE"); journey.style.setProperty("--sky2", "#F8ECD8"); journey.style.setProperty("--sun", "#FFE3A3");

const tl = gsap.timeline({
  defaults: { ease: "none" },
  scrollTrigger: { trigger: "#journey", start: "top top", end: "+=1300%", scrub: 1, pin: true, anticipatePin: 1, onUpdate: hud }
});

function chapterSwap(i, t) {
  const prev = chapters[i - 1], next = chapters[i];
  tl.to(prev.querySelectorAll(".w"), { yPercent: -110, duration: .8, stagger: .03, ease: "power2.in" }, t)
    .to(prev.querySelectorAll(".eyebrow, p, .facts"), { opacity: 0, y: -16, duration: .6 }, t)
    .set(prev, { autoAlpha: 0 }, t + 1.2)
    .set(next, { autoAlpha: 1 }, t + 1)
    .fromTo(next.querySelectorAll(".eyebrow, p, .facts"), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1, stagger: .2, ease: "power2.out" }, t + 1.2)
    .to(chapterWords[i], { yPercent: 0, duration: 1, stagger: .05, ease: "power3.out" }, t + 1);
  // photo: previous wipes up, next reveals from below while de-blurring
  tl.to(shots[i - 1], { clipPath: "inset(0% 0% 100% 0% round 16px)", duration: 1, ease: "power2.inOut" }, t)
    .fromTo(shots[i], { clipPath: "inset(100% 0% 0% 0% round 16px)" }, { clipPath: "inset(0% 0% 0% 0% round 16px)", duration: 1.2, ease: "power3.out" }, t + .5)
    .to(shots[i].querySelector("img"), { scale: 1, filter: "blur(0px)", duration: 2, ease: "power2.out" }, t + .5);
}
const sky = (t, d, s1, s2, sun) => tl.to(journey, { "--sky1": s1, "--sky2": s2, ...(sun ? { "--sun": sun } : {}), duration: d }, t);

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
  .to(state, { p: 2560, duration: 13, ease: "power1.inOut" }, 18)
  .to("#basket", { opacity: 0, duration: .6 }, 29.5)
  .to("#sack", { opacity: 1, duration: .6 }, 29.8)
  .to(state, { p: 3220, duration: 8, ease: "power1.inOut" }, 31)
  .fromTo("#smoke .puff", { y: 0, scale: .8 }, { y: -260, scale: 1.6, opacity: 0, duration: 16, stagger: 1.5 }, 30)
  .to(P, { walk: 0, duration: 1 }, 38.5)
  .to("#sack", { opacity: 0, y: -20, duration: .8 }, 39.5)
  .to("#drum", { rotation: 1080, svgOrigin: "3490 663", duration: 9 }, 38.5)
  .to("#coolBeans ellipse", { fill: "#4A2A16", duration: 4, stagger: .15 }, 40)
  .to(P, { walk: 1, duration: 1 }, 45);

/* 03 — BAG */
chapterSwap(2, 45);
tl.to(state, { p: 4300, duration: 10, ease: "power1.inOut" }, 45.5)
  .to("#bags", { x: 240, duration: 8 }, 47)
  .to("#stamp", { y: 46, duration: .6, yoyo: true, repeat: 5, ease: "power2.in" }, 49)
  .to("#box", { opacity: 1, duration: .5 }, 53.5)
  .to(P, { carry: 1, duration: 1, ease: "power2.out" }, 53.3)
  .to(state, { p: 5150, duration: 6, ease: "power1.inOut" }, 55.5);

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
const flightPath = $("#flightPath"), flen = flightPath.getTotalLength();
flightPath.style.strokeDasharray = flen;
const bounds = [0, 18, 45, 59, 83];
function hud(self) {
  const p = self.progress, t = tl.time();
  fill.style.transform = `scaleX(${p})`; dot.style.left = p * 100 + "%";
  const idx = bounds.filter(b => t >= b + 1).length - 1;
  nodes.forEach((n, i) => n.classList.toggle("on", i <= Math.max(0, idx)));
  $("#shotNum").textContent = String(Math.max(0, idx) + 1).padStart(2, "0");
  const x = state.p;
  const miles = x < 5150 ? (x - 400) / 4750 * 18 : x < 7850 ? 18 + (x - 5150) / 2700 * 2829 : 2847 + (x - 7850) / 530 * 6;
  $("#miles").textContent = Math.max(0, Math.round(miles)).toLocaleString("en-US");
  flightPath.style.strokeDashoffset = flen * (1 - state.map);
  const pt = flightPath.getPointAtLength(flen * state.map), pt2 = flightPath.getPointAtLength(Math.min(flen, flen * state.map + 1));
  $("#mapPlane").setAttribute("transform", `translate(${pt.x} ${pt.y}) rotate(${Math.atan2(pt2.y - pt.y, pt2.x - pt.x) * 57.3})`);
}
hud({ progress: 0 });

/* ---------------- shop reveals ---------------- */
$$(".js-reveal").forEach(el => gsap.from(el, { y: 50, opacity: 0, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" } }));

window.addEventListener("load", () => ScrollTrigger.refresh());
