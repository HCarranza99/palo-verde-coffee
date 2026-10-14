/* ==========================================================================
   DRYING — chapter 2's scene at the raised beds, driven by one value q (0 → 1)
   that the story timeline scrubs. Tito tips his basket onto bed 1, spreads the
   fresh cherries once, walks to bed 2 where an older batch is already dry, and
   pushes it off the end into the sack, then shoulders the sack. Nothing pops in
   or out: the basket stays on the ground, the rake goes from one bed's leg to
   the other's, and the sack drops from the rail, fills, and ends on his back.
   (Choreography tuned in design/secado.)
   ========================================================================== */
const Drying = (() => {
  const { G, FEET, TOP, BED1, BED2 } = World.DRY;
  const f1 = n => n.toFixed(1);
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smoothstep = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
  function key(frames, p) {                        // keyframes [[p, v1, v2...], ...] -> eased values at p
    if (p <= frames[0][0]) return frames[0].slice(1);
    for (let i = 0; i < frames.length - 1; i++) {
      const [p0, ...a] = frames[i], [p1, ...b] = frames[i + 1];
      if (p <= p1) { const t = smoothstep(p0, p1, p); return a.map((v, j) => v + (b[j] - v) * t); }
    }
    return frames.at(-1).slice(1);
  }

  /* ---------- beats, as fractions of q ---------- */
  const BEAT = {
    pour: [.06, .16], setDown: [.17, .22], grab: [.22, .27], spread: [.27, .43],
    walk1: [.45, .55], sackDrop: [.5, .56], push: [.58, .86], rakeBack: [.86, .9], walk2: [.88, .97], liftSack: [.97, 1],
  };
  const span = ([a, b], q) => smoothstep(a, b, q);
  const X0 = 2320, OX0 = X0 - 100;                 // where Tito stands to empty the basket
  // Tito's world x through the scene: bed 1, start of bed 2, behind the rake while pushing, by the sack
  const titoX = q => key([[0, X0], [BEAT.walk1[0], X0], [BEAT.walk1[1], 2490], [BEAT.push[0], 2490], [BEAT.push[1], 2660], [BEAT.walk2[0], 2660], [BEAT.walk2[1], 2840]], q)[0];

  /* ---------- the cherries ---------- */
  let seed = 9; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const fresh = [], dried = [];                    // bed 1: Tito's harvest; bed 2: the batch that's done
  [BED1, BED2].forEach(([x0, x1], b) => {
    [[TOP - 12, 0], [TOP - 7, 4.2], [TOP - 16, 2.1]].forEach(([y, off], row) => {
      for (let x = x0 + 10 + off; x < x1 - 8; x += row === 2 ? 12.6 : 8.4) {
        const c = { x, y: y + rnd() * 1.6 };
        if (b === 0) { c.pour = rnd(); c.hx = BED1[0] + 17 + rnd() * 62 + (rnd() - .5) * 10; c.hy = TOP - 12 - (1 - Math.abs(c.hx - BED1[0] - 48) / 40) * 14 * rnd(); fresh.push(c); }
        else { c.pile = rnd(); dried.push(c); }
      }
    });
  });
  const FRESH = ["#C02A20", "#B3261E", "#A8221B"], DRY = ["#4A1F22", "#43201F", "#552226", "#3D1F1C"];
  const cherry = (x, y, r, col) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${col}"/>`;

  /* ---------- props ---------- */
  const SACK_FOLD = [BED2[1] - 14, TOP + 26], SACK_GROUND = [BED2[1] + 34, FEET - 6];
  function sack(x, y, open, fill, rot = 0, stretch = 1) {   // (x, y) = bottom centre
    const w = lerp(26, 46, open), h = lerp(30, 20 + 36 * fill, open) * stretch;
    let g = `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)})">`;
    g += `<path d="M${f1(-w / 2)} 0 Q${f1(-w / 2 - 4 * open)} ${f1(-h * .55)} ${f1(-w * .38)} ${f1(-h)} L${f1(w * .38)} ${f1(-h)} Q${f1(w / 2 + 4 * open)} ${f1(-h * .55)} ${f1(w / 2)} 0Z" fill="#C9A978"/>`;
    g += `<path d="M${f1(-w * .42)} ${f1(-h * .35)} Q0 ${f1(-h * .3)} ${f1(w * .42)} ${f1(-h * .38)} M${f1(-w * .4)} ${f1(-h * .7)} Q0 ${f1(-h * .66)} ${f1(w * .4)} ${f1(-h * .72)}" stroke="#A88A5A" stroke-width="2.5" fill="none"/>`;
    if (open > .5) g += `<ellipse cx="0" cy="${f1(-h)}" rx="${f1(w * .38)}" ry="${f1(5 * open)}" fill="#7A5E3A"/>`;
    return g + `</g>`;
  }
  function rake(x0, y0, x1, y1) {                  // handle from (x0,y0) to the head at (x1,y1)
    const a = deg(Math.atan2(y1 - y0, x1 - x0));
    return `<path d="M${f1(x0)} ${f1(y0)} L${f1(x1)} ${f1(y1)}" stroke="#8A6040" stroke-width="5" stroke-linecap="round"/>` +
      `<g transform="translate(${f1(x1)} ${f1(y1)}) rotate(${f1(a - 90)})"><rect x="-13" y="-3" width="26" height="7" rx="3" fill="#6E4A33"/><path d="M-11 4 v7 M-5 4 v7 M1 4 v7 M7 4 v7" stroke="#6E4A33" stroke-width="2.4" stroke-linecap="round"/></g>`;
  }
  const LEAN1 = [BED1[0] - 3, 668, BED1[0] + 21, 816], LEAN2 = [BED2[1] - 22, 668, BED2[1] + 2, 816];   // leaning on a front leg
  const aimArm = (px, py, tx, ty) => deg(Math.atan2(-(tx - px), ty - py));   // rotation pointing a hanging arm at (tx,ty)

  let el = null, basketProp = "";
  function init() {
    el = { behind: document.getElementById("dryBehind"), front: document.getElementById("dryFront"), held: document.getElementById("dryHeld"),
      basket: document.getElementById("basket"), sack: document.getElementById("sack"), tito: document.getElementById("tito") };
    // a copy of Tito's basket to live in the world once he lets go of it (cherries shown, no waist strap)
    const b = el.basket.cloneNode(true);
    b.removeAttribute("id"); b.removeAttribute("style"); b.removeAttribute("opacity");
    b.querySelectorAll("[id]").forEach(n => n.id = n.id + "Prop");
    b.querySelectorAll("[clip-path]").forEach(n => n.setAttribute("clip-path", "url(#bkClipProp)"));
    b.querySelectorAll("circle").forEach(n => n.removeAttribute("style"));
    b.querySelector('path[d^="M72 194"]')?.remove();
    b.querySelector("#bcherriesProp")?.setAttribute("class", "bc");
    basketProp = b.innerHTML;
  }

  const rot = (node, a, x, y) => node.setAttribute("transform", `rotate(${f1(a)} ${x} ${y})`);
  let lastPhase = "";

  // q: scene progress; time: seconds (for the little strokes); oy: Tito's rig origin y in the world
  function update(q, time, oy) {
    if (!el) init();
    const phase = q <= 0 ? "before" : q >= 1 ? "after" : "during";
    if (phase !== "during" && phase === lastPhase) return;
    lastPhase = phase;

    const pour = span(BEAT.pour, q), setDown = span(BEAT.setDown, q), grab = span(BEAT.grab, q), spread = span(BEAT.spread, q);
    const walk1 = span(BEAT.walk1, q), sackDrop = span(BEAT.sackDrop, q), push = span(BEAT.push, q), rakeBack = span(BEAT.rakeBack, q), liftSack = span(BEAT.liftSack, q);
    const ox = titoX(q) - 100;

    // basket: lifted over bed 1, tipped, set down by Tito's right foot (rig-local centre + tilt)
    const shake = pour > 0 && pour < 1 ? Math.sin(time * 22) * 4 : 0;
    const [bcx, bcy, ba] = key([[0, 131, 225, 0], [.05, 205, 150, 0], [.065, 205, 146, 88], [.155, 205, 146, 88], [.175, 200, 168, 0], [.22, 184, 271, 0]], q);
    const mouth = [OX0 + bcx + 23 * Math.sin(rad(ba)), oy + bcy - 23 * Math.cos(rad(ba))];

    // rake head: sweeps bed 1, dragged along to bed 2, then pushes the dry batch off the end
    const holding = grab * (1 - rakeBack), stroke = phase === "during" ? Math.sin(time * 3.2) : 0;
    let rakeX = lerp(BED1[0] + 25, BED1[1] - 10, spread) + 14 * stroke * (1 - spread);
    if (q > BEAT.spread[1]) rakeX = lerp(BED1[1] - 10, BED2[0] + 16, walk1);
    if (q > BEAT.push[0]) rakeX = lerp(BED2[0] + 16, BED2[1] + 14, push);

    /* bed 1: in the basket -> arcing out -> heap -> spread */
    let behind = "";
    fresh.forEach((c, i) => {
      const rel = BEAT.pour[0] + c.pour * (BEAT.pour[1] - BEAT.pour[0] - .012), fly = clamp((q - rel) / .012);
      if (fly <= 0) return;
      let x, y;
      if (fly < 1) { x = lerp(mouth[0], c.hx, fly); y = lerp(mouth[1], c.hy, fly) - 26 * 4 * fly * (1 - fly); }
      else {
        const sp = clamp((spread * 1.35 - (c.x - BED1[0] - 15) / 230) * 4);
        x = lerp(c.hx, c.x, sp); y = lerp(c.hy, c.y, sp);
        const jig = holding * (1 - walk1) * Math.max(0, 1 - Math.abs(x - rakeX) / 28) * Math.sin(time * 18 + i) * 2.2;
        x += jig; y -= Math.abs(jig) * .6;
      }
      behind += cherry(x, y, 4.3, FRESH[i % 3]);
    });
    /* bed 2: pushed into a pile ahead of the rake, over the end, into the sack */
    const lead = rakeX + 8, END = BED2[1] - 4, mouthY = SACK_GROUND[1] - 20;
    let front = "", dropped = 0;
    dried.forEach((c, i) => {
      let x = c.x, y = c.y;
      if (q > BEAT.push[0] && lead > c.x) { x = lead + c.pile * 12; y = TOP - 12 - c.pile * 9 * clamp((lead - BED2[0] - 16) / 40); }
      const over = clamp((x - END) / 26);
      if (over > 0) {
        x = lerp(END, SACK_GROUND[0], over); y = lerp(TOP - 12, mouthY - 24 * dropped / dried.length, over) - 20 * 4 * over * (1 - over);
        if (over >= 1) { dropped++; return; }
        front += cherry(x, y, 3.5, DRY[i % 4]);
      } else behind += cherry(x, y, 3.5, DRY[i % 4]);
    });

    // sack: folded over bed 2's rail -> drops and opens -> fills -> onto Tito's back
    let sx = lerp(SACK_FOLD[0], SACK_GROUND[0], sackDrop), sy = lerp(SACK_FOLD[1], SACK_GROUND[1], sackDrop) - 26 * 4 * sackDrop * (1 - sackDrop), srot = 0, stretch = 1;
    if (liftSack > 0) { sx = lerp(sx, ox + 63, liftSack); sy = lerp(sy, oy + 222, liftSack) - 50 * 4 * liftSack * (1 - liftSack); srot = lerp(0, -8, liftSack); stretch = lerp(1, 1.6, liftSack); }
    const sackSvg = q < 1 ? sack(sx, sy, sackDrop, dropped / dried.length, srot, stretch) : "";
    if (sackDrop < .5) behind += sackSvg; else front += sackSvg;
    // basket in the world once Tito has picked it up: held in front of him, then on the ground behind him
    const basket = q > 0 ? `<g transform="translate(${f1(OX0 + bcx - 131)} ${f1(oy + bcy - 225)}) rotate(${f1(ba + shake)} 131 225)">${basketProp.replace('class="bc"', `opacity="${f1(1 - pour)}"`)}</g>` : "";
    let held = setDown < 1 ? basket : "";
    if (setDown >= 1) front += basket;

    // rake: the handle runs through Tito's right hand to the head on the bed; leaning on a leg otherwise
    const A = armPose(q, { bcx: bcx + OX0 - ox, bcy, holding, stroke: stroke * (1 - spread) + stroke * .4 * push });
    const a1 = rad(A.armR), a2 = rad(A.armR + A.foreR);
    const hx = ox + 118 - 38 * Math.sin(a1) - 34 * Math.sin(a2), hy = oy + 150 + 38 * Math.cos(a1) + 34 * Math.cos(a2);
    const head = [rakeX, TOP - 10], L = Math.hypot(head[0] - hx, head[1] - hy) || 1;
    const inHand = [hx - (head[0] - hx) / L * 40, hy - (head[1] - hy) / L * 40, head[0], head[1]];
    const lean = q < BEAT.push[1] ? LEAN1 : LEAN2;
    const rk = rake(...lean.map((v, i) => lerp(v, inHand[i], holding)));
    if (holding > 0) held += rk; else front += rk;

    el.behind.innerHTML = behind; el.front.innerHTML = front; el.held.innerHTML = held;

    // Tito: arms on the basket / rake, facing the beds; rig basket and sack hand over to the world copies
    if (phase === "during") {
      el.tito.style.transform = "";
      if (A.active) {
        rot(document.getElementById("armR"), A.armR, 118, 150); rot(document.getElementById("foreR"), A.foreR, 118, 188);
        rot(document.getElementById("armL"), A.armL, 82, 150); rot(document.getElementById("foreL"), A.foreL, 82, 188);
        rot(document.getElementById("head"), A.head, 100, 132);
      }
    }
    gsap.set(el.basket, { opacity: q <= 0 ? 1 : 0 });
    gsap.set(el.sack, { opacity: q >= 1 ? 1 : 0 });
  }

  // arm angles: follow the basket, then hold the rake (pushing in small strokes), then let go
  function armPose(q, { bcx, bcy, holding, stroke }) {
    const basketHold = q > 0 ? 1 - smoothstep(BEAT.setDown[1] - .005, BEAT.grab[0] + .015, q) : 0;
    if (basketHold <= 0 && holding <= 0) return { active: false, armR: 0, foreR: 0 };
    const k = stroke;
    if (basketHold >= holding) {
      const w = basketHold;
      return { active: true, armR: aimArm(118, 150, bcx + 20, bcy - 18) * w, foreR: 0, armL: aimArm(82, 150, bcx - 20, bcy - 18) * w, foreL: 0, head: 5 * w };
    }
    const w = holding;
    return { active: true, armR: (-72 + 8 * k) * w, foreR: (-18 + 5 * k) * w, armL: (-64 + 8 * k) * w, foreL: (-22 + 5 * k) * w, head: 7 * w };
  }

  return { update, titoX };
})();
