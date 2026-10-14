/* ==========================================================================
   ROASTERY + PACKING — two scenes driven by two values the story timeline
   scrubs: r (roastery, 0 → 1) and k (packing, 0 → 1).
   Roastery: Tito empties the sack into the huller, the green coffee rides a
   belt up to the roaster, roasts (the sight glass shows its colour) and drops
   into the cooling tray when he pulls the lever.
   Packing: the tray's gate empties into a bucket, Tito carries it to the
   filler, and the line fills, heat-seals and dates each bag into a box that
   he closes and lifts. Nothing pops in or out. (Tuned in design/tostaduria
   and design/empaque.)
   ========================================================================== */
const Roastery = (() => {
  const { G, FEET } = World.DRY;
  const f1 = n => n.toFixed(1);
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smoothstep = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const mix = (a, b, t) => "#" + [1, 3, 5].map(i => Math.round(parseInt(a.substr(i, 2), 16) * (1 - t) + parseInt(b.substr(i, 2), 16) * t).toString(16).padStart(2, "0")).join("");
  const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
  const aimArm = (px, py, tx, ty) => deg(Math.atan2(-(tx - px), ty - py));
  function key(frames, p) {
    if (p <= frames[0][0]) return frames[0].slice(1);
    for (let i = 0; i < frames.length - 1; i++) {
      const [p0, ...a] = frames[i], [p1, ...b] = frames[i + 1];
      if (p <= p1) { const t = smoothstep(p0, p1, p); return a.map((v, j) => v + (b[j] - v) * t); }
    }
    return frames.at(-1).slice(1);
  }
  const dot = (x, y, r, c) => `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(r)}" ry="${f1(r * .78)}" fill="${c}"/>`;
  const puff = (x, y, r, c, o) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${c}" opacity="${f1(o)}"/>`;

  /* ---------- beats ---------- */
  const RB = { walk1: [0, .07], lift: [.08, .16], pour: [.16, .3], dropSack: [.3, .35], hull: [.2, .42], belt: [.24, .5],
    walk2: [.44, .52], roast: [.5, .8], lever: [.76, .82], dump: [.82, .93], cool: [.88, 1] };
  const KB = { gate: [0, .05], toBucket: [.04, .2], walk1: [.02, .16], pick: [.2, .25], walk2: [.26, .42],
    lift: [.42, .49], pour: [.48, .58], setDown: [.58, .63], machine: [.58, .88], walk3: [.86, .92], flaps: [.92, .95], liftBox: [.95, 1] };
  const span = ([a, b], p) => smoothstep(a, b, p);
  // where Tito stands through both scenes
  const titoR = r => key([[0, 3220], [.07, 3290], [.44, 3290], [.52, 3400]], r)[0];
  const titoK = k => key([[0, 3400], [KB.walk1[0], 3400], [KB.walk1[1], 3760], [KB.walk2[0], 3760], [KB.walk2[1], 4140], [KB.walk3[0], 4140], [KB.walk3[1], 4520]], k)[0];

  /* ---------- the roastery machines ---------- */
  const HULL_MOUTH = [3360, 650], HULL_OUT = [3402, 792], BELT_TOP = [3494, 576], HOPPER = [3513, 592];
  const SPOUT = [3556, 742], TRAY = [3700, 772, 78, 16];
  const ROAST = ["#93A862", "#C9BD72", "#C9944F", "#8C5A30", "#5A3820", "#43281A"];
  const roastCol = r => { const s = clamp(r) * (ROAST.length - 1), i = Math.min(ROAST.length - 2, Math.floor(s)); return mix(ROAST[i], ROAST[i + 1], s - i); };
  const CHERRY = "#4A1F22", GREEN = "#93A862", BEANS = ["#5A3820", "#6E4628", "#5A3820"];

  function huller(shake, run, t) {          // small teal machine: funnel on top, chaff vent left, pulley
    let s = `<g transform="translate(${f1(shake * Math.sin(t * 60) * 1.4)} 0)">`;
    s += `<rect x="3322" y="${G - 128}" width="76" height="128" rx="6" fill="#4F7A6A"/><rect x="3380" y="${G - 128}" width="18" height="128" rx="4" fill="#3F6556"/>`;
    s += `<rect x="3300" y="${G - 108}" width="24" height="14" rx="3" fill="#3F6556"/>`;
    s += `<path d="M3316 650 L3404 650 L3384 ${G - 128} L3336 ${G - 128}Z" fill="#5E8C7A"/><rect x="3313" y="645" width="94" height="8" rx="3" fill="#3F6556"/>`;
    s += `<g transform="rotate(${f1((run * t * 900) % 360)} 3360 765)"><circle cx="3360" cy="765" r="14" fill="#2F4A40"/><path d="M3346 765 H3374 M3360 751 V779" stroke="#8DB0A0" stroke-width="3"/></g>`;
    return s + `<path d="M3398 ${G - 34} L3412 ${G - 22}" stroke="#3F6556" stroke-width="10" stroke-linecap="round"/></g>`;
  }
  function belt(run, t) {                   // inclined belt from the huller up to the roaster's hopper
    const [x0, y0] = [3410, G - 20], [x1, y1] = BELT_TOP;
    let s = `<path d="M${x0 + 10} ${G} L${x0 + 18} ${y0 - 8} M${(x0 + x1) / 2 + 8} ${G} L${(x0 + x1) / 2 + 8} ${(y0 + y1) / 2 + 8}" stroke="#5A4436" stroke-width="6"/>`;
    s += `<path d="M${x0} ${y0} L${x1} ${y1}" stroke="#4A372B" stroke-width="18" stroke-linecap="round"/>`;
    return s + `<path d="M${x0} ${y0} L${x1} ${y1}" stroke="#7A6450" stroke-width="12" stroke-linecap="round" stroke-dasharray="6 10" stroke-dashoffset="${f1(-(run * t * 60) % 16)}"/>`;
  }
  function roaster(spin, roastP, flame, door, lever, t) {
    let s = `<path d="M3610 618 V565 H3823" stroke="#5A4436" stroke-width="16" fill="none" stroke-linejoin="round"/>`;
    s += `<path d="M3478 560 L3548 560 L3528 600 L3498 600Z" fill="#B4452A"/><rect x="3475" y="555" width="76" height="8" rx="3" fill="#8E3420"/><rect x="3505" y="598" width="16" height="22" fill="#3A2A20"/>`;
    s += `<rect x="3478" y="${G - 82}" width="154" height="82" rx="6" fill="#3A2A20"/><rect x="3528" y="${G - 52}" width="56" height="30" rx="5" fill="#1E1410"/>`;
    if (flame > .02) for (let i = 0; i < 4; i++) {
      const h = (10 + 8 * Math.sin(t * 14 + i * 1.7)) * flame, x = 3536 + i * 12;
      s += `<path d="M${x} ${G - 24} q5 ${f1(-h)} 10 0z" fill="${i % 2 ? "#F2A33A" : "#5FA8E0"}"/>`;
    }
    s += `<rect x="3470" y="618" width="170" height="120" rx="18" fill="#C65A2E"/><rect x="3470" y="700" width="170" height="38" rx="10" fill="#A9461F"/>`;
    s += `<circle cx="3555" cy="678" r="52" fill="#2A1B12"/><circle cx="3555" cy="678" r="44" fill="#3E2A1E"/>`;
    s += `<g transform="rotate(${f1(spin % 360)} 3555 678)"><path d="M3555 638 V718 M3515 678 H3595 M3527 650 L3583 706 M3583 650 L3527 706" stroke="#7A5638" stroke-width="6"/></g>`;
    s += `<circle cx="3555" cy="678" r="17" fill="${roastP > 0 ? roastCol(roastP) : "#3E2A1E"}" stroke="#D9C4A0" stroke-width="4"/><path d="M3546 671 l8 -6" stroke="#fff" stroke-width="3" opacity=".5" stroke-linecap="round"/>`;
    const na = lerp(-120, 60, roastP);
    s += `<circle cx="3620" cy="642" r="13" fill="#F3EBDD" stroke="#3A2A20" stroke-width="3"/><path d="M3620 642 l${f1(9 * Math.sin(rad(na)))} ${f1(-9 * Math.cos(rad(na)))}" stroke="#B4452A" stroke-width="2.5" stroke-linecap="round"/>`;
    s += `<path d="M${SPOUT[0] + 8} ${SPOUT[1] + 4} L${TRAY[0] - 40} ${TRAY[1] - 6}" stroke="#5A4436" stroke-width="12" stroke-linecap="round"/>`;
    s += `<g transform="rotate(${f1(-70 * door)} ${SPOUT[0] - 14} ${SPOUT[1] - 10})"><rect x="${SPOUT[0] - 14}" y="${SPOUT[1] - 10}" width="30" height="14" rx="3" fill="#2A1B12"/></g>`;
    return s + `<circle cx="3484" cy="700" r="5" fill="#2A1B12"/><path d="M3484 700 l${f1(-26 * Math.sin(rad(30 - 60 * lever)))} ${f1(-26 * Math.cos(rad(30 - 60 * lever)))}" stroke="#2A1B12" stroke-width="5" stroke-linecap="round"/>`;
  }
  function tray(gate) {                     // steel cooling tray with a gate on its right
    const [cx, cy, rx, ry] = TRAY;
    return `<rect x="${cx - 46}" y="${cy}" width="92" height="${G - cy}" fill="#2A1B12"/><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#5E5650"/><ellipse cx="${cx}" cy="${cy + 2}" rx="${rx - 8}" ry="${ry - 4}" fill="#A39A90"/>` +
      `<g transform="rotate(${f1(-80 * gate)} ${cx + rx - 4} ${cy - 6})"><rect x="${cx + rx - 4}" y="${cy - 6}" width="6" height="14" rx="2" fill="#3A3430"/></g>`;
  }
  function trayArms(stir) {
    const [cx, cy, rx, ry] = TRAY;
    let s = "";
    for (const o of [0, Math.PI]) { const a = stir + o; s += `<path d="M${cx} ${cy} L${f1(cx + (rx - 14) * Math.cos(a))} ${f1(cy + (ry - 5) * Math.sin(a))}" stroke="#3A3430" stroke-width="3.5" stroke-linecap="round"/>`; }
    return s + `<circle cx="${cx}" cy="${cy}" r="5" fill="#3A3430"/>`;
  }
  function sack(cx, cy, fill, rot, flat = 0) {   // around its centre so it can be tipped
    const w = 46, h = lerp(20 + 36 * fill, 10, flat);
    let g = `<g transform="translate(${f1(cx)} ${f1(cy)}) rotate(${f1(rot)})">`;
    g += `<path d="M${-w / 2} ${f1(h / 2)} Q${-w / 2 - 4} ${f1(-h * .05)} ${f1(-w * .38)} ${f1(-h / 2)} L${f1(w * .38)} ${f1(-h / 2)} Q${w / 2 + 4} ${f1(-h * .05)} ${w / 2} ${f1(h / 2)}Z" fill="#C9A978"/>`;
    g += `<path d="M${f1(-w * .42)} ${f1(h * .15)} Q0 ${f1(h * .2)} ${f1(w * .42)} ${f1(h * .12)}" stroke="#A88A5A" stroke-width="2.5" fill="none"/>`;
    return g + `<ellipse cx="0" cy="${f1(-h / 2)}" rx="${f1(w * .38)}" ry="5" fill="#7A5E3A"/></g>`;
  }

  /* ---------- the packing line ---------- */
  const BELT_Y = 790, SLOTS = [4180, 4250, 4320, 4390, 4460, 4530], FILL_AT = 1, SEAL_AT = 3, CODE_AT = 4;
  const STACK = [4140, BELT_Y], BOX = [4575, 846, 60, 48], BUCKET_FLOOR = [3812, G], BUCKET_REST = [4196, FEET - 4];
  const NB = 4, CYCLES = NB + SLOTS.length;
  function conveyor() {
    let s = `<rect x="4150" y="${BELT_Y}" width="420" height="12" rx="6" fill="#2E2A2A"/><path d="M4156 ${BELT_Y + 6} H4564" stroke="#6E6862" stroke-width="6" stroke-dasharray="8 8"/>`;
    for (const x of [4170, 4360, 4548]) s += `<rect x="${x}" y="${BELT_Y + 12}" width="10" height="${G - BELT_Y - 12}" fill="#4A372B"/>`;
    return s + `<rect x="${STACK[0] - 22}" y="${BELT_Y - 4}" width="40" height="6" rx="2" fill="#4A372B"/>`;
  }
  function filler(grams) {                  // hopper, column and nozzle over slot 1, with a scale display
    const x = SLOTS[FILL_AT];
    let s = `<rect x="${x + 34}" y="660" width="10" height="${G - 660}" fill="#4A372B"/>`;
    s += `<path d="M${x - 32} 690 L${x + 32} 690 L${x + 12} 716 L${x - 12} 716Z" fill="#9AA3A8"/><rect x="${x - 35}" y="685" width="70" height="8" rx="3" fill="#6E777C"/>`;
    s += `<rect x="${x - 14}" y="716" width="28" height="18" rx="4" fill="#7E878C"/><rect x="${x - 5}" y="734" width="10" height="6" fill="#5A6266"/>`;
    return s + `<rect x="${x + 16}" y="712" width="34" height="18" rx="3" fill="#1E2A26"/><text x="${x + 33}" y="725" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="10" fill="#7CE0A8">${grams}g</text>`;
  }
  function sealer(press) {                  // heated bar over slot 3
    const x = SLOTS[SEAL_AT], y = lerp(706, 736, press);
    let s = `<rect x="${x - 34}" y="680" width="8" height="${BELT_Y - 680}" fill="#4A372B"/><rect x="${x + 26}" y="680" width="8" height="${BELT_Y - 680}" fill="#4A372B"/><rect x="${x - 36}" y="674" width="72" height="10" rx="3" fill="#3A2A20"/>`;
    return s + `<rect x="${x - 3}" y="684" width="6" height="${f1(y - 684)}" fill="#6E6862"/><rect x="${x - 22}" y="${f1(y)}" width="44" height="9" rx="2" fill="${mix("#6E6862", "#E8742E", press)}"/>`;
  }
  function coder(spray, t) {                // ink-jet date coder over slot 4
    const x = SLOTS[CODE_AT];
    let s = `<rect x="${x + 26}" y="690" width="8" height="${BELT_Y - 690}" fill="#4A372B"/><rect x="${x - 4}" y="702" width="38" height="22" rx="4" fill="#2E2A2A"/><rect x="${x - 2}" y="724" width="8" height="8" fill="#1E1410"/>`;
    if (spray > 0) for (let i = 0; i < 5; i++) s += `<circle cx="${f1(x + 2 + Math.sin(t * 40 + i) * 3)}" cy="${f1(736 + ((t * 120 + i * 7) % 20))}" r="1.3" fill="#B4452A"/>`;
    return s;
  }
  function bag(x, base, fill, sealed, dated, tilt = 0) {
    const w = lerp(30, 34, fill), h = lerp(34, 46, fill);
    let s = `<g transform="rotate(${f1(tilt)} ${f1(x)} ${f1(base - h / 2)})">`;
    s += `<path d="M${f1(x - w / 2)} ${base} v${f1(-h + 6)} q0 -6 6 -6 h${f1(w - 12)} q6 0 6 6 v${f1(h - 6)}z" fill="#C8955A"/>`;
    s += `<rect x="${f1(x - w / 2)}" y="${f1(base - h)}" width="${f1(w)}" height="7" fill="${sealed ? "#8E6232" : "#B07E46"}"/>`;
    if (sealed) s += `<path d="M${f1(x - w / 2 + 2)} ${f1(base - h + 3.5)} h${f1(w - 4)}" stroke="#C8955A" stroke-width="1" stroke-dasharray="2 2"/>`;
    s += `<rect x="${f1(x - w / 2 + 5)}" y="${f1(base - h * .66)}" width="${f1(w - 10)}" height="${f1(h * .42)}" rx="2" fill="#3F5A38"/>`;
    s += `<text x="${f1(x)}" y="${f1(base - h * .4)}" text-anchor="middle" font-family="Fraunces" font-size="9" fill="#F3EBDD">PV</text>`;
    if (dated) s += `<path d="M${f1(x - 7)} ${f1(base - h * .3)} h14" stroke="#B4452A" stroke-width="1.6" stroke-dasharray="2 1"/>`;
    return s + `</g>`;
  }
  function bucket(cx, cy, fill, rot) {
    let g = `<g transform="translate(${f1(cx)} ${f1(cy)}) rotate(${f1(rot)})"><path d="M-17 -16 L17 -16 L13 16 L-13 16Z" fill="#9AA3A8"/><rect x="-17" y="-4" width="34" height="5" fill="#7E878C"/><ellipse cx="0" cy="-16" rx="17" ry="4" fill="#5A6266"/>`;
    if (fill > .02) g += `<ellipse cx="0" cy="${f1(-16 + (1 - fill) * 8)}" rx="${f1(15 - (1 - fill) * 3)}" ry="3.4" fill="#5A3820"/>`;
    return g + `<path d="M-16 -15 Q0 -38 16 -15" stroke="#6E777C" stroke-width="2.4" fill="none"/></g>`;
  }
  function box(flaps) {
    const [x, b, w, h] = BOX, top = b - h;
    const fl = (side, a) => `<g transform="rotate(${f1(a * side)} ${side < 0 ? x : x + w} ${top})"><rect x="${side < 0 ? x - 26 : x + w}" y="${top - 3}" width="26" height="6" rx="2" fill="#A8743F"/></g>`;
    return `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="3" fill="#B9844E"/><rect x="${x + w / 2 - 5}" y="${top}" width="10" height="${h}" fill="#E0C79E"/>` + fl(-1, lerp(-75, 0, flaps)) + fl(1, lerp(75, 0, flaps));
  }

  let seed = 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const N = 46, BEAN = Array.from({ length: N }, (_, i) => ({ k: i / N, j: rnd(), a: rnd() * Math.PI * 2, r: Math.sqrt(rnd()) }));

  let el = null, last = "";
  const $ = id => document.getElementById(id);
  const rot = (id, a, x, y) => $(id).setAttribute("transform", `rotate(${f1(a)} ${x} ${y})`);

  function update(r, k, time, oy) {
    if (!el) el = { dyn: $("roastDyn"), tito: $("tito"), sack: $("sack"), box: $("box") };
    const active = (r > 0 && r < 1) || (k > 0 && k < 1);
    const state = active ? "" : `${r <= 0 ? 0 : 1}${k <= 0 ? 0 : 1}`;
    if (!active && state === last) return;
    last = state;
    const t = time;
    let s = "";

    /* ===== roastery ===== */
    const lift = span(RB.lift, r), pour = span(RB.pour, r), dropSack = span(RB.dropSack, r), hull = span(RB.hull, r);
    const roastP = span(RB.roast, r), cool = span(RB.cool, r);
    const lever = key([[RB.lever[0], 0], [RB.lever[0] + .03, 1], [RB.dump[1], 1], [RB.dump[1] + .04, 0]], r)[0];
    const running = r > RB.hull[0] && r < RB.belt[1] + .02 ? 1 : 0, roasting = r > RB.roast[0] - .03 && r < RB.dump[1] ? 1 : 0;
    const door = smoothstep(RB.lever[0] + .02, RB.dump[0] + .01, r) * (1 - smoothstep(RB.dump[1], RB.dump[1] + .04, r));
    const inRoast = k <= 0;
    const P = inRoast ? titoR(r) : titoK(k), ox = P - 100;

    s += belt(running, t) + huller(running * (1 - hull * .3), running, t);
    s += roaster(t * 260 * (roasting || (r > RB.belt[0] && r < 1) ? 1 : 0), r > RB.belt[1] - .05 ? roastP : 0, roasting * (.4 + .6 * roastP), door, lever, t);
    const gate = span(KB.gate, k);
    s += tray(gate);
    // chimney: a thin wisp, thick while roasting
    const smoke = .2 + .8 * roastP * (1 - cool * .6);
    for (let i = 0; i < 5; i++) { const q = (t * .25 + i / 5) % 1; s += puff(3823 + q * 40, G - 790 - q * 260, 20 + q * 30, "#F3EEE6", (1 - q) * .8 * smoke); }

    // the sack: off Tito's back, over the huller, tipped, empty on the floor
    const backPos = [ox + 63, oy + 176], overPos = [3332, 600], groundPos = [3200, FEET - 10];
    let sx = lerp(backPos[0], overPos[0], lift), sy = lerp(backPos[1], overPos[1], lift) - 30 * 4 * lift * (1 - lift);
    if (dropSack > 0) { sx = lerp(overPos[0], groundPos[0], dropSack); sy = lerp(overPos[1], groundPos[1], dropSack) - 40 * 4 * dropSack * (1 - dropSack); }
    const sackRot = dropSack > 0 ? lerp(135, 0, dropSack) : lerp(0, 135, pour);
    const mouth = [sx + 28 * Math.sin(rad(sackRot)), sy - 28 * Math.cos(rad(sackRot))];
    if (r >= RB.lift[0]) s += sack(sx, sy, 1 - pour, sackRot, dropSack);

    BEAN.forEach((b, i) => {
      // dried cherries pouring into the huller
      const rel = RB.pour[0] + .02 + b.k * (RB.pour[1] - RB.pour[0] - .05), f = clamp((r - rel) / .03);
      if (f > 0 && f < 1) s += dot(lerp(mouth[0], HULL_MOUTH[0] + (b.j - .5) * 30, f), lerp(mouth[1], HULL_MOUTH[1], f) - 14 * 4 * f * (1 - f), 4.2, CHERRY);
      // green coffee riding the belt and dropping into the hopper
      const bOut = RB.belt[0] + b.k * (RB.belt[1] - RB.belt[0] - .06), up = clamp((r - bOut) / .05);
      if (up > 0 && up < 1) s += dot(lerp(HULL_OUT[0] + 8, BELT_TOP[0], up), lerp(HULL_OUT[1] - 8, BELT_TOP[1] - 8, up), 3.6, GREEN);
      const fall = clamp((r - bOut - .05) / .012);
      if (fall > 0 && fall < 1) s += dot(lerp(BELT_TOP[0], HOPPER[0], fall), lerp(BELT_TOP[1] - 8, HOPPER[1], fall) - 10 * 4 * fall * (1 - fall), 3.6, GREEN);
    });
    if (running && hull < 1) for (let i = 0; i < 4; i++) { const q = (t * 1.6 + i / 4) % 1; s += puff(3300 - q * 50, G - 102 - q * 30, 5 + q * 9, "#D9C49A", (1 - q) * .8); }

    /* ===== packing ===== */
    const toBucket = span(KB.toBucket, k), pick = span(KB.pick, k), kLift = span(KB.lift, k), kPour = span(KB.pour, k), setDown = span(KB.setDown, k);
    const mach = clamp((k - KB.machine[0]) / (KB.machine[1] - KB.machine[0])), flaps = span(KB.flaps, k), liftBox = span(KB.liftBox, k);
    // the bucket hangs from Tito's right hand: arm angle first, the bucket follows the hand
    const grabAt = KB.pick[0] + .025, aPick = aimArm(118, 150, BUCKET_FLOOR[0] - ox, BUCKET_FLOOR[1] - 42 - oy);
    const armA = key([[KB.pick[0], 0], [grabAt, aPick], [KB.pick[1], -40], [KB.lift[0], -40], [KB.lift[1], -125], [KB.setDown[0], -125], [KB.setDown[1], 0]], k)[0];
    const hand = [ox + 118 - 72 * Math.sin(rad(armA)), oy + 150 + 72 * Math.cos(rad(armA))];
    let [bx, by, br] = [BUCKET_FLOOR[0], BUCKET_FLOOR[1] - 16, 0];
    if (k > grabAt && k < KB.setDown[0]) { bx = hand[0] + lerp(0, 14, kLift); by = hand[1] + lerp(26, -4, kLift); br = lerp(0, 115, kPour); }
    if (setDown > 0) {
      const from = [ox + 118 - 72 * Math.sin(rad(-125)) + 14, oy + 150 + 72 * Math.cos(rad(-125)) - 4];
      bx = lerp(from[0], BUCKET_REST[0], setDown); by = lerp(from[1], BUCKET_REST[1] - 16, setDown) - 30 * 4 * setDown * (1 - setDown); br = lerp(115, 0, setDown);
    }
    const bmouth = [bx + 16 * Math.sin(rad(br)), by - 16 * Math.cos(rad(br))];

    // roasted beans: door -> tray (roastery), stirred, out of the gate into the bucket, then into the filler
    BEAN.forEach((b, i) => {
      const dRel = RB.dump[0] + .01 + b.k * (RB.dump[1] - RB.dump[0] - .04), d = clamp((r - dRel) / .025);
      if (d <= 0) return;
      const [cx, cy, rx, ry] = TRAY, a = b.a + cool * 2.2 * (1 - b.r * .3) + (k > 0 ? t * .6 : 0);
      const tx = cx + Math.cos(a) * (rx - 16) * b.r, ty = cy + Math.sin(a) * (ry - 6) * b.r;
      const out = clamp((toBucket * 1.15 - b.k) * 6);
      if (out >= 1) {
        const pr = KB.pour[0] + .01 + b.k * (KB.pour[1] - KB.pour[0] - .04), f = clamp((k - pr) / .025);
        if (f > 0 && f < 1) s += dot(lerp(bmouth[0], SLOTS[FILL_AT], f), lerp(bmouth[1], 692, f) - 10 * 4 * f * (1 - f), 3.6, BEANS[i % 3]);
        return;
      }
      if (out > 0) { s += dot(lerp(cx + rx - 6, BUCKET_FLOOR[0], out), lerp(cy, BUCKET_FLOOR[1] - 30, out) - 12 * 4 * out * (1 - out), 3.6, BEANS[i % 3]); return; }
      const x = d < 1 ? lerp(SPOUT[0], tx, d) : tx, y = d < 1 ? lerp(SPOUT[1] + 6, ty, d) - 16 * 4 * d * (1 - d) : ty;
      s += dot(x, y, 3.8, BEANS[i % 3]);
    });
    s += trayArms(cool * 6.5 + (k > 0 ? t * .6 : 0));
    if (r > RB.dump[0] + .02 && k < .2) for (let i = 0; i < 4; i++) { const q = (t * .5 + i / 4) % 1; s += puff(TRAY[0] - 40 + i * 26 + Math.sin(t * 2 + i) * 6, TRAY[1] - 10 - q * 70, 8 + q * 10, "#FFFFFF", (1 - q) * .5); }

    // the line indexes one slot per cycle; stations act while it rests
    s += conveyor();
    const c = mach * CYCLES, ci = Math.floor(c);
    let grams = 0, press = 0, spray = 0, inBox = "";
    for (let j = 0; j < NB; j++) {
      const slot = c - j;
      if (slot < 0) { const q = NB - 1 - j; s += `<rect x="${STACK[0] - 17}" y="${f1(BELT_Y - 6 - q * 3)}" width="34" height="3" rx="1" fill="${q % 2 ? "#B07E46" : "#C8955A"}"/>`; continue; }
      const si = Math.floor(slot), sf = slot - si, mv = smoothstep(0, .4, sf);
      let x, base = BELT_Y, tilt = 0;
      if (si === 0 && sf < .4 && j === ci) x = lerp(STACK[0], SLOTS[0], mv);
      else if (si < SLOTS.length) x = lerp(SLOTS[Math.max(0, si - 1)], SLOTS[si], si === 0 ? 1 : mv);
      else { const d = clamp((slot - SLOTS.length) / .6); x = lerp(SLOTS.at(-1), BOX[0] + 15 + (j % 2) * 30, d); base = lerp(BELT_Y, BOX[1] - 2, d) - 26 * 4 * d * (1 - d); tilt = 30 * Math.sin(Math.PI * d); }
      const passed = n => slot > n + .6;
      const fill = passed(FILL_AT) ? 1 : (si === FILL_AT ? smoothstep(.45, .85, sf) : 0);
      if (si === FILL_AT && sf > .4) { grams = Math.round(250 * fill); if (sf > .45 && sf < .85) s += dot(SLOTS[FILL_AT] + Math.sin(t * 30) * 2, 742 + (t * 200 % 8), 2.6, "#5A3820"); }
      if (si === SEAL_AT) press = Math.max(press, smoothstep(.45, .6, sf) * (1 - smoothstep(.75, .9, sf)));
      if (si === CODE_AT && sf > .5 && sf < .8) spray = 1;
      const b = bag(x, base, fill, passed(SEAL_AT), passed(CODE_AT), tilt);
      if (slot > SLOTS.length + .3) inBox += b; else s += b;
    }
    if (!grams && mach >= 1) grams = 250;
    s += filler(grams) + sealer(press) + coder(spray, t);
    if (press > .5) s += puff(SLOTS[SEAL_AT] + 10, 726 - (t * 40 % 20), 6, "#FFFFFF", .6);
    // box with the bags inside, lifted into Tito's arms (the rig's box takes over at the end)
    const bxx = lerp(BOX[0], ox + 128, liftBox), bxb = lerp(BOX[1], oy + 206, liftBox) - 30 * 4 * liftBox * (1 - liftBox);
    if (k < 1) s += `<g transform="translate(${f1(bxx - BOX[0])} ${f1(bxb - BOX[1])})">${inBox}${box(flaps)}</g>`;
    s += bucket(bx, by, k <= 0 ? 0 : toBucket * (1 - kPour), br);   // behind Tito: his hand covers the handle

    el.dyn.innerHTML = s;

    /* ===== Tito ===== */
    if (active) {
      el.tito.style.transform = "";                                  // face the machines even when scrolling back
      if (inRoast) {
        const holdSack = r > RB.lift[0] && r < RB.dropSack[1] ? 1 - smoothstep(RB.pour[1], RB.dropSack[1], r) : 0;
        const reachLever = key([[RB.lever[0] - .03, 0], [RB.lever[0], 1], [RB.dump[0] + .04, 1], [RB.dump[0] + .08, 0]], r)[0];
        if (holdSack > 0) {
          const w = holdSack * Math.min(1, lift * 3), lx = sx - ox, ly = sy - oy;
          rot("armR", aimArm(118, 150, lx + 16, ly) * w, 118, 150); rot("foreR", 0, 118, 188);
          rot("armL", aimArm(82, 150, lx - 16, ly) * w, 82, 150); rot("foreL", 0, 82, 188);
          rot("head", -8 * holdSack, 100, 132);
        } else if (reachLever > 0) {
          const tipA = rad(30 - 60 * lever);
          rot("armR", aimArm(118, 150, 3484 - 26 * Math.sin(tipA) - ox, 700 - 26 * Math.cos(tipA) - oy) * reachLever, 118, 150); rot("foreR", 0, 118, 188);
        } else if (r > RB.roast[0] && r < RB.lever[0]) rot("head", 4 * Math.sin(t * .8), 100, 132);
      } else {
        if (k > KB.pick[0] && k < KB.setDown[1]) {
          rot("armR", armA, 118, 150); rot("foreR", 0, 118, 188);
          rot("armL", armA * (kLift > 0 ? 1 : .2), 82, 150); rot("foreL", 0, 82, 188);
          if (kLift > 0) rot("head", -8 * kLift * (1 - setDown), 100, 132);
        } else if (k > KB.flaps[0] - .01) {
          // reach for the box, then settle into the carry pose as it comes up
          const reach = smoothstep(KB.flaps[0] - .01, KB.flaps[0] + .01, k);
          const aR = aimArm(118, 150, BOX[0] + 30 - ox, BOX[1] - BOX[3] - 4 - oy), aL = aimArm(82, 150, BOX[0] + 10 - ox, BOX[1] - BOX[3] - 4 - oy);
          rot("armR", lerp(aR * reach, -55, liftBox), 118, 150); rot("foreR", lerp(0, -55, liftBox), 118, 188);
          rot("armL", lerp(aL * reach, -62, liftBox), 82, 150); rot("foreL", lerp(0, -50, liftBox), 82, 188);
        } else if (mach > 0 && k < KB.walk3[0]) rot("head", 3 * Math.sin(t * .8), 100, 132);
      }
    }
    if (r > 0) gsap.set(el.sack, { opacity: r < RB.lift[0] ? 1 : 0 });   // before the roastery the drying scene owns it
    gsap.set(el.box, { opacity: k >= 1 ? 1 : 0 });
  }

  // Tito's world x for the story timeline
  return { update, titoR, titoK };
})();
