/* ==========================================================================
   WORLD — the illustrated side-scrolling world, built as layered SVGs.
   All coordinates are "world units": the world is 1000 units tall and the
   ground line sits at y = 820. 1 unit = (viewport height / 1000) px.
   ========================================================================== */
const World = (() => {
  const G = 820;                       // ground line
  const SIZE = { far: 5000, mid: 8000, main: 9400, fore: 15500 };
  const FACTOR = { far: 0.25, mid: 0.55, main: 1, fore: 1.35 };

  // deterministic random so the world looks the same every load
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const R = (a, b) => a + rnd() * (b - a);

  function ridge(x0, x1, base, amp, step, color, extra = "") {
    let d = `M${x0} 1000 L${x0} ${base}`;
    for (let x = x0; x < x1; x += step) d += ` Q${x + step / 2} ${base - R(0.4, 1) * amp} ${x + step} ${base - R(0, 0.45) * amp}`;
    return `<path ${extra} d="${d} L${x1 + step} 1000Z" fill="${color}"/>`;
  }

  /* ---------- reusable props ---------- */
  /* A coffee shrub the way it actually grows: upright stems, tiers of slightly
     drooping lateral branches, glossy paired leaves, and cherries clustered at
     the leaf nodes close to the stem, ripening unevenly (red, orange, yellow, green). */
  const LEAF = ["#2E4A2A", "#355431", "#3E5F37", "#47693E", "#2A4226", "#3A5A33"];
  function cherry(cx, cy, r, col) {
    return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${col}"/><circle cx="${(cx - r * .35).toFixed(1)}" cy="${(cy - r * .38).toFixed(1)}" r="${(r * .3).toFixed(1)}" fill="#fff" opacity=".35"/>`;
  }
  function ripeColor() {
    const r = rnd();
    return r < .34 ? "#B3261E" : r < .6 ? "#951C17" : r < .74 ? "#D0562A" : r < .84 ? "#E0A33A" : "#8FA55B";
  }
  function coffeeBush(x, s = 1, id = "") {
    const h = 350 * s, y = G, tiers = 11;
    let back = "", stems = "", br = "", leaves = "", fruit = "";
    for (const o of [-9, 7]) stems += `<path d="M${x + o} ${y} Q${x + o * 2.2} ${y - h * .5} ${x + o * .4} ${y - h * .9}" stroke="#6A5643" stroke-width="${5 * s}" fill="none" stroke-linecap="round"/>`;
    for (let i = 0; i < tiers; i++) {
      const ty = y - 34 * s - i * (h - 60 * s) / tiers;
      const len = (78 + 40 * Math.sin(Math.PI * (i + 1.2) / (tiers + 1)) - i * 2) * s * R(.85, 1.1);   // rounded, not conical
      for (const dir of [-1, 1]) {
        const droop = len * R(.12, .24);
        br += `<path d="M${x + dir * 5 * s} ${ty} Q${x + dir * len * .5} ${ty - 6 * s} ${x + dir * len} ${ty + droop}" stroke="#5C5040" stroke-opacity=".8" stroke-width="${2 * s}" fill="none"/>`;
        for (let k = .18; k <= 1.01; k += .13) {
          const px = x + dir * len * k, py = ty + droop * k * k - 5 * s * (1 - k);
          for (const side of [-1, 1]) {
            const ang = (dir > 0 ? 0 : 180) + side * R(32, 58) + dir * 14 * k + R(-8, 8);
            leaves += `<use href="#leaf" fill="${LEAF[Math.floor(R(0, LEAF.length))]}" transform="translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${ang.toFixed(0)}) scale(${(s * R(1.05, 1.4) * (1.15 - k * .3)).toFixed(2)})"/>`;
          }
          if (k < .6 && i > 0 && i < tiers - 2 && rnd() < .42) {        // a cluster of cherries hugging the node
            const n = 2 + Math.floor(R(0, 3));
            for (let c = 0; c < n; c++) fruit += cherry(px + R(-8, 8) * s, py + R(1, 10) * s, R(4.6, 6.2) * s, ripeColor());
          }
        }
      }
    }
    // a few leaves at the crown
    for (let j = 0; j < 4; j++) leaves += `<use href="#leaf" fill="${LEAF[j % LEAF.length]}" transform="translate(${x + R(-10, 10)} ${y - h + 30 + R(0, 20)}) rotate(${-160 + j * 45 + R(-10, 10)}) scale(${s * 1.1})"/>`;
    back = `<ellipse cx="${x}" cy="${y - h * .5}" rx="${95 * s}" ry="${h * .44}" fill="#22361F" opacity=".85"/>`;
    return `<g ${id ? `id="${id}"` : ""}>${stems}${back}${br}${leaves}${fruit}</g>`;
  }

  function paloVerde(x, s = 1) {           // the brand's namesake tree: green bark, airy canopy
    const y = G, h = 520 * s;
    let g = `<g>`;
    g += `<path d="M${x} ${y} Q${x - 10} ${y - h * .4} ${x - 60 * s} ${y - h * .7} M${x} ${y - h * .35} Q${x + 30 * s} ${y - h * .55} ${x + 90 * s} ${y - h * .72} M${x - 4} ${y - h * .5} Q${x + 4} ${y - h * .75} ${x} ${y - h * .9}" stroke="#7FA05A" stroke-width="${16 * s}" fill="none" stroke-linecap="round"/>`;
    [[-60, .74, 110], [90, .76, 120], [0, .92, 130], [-130, .62, 80], [150, .62, 80]].forEach(([dx, dy, r]) => {
      g += `<ellipse cx="${x + dx * s}" cy="${y - h * dy}" rx="${r * s}" ry="${r * .55 * s}" fill="#B9C76A" opacity=".85"/>`;
      g += `<ellipse cx="${x + dx * s + 10}" cy="${y - h * dy - 10}" rx="${r * .6 * s}" ry="${r * .3 * s}" fill="#D9D77A" opacity=".8"/>`;
    });
    return g + `</g>`;
  }

  function house(x, w, h, wall, roof, opts = {}) {
    const y = G;
    let g = `<g>`;
    g += `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${wall}"/>`;
    g += `<rect x="${x + w * .78}" y="${y - h}" width="${w * .22}" height="${h}" fill="#000" opacity=".06"/>`;
    g += `<path d="M${x - 24} ${y - h + 4} L${x + w / 2} ${y - h - h * .45} L${x + w + 24} ${y - h + 4}Z" fill="${roof}"/>`;
    if (opts.window !== false) g += `<rect class="win" x="${x + w * .12}" y="${y - h * .7}" width="${w * .26}" height="${h * .3}" rx="6" fill="#9FC6D6" stroke="#6B4A36" stroke-width="7"/>`;
    if (opts.door !== false) g += `<rect x="${x + w * .6}" y="${y - h * .58}" width="${w * .22}" height="${h * .58}" rx="6" fill="#6B4A36"/>`;
    return g + `</g>`;
  }

  function lamp(x) {
    return `<g><rect x="${x - 5}" y="${G - 330}" width="10" height="330" fill="#2E2A2A"/><path d="M${x} ${G - 330} q0 -20 30 -20 h10" stroke="#2E2A2A" stroke-width="8" fill="none"/><rect x="${x + 28}" y="${G - 352}" width="26" height="16" rx="4" fill="#2E2A2A"/>
      <circle class="glow" cx="${x + 41}" cy="${G - 330}" r="70" fill="url(#lampGlow)" opacity="0"/><circle cx="${x + 41}" cy="${G - 334}" r="7" fill="#FFE2A0"/></g>`;
  }

  const defs = `<defs>
    <g id="leaf"><path d="M0 0 C7 -9 21 -11 36 -1 C22 9 8 8 0 0Z"/><path d="M2 0 Q18 -3 34 -1" stroke="#fff" stroke-opacity=".22" stroke-width="1.3" fill="none"/><path d="M6 -3 C12 -7 20 -8 28 -4" stroke="#fff" stroke-opacity=".12" stroke-width="2.5" fill="none"/></g>
    <radialGradient id="lampGlow"><stop offset="0" stop-color="#FFD98A" stop-opacity=".9"/><stop offset="1" stop-color="#FFD98A" stop-opacity="0"/></radialGradient>
    <pattern id="beansPat" width="22" height="14" patternUnits="userSpaceOnUse"><ellipse cx="6" cy="7" rx="5" ry="3.5" fill="#6B4A2E"/><ellipse cx="17" cy="4" rx="5" ry="3.5" fill="#7B5636"/><ellipse cx="15" cy="11" rx="4.5" ry="3" fill="#5D3E25"/></pattern>
    <pattern id="wavePat" width="120" height="40" patternUnits="userSpaceOnUse"><path d="M0 20 q30 -14 60 0 t60 0" stroke="#A9CFDB" stroke-width="4" fill="none"/></pattern>
    <pattern id="brick" width="60" height="30" patternUnits="userSpaceOnUse"><path d="M0 30 h60 M0 15 h60 M30 0 v15 M0 15 v15 M60 15 v15" stroke="#D6C2A6" stroke-width="2"/></pattern>
  </defs>`;

  /* ---------------- FAR ---------------- */
  function far() {
    let s = defs;
    s += `<g id="farHills">${ridge(-100, 2400, 600, 260, 300, "#D4CBB4")}${ridge(-100, 2400, 680, 200, 220, "#C2C3A2")}</g>`;
    let city = "";
    for (let x = 1500; x < 5000;) { const w = R(50, 130), h = R(90, 340); city += `<rect x="${x}" y="${740 - h}" width="${w}" height="${h + 300}" fill="#B9A6AC"/>`; x += w + R(4, 20); }
    s += `<g id="farCity" opacity="0">${city}</g>`;
    return s;
  }

  /* ---------------- MID ---------------- */
  function mid() {
    let s = defs, hills = "";
    hills += ridge(-100, 8000, 700, 170, 380, "#A9B98A");
    // coffee rows on the hillside
    for (let x = 40; x < 2600; x += 46) for (let r = 0; r < 3; r++) hills += `<ellipse cx="${x + r * 18}" cy="${700 + r * 26 + Math.sin(x / 180) * 18}" rx="15" ry="9" fill="#7E9662" opacity=".8"/>`;
    hills += ridge(-100, 8000, 760, 90, 300, "#94A877");
    for (let x = 300; x < 4200; x += R(380, 700)) hills += `<g transform="translate(${x} ${730 - .55 * G}) scale(.55) translate(${-x} 0)">${paloVerde(x, 1)}</g>`;
    s += `<g id="midHills">${hills}</g>`;
    let city = "";
    for (let x = 3300; x < 8000;) {
      const w = R(90, 200), h = R(160, 420), c = ["#D6B39F", "#C9A28F", "#DCC0A8", "#BE9886"][Math.floor(R(0, 4))];
      city += `<rect x="${x}" y="${G - 40 - h}" width="${w}" height="${h + 300}" fill="${c}"/>`;
      for (let wy = G - h; wy < G - 80; wy += 46) for (let wx = x + 16; wx < x + w - 24; wx += 34)
        city += `<rect class="cwin" x="${wx}" y="${wy}" width="16" height="22" fill="#F6E2B8" opacity=".35"/>`;
      x += w + R(8, 30);
    }
    s += `<g id="midCity" opacity="0">${city}</g>`;
    return s;
  }

  /* ---------------- MAIN ---------------- */
  function main() {
    let s = defs;
    // ground by zone
    s += `<rect x="-200" y="${G}" width="2600" height="200" fill="#8EA466"/>`;
    s += `<rect x="2300" y="${G}" width="2600" height="200" fill="#CDB38A"/>`;
    s += `<path d="M4850 ${G + 4} Q5150 ${G - 120} 5460 ${G + 4} L5460 1000 L4850 1000Z" fill="#8EA466"/>`;
    s += `<rect x="4850" y="${G}" width="610" height="200" fill="#8EA466"/>`;
    s += `<rect x="5460" y="${G + 20}" width="1900" height="180" fill="#6FA3B5"/><rect x="5460" y="${G + 30}" width="1900" height="170" fill="url(#wavePat)"/>`;
    s += `<rect x="7350" y="${G}" width="2200" height="70" fill="#BDB4A8"/><rect x="7350" y="${G + 70}" width="2200" height="130" fill="#5E5753"/>`;
    s += `<path d="M7350 ${G + 135} h2200" stroke="#E9D9A6" stroke-width="6" stroke-dasharray="60 50"/>`;
    s += `<rect x="-200" y="${G}" width="2600" height="8" fill="#A7BC7C"/><rect x="2300" y="${G}" width="2600" height="8" fill="#DCC6A0"/>`;
    // dirt path across the farm
    s += `<path d="M-200 ${G + 60} Q600 ${G + 40} 1200 ${G + 70} T2400 ${G + 50}" stroke="#B89E74" stroke-width="40" fill="none" opacity=".55"/>`;

    /* -- 01 farm -- */
    s += house(140, 300, 230, "#F1E4CF", "#B4532E");
    s += `<rect x="232" y="${G - 330}" width="26" height="70" fill="#8C5A3C"/>`;
    s += `<g><rect x="610" y="${G - 170}" width="12" height="170" fill="#7A5638"/><rect x="700" y="${G - 170}" width="12" height="170" fill="#7A5638"/>
      <rect x="586" y="${G - 236}" width="150" height="80" rx="8" fill="#9A6E48"/><text x="661" y="${G - 202}" text-anchor="middle" font-family="Fraunces" font-size="22" fill="#F3EBDD">FINCA</text><text x="661" y="${G - 176}" text-anchor="middle" font-family="Fraunces" font-size="20" font-style="italic" fill="#F3EBDD">Palo Verde</text></g>`;
    [[850, .95], [1080, 1.0], [1630, 1.08], [1910, .96], [2180, 1.04]].forEach(([x, sc]) => s += coffeeBush(x, sc));
    s += coffeeBush(1340, 1.12, "pickBush");
    // the cherries Tito picks
    s += `<g id="pickCherries">${[[1232, 618], [1246, 626], [1238, 634], [1254, 640], [1226, 628]].map(([x, y]) => `<g>${cherry(x, y, 7.5, "#B3261E")}</g>`).join("")}</g>`;
    s += paloVerde(2330, .85);

    /* -- 02 dry + roast -- */
    [2420, 2700].forEach(x => {
      s += `<g><rect x="${x}" y="${G - 150}" width="10" height="150" fill="#7A5638"/><rect x="${x + 220}" y="${G - 150}" width="10" height="150" fill="#7A5638"/>
        <rect x="${x - 10}" y="${G - 168}" width="250" height="26" fill="#9A6E48"/><rect x="${x - 4}" y="${G - 184}" width="238" height="20" fill="url(#beansPat)"/>
        <path d="M${x - 20} ${G - 280} L${x + 250} ${G - 280}" stroke="#7A5638" stroke-width="8"/><path d="M${x - 20} ${G - 280} q135 40 270 0" fill="#EFE6D3" opacity=".8"/></g>`;
    });
    // roastery building
    s += `<g id="roastery"><rect x="3020" y="${G - 420}" width="900" height="420" fill="#E9D9C3"/><rect x="3020" y="${G - 420}" width="900" height="420" fill="url(#brick)" opacity=".7"/>
      <rect x="3000" y="${G - 446}" width="940" height="34" fill="#3A2A20"/>
      <rect x="3330" y="${G - 520}" width="420" height="80" rx="10" fill="#1E1410"/><text x="3540" y="${G - 468}" text-anchor="middle" font-family="Fraunces" font-size="40" fill="#F3EBDD">Roastery</text>
      <rect x="3800" y="${G - 760}" width="46" height="330" fill="#5A4436"/>
      <g id="smoke" fill="#F3EEE6">${[0, 1, 2, 3, 4].map(i => `<circle class="puff" cx="${3823 + i * 14}" cy="${G - 790 - i * 70}" r="${26 + i * 10}" opacity="${.85 - i * .15}"/>`).join("")}</g>
      <rect x="3300" y="${G - 340}" width="470" height="340" rx="14" fill="#3A2A20"/>
      <rect x="3318" y="${G - 322}" width="434" height="322" rx="8" fill="#4A372B"/>
      <path d="M3470 ${G - 300} L3450 ${G - 230} H3530 L3510 ${G - 300}Z" fill="#B4452A"/>
      <rect x="3400" y="${G - 232}" width="180" height="150" rx="22" fill="#C65A2E"/>
      <g id="drum"><circle cx="3490" cy="${G - 157}" r="56" fill="#2A1B12"/><circle cx="3490" cy="${G - 157}" r="44" fill="#3E2A1E"/>
        <path d="M3490 ${G - 213} V${G - 101} M3434 ${G - 157} H3546 M3450 ${G - 197} L3530 ${G - 117} M3530 ${G - 197} L3450 ${G - 117}" stroke="#7A5638" stroke-width="7"/></g>
      <rect x="3420" y="${G - 82}" width="16" height="82" fill="#2A1B12"/><rect x="3546" y="${G - 82}" width="16" height="82" fill="#2A1B12"/>
      <ellipse cx="3672" cy="${G - 70}" rx="70" ry="22" fill="#2A1B12"/>
      <g id="coolBeans">${Array.from({ length: 14 }, (_, i) => `<ellipse cx="${3618 + (i % 7) * 18}" cy="${G - 78 - Math.floor(i / 7) * 10}" rx="7" ry="5" fill="#8DA35E"/>`).join("")}</g>
      <rect x="3150" y="${G - 330}" width="110" height="140" rx="6" fill="#9FC6D6" stroke="#6B4A36" stroke-width="8"/></g>`;

    /* -- 03 packing -- */
    s += `<g><rect x="4080" y="${G - 190}" width="640" height="26" fill="#6B4A36"/><rect x="4100" y="${G - 164}" width="14" height="164" fill="#4A372B"/><rect x="4690" y="${G - 164}" width="14" height="164" fill="#4A372B"/>
      <rect x="4090" y="${G - 210}" width="620" height="22" rx="11" fill="#2E2A2A"/>${Array.from({ length: 16 }, (_, i) => `<circle cx="${4104 + i * 39}" cy="${G - 199}" r="6" fill="#77706B"/>`).join("")}
      <g id="bags">${Array.from({ length: 7 }, (_, i) => `<g transform="translate(${4040 + i * 120} 0)"><path d="M0 ${G - 212} v-96 q0 -10 10 -10 h56 q10 0 10 10 v96z" fill="#C8955A"/><rect x="0" y="${G - 330}" width="76" height="16" fill="#B07E46"/><rect x="12" y="${G - 290}" width="52" height="44" rx="4" fill="#3F5A38"/><text x="38" y="${G - 262}" text-anchor="middle" font-family="Fraunces" font-size="14" fill="#F3EBDD">PV</text></g>`).join("")}</g>
      <rect x="4060" y="${G - 400}" width="40" height="400" fill="#E9D9C3"/><rect x="4700" y="${G - 400}" width="40" height="400" fill="#E9D9C3"/>
      <g id="stamp"><rect x="4545" y="${G - 470}" width="20" height="110" fill="#2E2A2A"/><rect x="4520" y="${G - 360}" width="70" height="34" rx="6" fill="#B4452A"/></g>
      <rect x="4500" y="${G - 480}" width="110" height="20" fill="#2E2A2A"/></g>`;
    [[4780, 0], [4850, 0], [4815, -56]].forEach(([x, dy]) => s += `<g><rect x="${x}" y="${G - 56 + dy}" width="64" height="56" rx="4" fill="#C8955A"/><rect x="${x + 27}" y="${G - 56 + dy}" width="10" height="56" fill="#E8D3AE"/></g>`);

    /* -- 04 launch hill + sea -- */
    s += `<g><rect x="4990" y="${G - 400}" width="8" height="330" fill="#5A4436"/><path id="sock" d="M4998 ${G - 396} L5110 ${G - 380} L5106 ${G - 352} L4998 ${G - 344}Z" fill="#C65A2E"/><path d="M5030 ${G - 392} v42 M5062 ${G - 386} v36" stroke="#F3EBDD" stroke-width="10"/></g>`;
    s += `<g><rect x="5300" y="${G - 210}" width="10" height="150" fill="#7A5638"/><rect x="5232" y="${G - 250}" width="150" height="64" rx="8" fill="#F3EBDD" stroke="#7A5638" stroke-width="5"/><text x="5307" y="${G - 223}" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="20" fill="#3A2A20">AIR MAIL</text><text x="5307" y="${G - 200}" text-anchor="middle" font-family="Manrope" font-weight="700" font-size="16" fill="#C65A2E">→ USA</text></g>`;
    s += `<g><path d="M6200 ${G + 40} q100 -60 200 0z" fill="#D9C38E"/><path d="M6300 ${G + 10} q-6 -120 20 -200" stroke="#7A5638" stroke-width="10" fill="none"/>${[-60, -20, 30, 70].map(a => `<ellipse cx="6320" cy="${G - 190}" rx="70" ry="16" fill="#5E7D4F" transform="rotate(${a} 6320 ${G - 190})"/>`).join("")}</g>`;

    /* -- 05 city -- */
    s += lamp(7760);
    s += house(7860, 300, 340, "#D8B79C", "#5E3A2B");
    s += lamp(8240);
    // the destination house
    s += `<g id="destHouse"><rect x="8320" y="${G - 380}" width="420" height="380" fill="#F3E3CC"/><rect x="8650" y="${G - 380}" width="90" height="380" fill="#000" opacity=".05"/>
      <path d="M8290 ${G - 376} L8530 ${G - 560} L8770 ${G - 376}Z" fill="#3F5A38"/>
      <rect x="8360" y="${G - 300}" width="100" height="120" rx="6" fill="#9FC6D6" stroke="#6B4A36" stroke-width="8"/>
      <rect id="winLight" x="8364" y="${G - 296}" width="92" height="112" fill="#FFD98A" opacity="0"/>
      <rect x="8540" y="${G - 250}" width="96" height="250" rx="8" fill="#B4452A"/><circle cx="8620" cy="${G - 120}" r="6" fill="#E7C27D"/>
      <circle id="porchGlow" cx="8650" cy="${G - 280}" r="110" fill="url(#lampGlow)" opacity="0"/><rect x="8642" y="${G - 296}" width="16" height="24" rx="4" fill="#FFE2A0"/>
      <rect x="8520" y="${G - 14}" width="140" height="14" fill="#9A8C80"/>
      <g><path d="M8690 ${G} l8 -60 h44 l8 60z" fill="#C65A2E"/><ellipse cx="8720" cy="${G - 74}" rx="40" ry="26" fill="#5E7D4F"/></g>
      <g><rect x="8290" y="${G - 130}" width="8" height="130" fill="#3A2A20"/><rect x="8268" y="${G - 170}" width="52" height="44" rx="10" fill="#3F5A38"/></g></g>`;
    s += `<g id="dropBox" opacity="0"><ellipse cx="8438" cy="872" rx="38" ry="5" fill="rgba(30,20,16,.2)"/><rect x="8408" y="${872 - 48}" width="60" height="48" rx="4" fill="#C8955A"/><rect x="8433" y="${872 - 48}" width="10" height="48" fill="#E8D3AE"/><text x="8413" y="${872 - 10}" font-family="Manrope" font-weight="800" font-size="11" fill="#3A2A20">PV</text></g>`;
    s += lamp(8900);
    s += house(9020, 320, 300, "#E2C2A2", "#7A4B35");
    return s;
  }

  /* ---------------- FORE ---------------- */
  function fore() {
    let s = "";
    for (let x = 0; x < 6400; x += R(160, 420)) {
      const h = R(70, 150), c = rnd() > .5 ? "#3E5A35" : "#4F6B43";
      s += `<path d="M${x} 1000 Q${x + 10} ${1000 - h} ${x - 30} ${1000 - h * 1.1} M${x + 20} 1000 Q${x + 30} ${1000 - h * 1.2} ${x + 60} ${1000 - h * 1.3} M${x + 40} 1000 Q${x + 50} ${1000 - h * .9} ${x + 90} ${1000 - h}" stroke="${c}" stroke-width="16" fill="none" stroke-linecap="round"/>`;
    }
    for (let x = 8600; x < 12400; x += R(500, 900))
      s += `<g><rect x="${x}" y="900" width="38" height="100" rx="10" fill="#3A3533"/><ellipse cx="${x + 140}" cy="935" rx="90" ry="60" fill="#4F6B43"/><rect x="${x + 80}" y="940" width="120" height="70" fill="#7A4B35"/></g>`;
    return s;
  }

  function build() {
    const mk = (id, key, html) => {
      const el = document.getElementById(id);
      el.innerHTML = `<svg viewBox="0 0 ${SIZE[key]} 1000" preserveAspectRatio="none">${html}</svg>`;
    };
    mk("lFar", "far", far()); mk("lMid", "mid", mid()); mk("lMain", "main", main()); mk("lFore", "fore", fore());
  }

  function resize(u) {
    for (const [id, key] of [["lFar", "far"], ["lMid", "mid"], ["lMain", "main"], ["lFore", "fore"]]) {
      const svg = document.querySelector(`#${id} svg`);
      svg.setAttribute("width", SIZE[key] * u); svg.setAttribute("height", 1000 * u);
    }
  }

  return { build, resize, FACTOR, G };
})();
