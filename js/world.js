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

  /* ---------- reusable props ---------- */
  function cherry(cx, cy, r, col) {
    return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${col}"/><circle cx="${(cx - r * .35).toFixed(1)}" cy="${(cy - r * .38).toFixed(1)}" r="${(r * .3).toFixed(1)}" fill="#fff" opacity=".35"/>`;
  }

  /* A coffee plant the way it actually grows: one trunk, tiers of branches that leave it
     almost flat and droop at the tip, a line of cherries hugging each branch (mostly ripe,
     a few still green) and big glossy leaves in pairs. Drawn once around (0,0) = trunk at the
     ground, ~250 units tall, then reused with <use>. Colours arrive as CSS variables so each
     row can be hazed toward the sky; --fruit:0 hides the cherries on the far rows. */
  const f1 = n => n.toFixed(1);
  const CAFETO = (() => {
    let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const REDS = ["#C02A20", "#C02A20", "#9E1D18", "#B3261E", "#A8221B", "#C02A20", "#9E1D18", "#D6532A"];
    const GREENS = ["#8FA55B", "#7E9A4E", "#A3B562"];
    const cherryCol = () => rnd() < .16 ? GREENS[Math.floor(rnd() * GREENS.length)] : REDS[Math.floor(rnd() * REDS.length)];
    const leaf = (x, y, ang, len, fill) => `<path transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(ang)}) scale(${(len / 28).toFixed(2)})" d="M0 0 C6 -7 18 -8 28 0 C18 7 6 6 0 0Z" fill="${fill}"/>`;
    // a soft mass behind the branches, so from far away the plant still reads as one shape
    let back = [[0, -66, 54], [-50, -70, 36], [50, -68, 36], [0, -126, 50], [-34, -134, 34], [34, -136, 34], [0, -186, 40], [0, -230, 26]]
      .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="var(--shade)"/>`).join("");
    let wood = `<path d="M-4.5 0 L-2 -232 L2 -232 L4.5 0Z" fill="var(--wood)"/>`, leaves = "", fruit = "";
    [-46, -80, -114, -148, -182, -214].forEach((y, i) => {
      const L = [82, 92, 92, 84, 70, 50][i];
      for (const dir of [-1, 1]) {
        const droop = L * .3, cx = dir * L * .5, ex = dir * L;
        const at = k => [2 * (1 - k) * k * cx + k * k * ex, (1 - k) * (1 - k) * y + 2 * (1 - k) * k * (y - 5) + k * k * (y + droop)];
        wood += `<path d="M0 ${y} Q${f1(cx)} ${y - 5} ${f1(ex)} ${f1(y + droop)}" stroke="var(--wood)" stroke-width="${f1(3.4 - i * .25)}" fill="none" stroke-linecap="round"/>`;
        // shade leaves behind, lit leaves in front: light comes from the upper right
        for (const k of [.55, .85]) { const [x, yy] = at(k); back += leaf(x, yy, dir > 0 ? 20 : 160, 34, "var(--shade)"); }
        for (const k of [.38, .68, .98]) {
          const [x, yy] = at(k), lit = (dir > 0 && i >= 2) || (i >= 4 && k > .9), j = () => (rnd() - .5) * 24;
          leaves += leaf(x, yy, (dir > 0 ? -28 : -152) + j(), 40 + k * 6, lit ? "var(--light)" : "var(--body)");
          leaves += leaf(x, yy, (dir > 0 ? 42 : 138) + j(), 38 + k * 6, "var(--body)");
        }
        // the line of cherries hugging the branch, densest near the trunk
        for (let k = .12; k < .72; k += 22 / L) {
          const [x, yy] = at(k);
          [[0, -2.6], [dir * 6.5, -1.4], [dir * 2.5, 4], [dir * 9, 3.4]].slice(0, 3 + (rnd() < .5 ? 1 : 0)).forEach(([dx, dy]) =>
            fruit += `<circle cx="${f1(x + dx)}" cy="${f1(yy + dy)}" r="4.2" fill="${cherryCol()}"/>`);
        }
      }
    });
    [-130, -95, -60].forEach((a, j) => leaves += leaf(0, -228, a, 32, j === 2 ? "var(--light)" : "var(--body)"));
    return `<g id="cafeto">${back}${wood}${leaves}<g style="opacity:var(--fruit,1)">${fruit}</g></g>`;
  })();

  /* The cafetal: rows of the same plant following the hill's contour, big and dark up front,
     small and hazy at the back (layout tuned in design/cafetos). */
  const ROWS = { size: .95, gap: 1, rows: 5, rowGap: 74, depth: .75, curve: 70, haze: .8, stagger: .15, vary: .19 };
  const SHADES = { shade: "#2E4D2D", body: "#3F6639", light: "#6E9A55", wood: "#6A5643" }, HAZE = "#E9E6CF";
  const mixHex = (a, b, t) => "#" + [1, 3, 5].map(i => Math.round(parseInt(a.substr(i, 2), 16) * (1 - t) + parseInt(b.substr(i, 2), 16) * t).toString(16).padStart(2, "0")).join("");
  function cafetal(x0, x1, pickX) {
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const { size, gap, rows, rowGap, depth, curve, haze: hz, stagger, vary } = ROWS;
    const span = x1 - x0, ramp = 240;
    const ease = x => { const e = Math.min(1, Math.max(0, Math.min(x - x0, x1 - x) / ramp)); return e * e * (3 - 2 * e); };
    const contour = (x, t) => { const u = (x - x0) / span * 1600; return -curve * (.35 + t) * Math.sin((u - 200) / 520) - curve * .4 * t * Math.cos(u / 300); };
    const rowY = (x, i, t) => G - ease(x) * (G - (G - i * rowGap * (1 - depth * t * .35) + contour(x, t)));
    // the hill the rows climb, closing just under the ground line so the dirt path stays visible
    let hill = "";
    for (let x = x0 - 40; x <= x1 + 40; x += 30) hill += `${hill ? " L" : "M"}${x} ${f1(Math.min(G + 2, rowY(x, rows - 1, 1) - 30 * ease(x)))}`;
    let g = `<path d="${hill} L${x1 + 40} ${G + 4} L${x0 - 40} ${G + 4}Z" fill="#9DB27A"/>`;
    for (let i = rows - 1; i >= 0; i--) {
      const t = rows > 1 ? i / (rows - 1) : 0, sc = size * (1 - depth * t), step = 200 * sc * gap, haze = hz * t;
      const a = x0 + i * 60, b = x1 - i * 60;                 // back rows are shorter: the hill narrows toward the top
      // the furrow each row stands on
      let top = "", bot = "";
      for (let x = a - 30; x <= b + 30; x += 30) { const y = rowY(x, i, t); top += `${top ? " L" : "M"}${x} ${f1(y - 6 * sc)}`; bot = ` L${x} ${f1(y + 10 * sc)}` + bot; }
      g += `<path d="${top}${bot}Z" fill="${mixHex("#7E9659", HAZE, haze)}"/>`;
      g += `<g style="${Object.entries(SHADES).map(([k, v]) => `--${k}:${mixHex(v, HAZE, haze)}`).join(";")}">`;
      // the front row is anchored on the plant Tito picks from
      let start = i === 0 ? pickX - Math.floor((pickX - a) / step) * step : a + (i % 2) * step * stagger;
      for (let x = start; x <= b; x += step) {
        const v = i === 0 && Math.abs(x - pickX) < 1 ? 1.05 : 1 + (rnd() * 2 - 1) * vary;
        g += `<use href="#cafeto" transform="translate(${f1(x)} ${f1(rowY(x, i, t))}) scale(${(sc * v).toFixed(3)})"${i === 0 ? "" : ' style="--fruit:0"'}/>`;
      }
      g += `</g>`;
    }
    return `<g>${g}</g>`;
  }

  /* ---------- background trees ----------
     Species that really grow with coffee: the palo verde the brand is named after, guaba (Inga)
     and poró (Erythrina) that shade the coffee, and plátano planted between the rows.
     Each is drawn around (0,0) = trunk at the ground, ~420 units tall. */
  function smooth(pts, closed = false) {             // Catmull-Rom through points, as cubic beziers
    const P = closed ? [pts.at(-1), ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts.at(-1)];
    let d = `M${f1(P[1][0])} ${f1(P[1][1])}`;
    for (let i = 1; i < P.length - 2; i++) {
      const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
      d += ` C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`;
    }
    return d + (closed ? "Z" : "");
  }
  const TREE = (() => {
    let seed = 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, Rn = (a, b) => a + rnd() * (b - a);
    // a lobed crown: one path whose edge swells into leafy lobes, flatter underneath like a real canopy
    function crown(cx, cy, rx, ry, lobes, depth, flatBottom) {
      const pts = [];
      for (let i = 0; i < lobes * 2; i++) {
        const a = Math.PI * 2 * i / (lobes * 2), out = i % 2 ? 1 - depth * Rn(.6, 1) : 1 + depth * Rn(0, .25);
        let y = cy + Math.sin(a) * ry * out;
        if (Math.sin(a) > 0) y = cy + (y - cy) * flatBottom;
        pts.push([cx + Math.cos(a) * rx * out, y]);
      }
      return smooth(pts, true);
    }
    const branch = (pts, w, col) => `<path d="${smooth(pts)}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
    const twigs = (list, w, col) => list.map(([x, y, tx, ty]) => branch([[x, y], [(x + tx) / 2, (y + ty) / 2 - 7], [tx, ty]], w, col)).join("");
    return {
      // green bark, many thin branches, a feathery see-through canopy and yellow blossoms
      paloVerde() {
        seed = 11;
        let g = branch([[0, 0], [-4, -70], [0, -130]], 16, "#7FA05A");
        const tips = [[-170, -290], [-90, -370], [10, -410], [100, -380], [175, -300]];
        tips.forEach(([x, y], i) => g += branch([[0, -120], [x * .35, y * .55], [x, y]], 9 - Math.abs(i - 2) * 1.5, i % 2 ? "#8DB062" : "#7FA05A"));
        tips.forEach(([x, y]) => g += branch([[x * .6, y * .78], [x * .8 + 30, y * .9], [x + 40, y + 10]], 4, "#8DB062"));
        let leaves = "", flowers = "";
        [[-160, -300], [-110, -350], [-40, -390], [30, -405], [95, -375], [160, -310], [-60, -320], [60, -330], [0, -350], [-130, -260], [130, -262], [-90, -290], [90, -295], [-20, -300], [30, -365], [-75, -380], [140, -340], [-150, -330]].forEach(([cx, cy]) => {
          for (let k = 0; k < 28; k++) {
            const x = cx + Rn(-42, 42), y = cy + Rn(-24, 24);
            leaves += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="7" ry="2.4" transform="rotate(${f1(Rn(-60, 60))} ${f1(x)} ${f1(y)})" fill="${rnd() < .55 ? "#A9BD63" : "#C3CD72"}"/>`;
            if (rnd() < .2) flowers += `<circle cx="${f1(x + Rn(-6, 6))}" cy="${f1(y + Rn(-6, 6))}" r="3.4" fill="#EBC63F"/>`;
          }
        });
        return g + leaves + flowers;
      },
      // Inga: the classic coffee shade tree, a wide flat umbrella; branches reach into the canopy
      guaba() {
        seed = 21;
        let g = branch([[0, 0], [-3, -110], [-40, -220], [-60, -290]], 18, "#6E5A44") + branch([[-3, -110], [30, -180], [80, -250], [110, -295]], 13, "#6E5A44") + branch([[-6, -150], [-90, -200], [-150, -250], [-175, -280]], 9, "#6E5A44");
        g += twigs([[-40, -220, -10, -300], [-40, -220, -110, -285], [80, -250, 40, -305], [80, -250, 160, -280], [-150, -250, -200, -275]], 5, "#6E5A44");
        g += `<path d="${crown(-10, -290, 215, 95, 9, .16, .45)}" fill="#4A7740"/>`;
        g += `<path d="${crown(14, -312, 175, 70, 8, .15, .4)}" fill="#5F8A4B"/>`;
        g += `<path d="${crown(50, -334, 110, 42, 6, .18, .45)}" fill="#7CA35C"/>`;
        return g;
      },
      // Erythrina: tiered irregular crown with red-orange flowers on top, a branch into every tier
      poro() {
        seed = 31;
        let g = branch([[0, 0], [4, -120], [-20, -250], [-15, -350]], 16, "#7A6650") + branch([[4, -120], [60, -200], [90, -305]], 11, "#7A6650") + branch([[-10, -190], [-100, -240], [-120, -292]], 8, "#7A6650");
        g += twigs([[90, -260, 140, -305], [90, -260, 50, -312], [-100, -240, -165, -292], [-18, -300, -70, -352], [-18, -300, 40, -355]], 4.5, "#7A6650");
        let fl = "";
        [[-120, -295, 85, 44], [90, -310, 95, 46], [-15, -360, 105, 54]].forEach(([x, y, rx, ry]) => {
          g += `<path d="${crown(x, y, rx, ry, 7, .2, .5)}" fill="#4F7D44"/>`;
          g += `<path d="${crown(x + 16, y - 10, rx * .7, ry * .6, 6, .2, .5)}" fill="#6E9A55"/>`;
          for (let k = 0; k < 9; k++) fl += `<ellipse cx="${f1(x + Rn(-rx * .7, rx * .7))}" cy="${f1(y - ry * Rn(.3, .85))}" rx="4.5" ry="7" transform="rotate(${f1(Rn(-30, 30))} ${f1(x)} ${f1(y)})" fill="${rnd() < .5 ? "#E0603A" : "#D04A2C"}"/>`;
        });
        return g + fl;
      },
      // Musa: long arching leaves with a midrib and a few tears
      platano() {
        let g = `<path d="M-14 0 Q-8 -120 -5 -210 L7 -210 Q10 -120 14 0Z" fill="#7C9A52"/><path d="M4 -210 L7 -210 Q10 -120 14 0 L6 0Z" fill="#000" opacity=".1"/>`;
        [[-165, 190, "#4C7A42"], [-135, 210, "#5E8A4C"], [-100, 170, "#6E9A55"], [-70, 200, "#5E8A4C"], [-35, 185, "#4C7A42"], [-15, 150, "#6E9A55"], [-118, 120, "#7FA65E"]].forEach(([a, L, c]) => {
          const w = L * .16;
          g += `<g transform="translate(1 -205) rotate(${a})"><path d="M0 0 C${f1(L * .3)} ${f1(-w)} ${f1(L * .75)} ${f1(-w * 1.1)} ${L} ${f1(L * .12)} C${f1(L * .72)} ${f1(w * .6)} ${f1(L * .3)} ${f1(w * .8)} 0 0Z" fill="${c}"/>` +
            `<path d="M0 0 Q${f1(L * .5)} ${f1(-L * .02)} ${f1(L * .98)} ${f1(L * .11)}" stroke="#2F5230" stroke-opacity=".35" stroke-width="2.5" fill="none"/>` +
            `<path d="M${f1(L * .45)} ${f1(-w * .9)} l6 ${f1(w * .7)} M${f1(L * .65)} ${f1(-w * .85)} l5 ${f1(w * .6)}" stroke="#F8ECD8" stroke-width="2.5"/></g>`;
        });
        return g;
      },
    };
  })();
  // background hills: two overlapping sine swells, smooth enough to read as distant land
  const hillY = (x, base, amp, p1, p2) => base - amp * (.55 + .28 * Math.sin(x / 310 + p1) + .17 * Math.sin(x / 140 + p2));
  function hillPath(x0, x1, base, amp, p1, p2, col, extra = "") {
    const pts = []; for (let x = x0; x <= x1; x += 40) pts.push([x, hillY(x, base, amp, p1, p2)]);
    return `<path ${extra} d="${smooth(pts)} L${x1} 1000 L${x0} 1000Z" fill="${col}"/>`;
  }
  // everything behind the farm is washed slightly toward the haze so it sits back
  const wash = str => str.replace(/#[0-9A-Fa-f]{6}\b/g, c => mixHex(c, "#E9EDE0", .18));

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

  // the family house: same silhouette as house(), finished with a roof edge, eave shadow,
  // window bars + sill, door panel + knob + step and a capped chimney
  function farmHouse(x, w = 300, h = 230) {
    const y = G, rt = y - h - h * .45, wx = x + w * .12, wy = y - h * .7, ww = w * .26, wh = h * .3, dx = x + w * .6, dw = w * .22;
    return `<g>
      <rect x="${x + 92}" y="${y - 330}" width="26" height="70" fill="#8C5A3C"/><rect x="${x + 86}" y="${y - 336}" width="38" height="10" rx="3" fill="#6E4430"/>
      <rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="#F1E4CF"/>
      <rect x="${x + w * .78}" y="${y - h}" width="${w * .22}" height="${h}" fill="#000" opacity=".06"/>
      <rect x="${x}" y="${y - h}" width="${w}" height="16" fill="#000" opacity=".07"/>
      <rect x="${x}" y="${y - 14}" width="${w}" height="14" fill="#D9C7AC"/>
      <path d="M${x - 24} ${y - h + 4} L${x + w / 2} ${rt} L${x + w + 24} ${y - h + 4}Z" fill="#B4532E"/>
      <path d="M${x + w / 2} ${rt} L${x + w + 24} ${y - h + 4} L${x + w / 2 + 30} ${y - h + 4}Z" fill="#000" opacity=".08"/>
      <path d="M${x - 24} ${y - h + 4} L${x + w / 2} ${rt} L${x + w + 24} ${y - h + 4}" stroke="#963F22" stroke-width="10" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
      <rect class="win" x="${wx}" y="${wy}" width="${ww}" height="${wh}" rx="6" fill="#9FC6D6" stroke="#6B4A36" stroke-width="7"/>
      <path d="M${wx + ww / 2} ${wy} V${wy + wh} M${wx} ${wy + wh / 2} H${wx + ww}" stroke="#6B4A36" stroke-width="5"/>
      <path d="M${wx + 8} ${wy + wh - 8} L${wx + ww * .45} ${wy + 8}" stroke="#fff" stroke-width="6" opacity=".35" stroke-linecap="round"/>
      <rect x="${wx - 8}" y="${wy + wh + 2}" width="${ww + 16}" height="9" rx="3" fill="#8C5A3C"/>
      <rect x="${dx}" y="${y - h * .58}" width="${dw}" height="${h * .58}" rx="6" fill="#6B4A36"/>
      <rect x="${dx + 8}" y="${y - h * .58 + 10}" width="${dw - 16}" height="${h * .58 - 26}" rx="4" fill="#7A5640"/>
      <circle cx="${dx + dw - 12}" cy="${y - h * .3}" r="4" fill="#D9A54A"/>
      <rect x="${dx - 8}" y="${y - 8}" width="${dw + 16}" height="10" rx="3" fill="#BDB4A8"/></g>`;
  }

  /* ---------- drying beds (chapter 2) ----------
     Raised to Tito's chest on wooden legs, with a mesh tray that sags a little. */
  const DRY = { G, FEET: 872, TOP: 742, BED1: [2385, 2605], BED2: [2630, 2850] }, DRY_BEDS = [DRY.BED1, DRY.BED2];
  function bedBack([x0, x1]) {
    const T = DRY.TOP;
    let g = `<ellipse cx="${(x0 + x1) / 2}" cy="${G + 2}" rx="${(x1 - x0) * .55}" ry="7" fill="#000" opacity=".1"/>`;
    g += `<rect x="${x0 + 16}" y="${T}" width="9" height="${G - T}" fill="#5E4128"/><rect x="${x1 - 25}" y="${T}" width="9" height="${G - T}" fill="#5E4128"/>`;
    g += `<path d="M${x0} ${T + 6} Q${(x0 + x1) / 2} ${T + 22} ${x1} ${T + 6} Z" fill="#E6D8BC" opacity=".9"/>`;
    let mesh = ""; for (let x = x0 + 6; x < x1; x += 10) mesh += `M${x} ${T + 6} l-6 12 M${x} ${T + 6} l6 12 `;
    return g + `<path d="${mesh}" stroke="#B9A47E" stroke-width="1.2" opacity=".8"/>`;
  }
  function bedFront([x0, x1]) {
    const T = DRY.TOP;
    return `<rect x="${x0 - 4}" y="${T - 4}" width="${x1 - x0 + 8}" height="11" rx="2" fill="#8A6040"/>` +
      `<rect x="${x0 + 4}" y="${T + 4}" width="11" height="${G - T - 2}" fill="#7A5638"/><rect x="${x1 - 15}" y="${T + 4}" width="11" height="${G - T - 2}" fill="#7A5638"/>` +
      `<path d="M${x0 + 12} ${G - 14} L${x1 - 12} ${T + 18}" stroke="#7A5638" stroke-width="5"/>`;
  }
  // a chalk slate on a stake above the cherries: how long this batch has dried, and its moisture.
  // cx sits clear of Tito's face at the spots where he stops (2320, 2490, 2660, 2840)
  function bedTag(cx, day, moisture) {
    const w = 112, h = 60, y = DRY.TOP - 84;
    return `<g><rect x="${cx - 3}" y="${y + h - 4}" width="6" height="${DRY.TOP - y - h + 2}" fill="#6E4A33"/>` +
      `<rect x="${cx - w / 2}" y="${y}" width="${w}" height="${h}" rx="5" fill="#8A6040"/><rect x="${cx - w / 2 + 5}" y="${y + 5}" width="${w - 10}" height="${h - 10}" rx="3" fill="#33352F"/>` +
      `<text x="${cx}" y="${y + 29}" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="20" letter-spacing="1" fill="#F3EBDD">${day.toUpperCase()}</text>` +
      `<text x="${cx}" y="${y + 47}" text-anchor="middle" font-family="Manrope" font-weight="700" font-size="14" fill="#BFD3E0">${moisture} moisture</text></g>`;
  }

  function lamp(x) {
    return `<g><rect x="${x - 5}" y="${G - 330}" width="10" height="330" fill="#2E2A2A"/><path d="M${x} ${G - 330} q0 -20 30 -20 h10" stroke="#2E2A2A" stroke-width="8" fill="none"/><rect x="${x + 28}" y="${G - 352}" width="26" height="16" rx="4" fill="#2E2A2A"/>
      <circle class="glow" cx="${x + 41}" cy="${G - 330}" r="70" fill="url(#lampGlow)" opacity="0"/><circle cx="${x + 41}" cy="${G - 334}" r="7" fill="#FFE2A0"/></g>`;
  }

  const defs = `<defs>
    <radialGradient id="lampGlow"><stop offset="0" stop-color="#FFD98A" stop-opacity=".9"/><stop offset="1" stop-color="#FFD98A" stop-opacity="0"/></radialGradient>
    <pattern id="wavePat" width="120" height="40" patternUnits="userSpaceOnUse"><path d="M0 20 q30 -14 60 0 t60 0" stroke="#A9CFDB" stroke-width="4" fill="none"/></pattern>
    <pattern id="brick" width="60" height="30" patternUnits="userSpaceOnUse"><path d="M0 30 h60 M0 15 h60 M30 0 v15 M0 15 v15 M60 15 v15" stroke="#D6C2A6" stroke-width="2"/></pattern>
  </defs>`;

  /* ---------------- FAR ---------------- */
  function far() {
    let s = defs;
    s += `<g id="farHills">${wash(hillPath(-100, 2600, 600, 250, 1.2, .4, "#C6D2C4") + hillPath(-100, 2600, 670, 190, 3.1, 2.2, "#AFC2AE"))}</g>`;
    let city = "";
    for (let x = 1500; x < 5000;) { const w = R(50, 130), h = R(90, 340); city += `<rect x="${x}" y="${740 - h}" width="${w}" height="${h + 300}" fill="#B9A6AC"/>`; x += w + R(4, 20); }
    s += `<g id="farCity" opacity="0">${city}</g>`;
    return s;
  }

  /* ---------------- MID ---------------- */
  function mid() {
    let s = defs, hills = "";
    const mb = 735, ma = 150, p1 = .6, p2 = 1.7, X1 = 8000;
    s += `<defs>${["paloVerde", "guaba", "poro", "platano"].map(k => `<g id="tree-${k}">${wash(TREE[k]())}</g>`).join("")}</defs>`;
    hills += hillPath(-100, X1, mb, ma, p1, p2, wash("#A7BC84"), 'id="loma"');
    // far coffee rows: dashed stripes that follow the loma's contour, clipped to it
    hills += `<clipPath id="lomaClip"><use href="#loma"/></clipPath><g clip-path="url(#lomaClip)">`;
    for (let k = 1; k <= 9; k++) {
      const pts = []; for (let x = -100; x <= 6200; x += 40) pts.push([x, hillY(x, mb, ma, p1, p2) + k * 15 + k * k * 1.2]);
      hills += `<path d="${smooth(pts)}" stroke="${wash("#8FA96E")}" stroke-width="${f1(3 + k * .5)}" fill="none" stroke-linecap="round" stroke-dasharray="${f1(18 + k * 3)} ${f1(5 + k)}"/>`;
    }
    hills += `</g>`;
    // trees on the loma, cycling the four species, nearer (lower) ones drawn last
    let ts = 77; const tr = () => (ts = (ts * 16807) % 2147483647) / 2147483647;
    const sp = ["paloVerde", "guaba", "poro", "platano"], trees = [];
    for (let i = 0, step = 1600 / 12; -100 + (i + .5) * step < 6200; i++) {
      const x = -100 + (i + .5) * step + (tr() * 120 - 60), y = hillY(x, mb, ma, p1, p2) + 18 + tr() * 22, sc = .36 + tr() * .14;
      trees.push([y, `<use href="#tree-${sp[i % 4]}" transform="translate(${f1(x)} ${f1(y)}) scale(${sc.toFixed(3)})"/>`]);
    }
    hills += trees.sort((a, b) => a[0] - b[0]).map(t => t[1]).join("");
    hills += hillPath(-100, X1, 800, 50, 2.4, .9, "#97B072");
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
    s += `<defs>${CAFETO}</defs>`;
    s += `<g transform="translate(2330 ${G}) scale(.85)">${TREE.paloVerde()}</g>`;
    s += cafetal(520, 2280, 1300);
    s += farmHouse(140);
    s += `<g><rect x="610" y="${G - 170}" width="12" height="170" fill="#7A5638"/><rect x="700" y="${G - 170}" width="12" height="170" fill="#7A5638"/>
      <rect x="586" y="${G - 236}" width="150" height="80" rx="8" fill="#9A6E48"/><text x="661" y="${G - 202}" text-anchor="middle" font-family="Fraunces" font-size="22" fill="#F3EBDD">FINCA</text><text x="661" y="${G - 176}" text-anchor="middle" font-family="Fraunces" font-size="20" font-style="italic" fill="#F3EBDD">Palo Verde</text></g>`;
    // the cherries Tito picks, on an upper branch of the front plant at x = 1300
    s += `<g id="pickCherries">${[[1240, 640], [1252, 644], [1246, 651], [1258, 648], [1234, 646]].map(([x, y]) => `<g>${cherry(x, y, 6, "#B3261E")}</g>`).join("")}</g>`;

    /* -- 02 dry + roast -- */
    // two raised African beds; the cherries, sack, basket and rake on them are animated by drying.js
    s += DRY_BEDS.map(bedBack).join("") + bedTag(2580, "Day 1", "65%") + bedTag(2775, "Day 18", "11%");
    s += `<g id="dryBehind"></g>` + DRY_BEDS.map(bedFront).join("") + `<g id="dryFront"></g>`;
    // roastery building; its machines (huller, belt, roaster, cooling tray) are drawn by roastery.js
    s += `<g id="roastery"><rect x="3020" y="${G - 420}" width="900" height="420" fill="#E9D9C3"/><rect x="3020" y="${G - 420}" width="900" height="420" fill="url(#brick)" opacity=".7"/>
      <rect x="3000" y="${G - 446}" width="940" height="34" fill="#3A2A20"/>
      <rect x="3330" y="${G - 520}" width="420" height="80" rx="10" fill="#1E1410"/><text x="3540" y="${G - 468}" text-anchor="middle" font-family="Fraunces" font-size="40" fill="#F3EBDD">Roastery</text>
      <rect x="3800" y="${G - 760}" width="46" height="330" fill="#5A4436"/>
      <rect x="3150" y="${G - 330}" width="110" height="140" rx="6" fill="#9FC6D6" stroke="#6B4A36" stroke-width="8"/></g>`;

    /* -- 03 packing: an open shed; the line, bags, bucket and box are drawn by roastery.js -- */
    s += `<g><rect x="4020" y="470" width="660" height="${G - 470}" fill="#EFE3CF"/><rect x="4020" y="${G - 14}" width="660" height="14" fill="#E2D3BA"/>
      <rect x="4000" y="452" width="700" height="26" rx="4" fill="#3A2A20"/><rect x="4040" y="478" width="22" height="${G - 478}" fill="#B9A890"/><rect x="4640" y="478" width="22" height="${G - 478}" fill="#B9A890"/>
      <rect x="4250" y="490" width="200" height="44" rx="8" fill="#1E1410"/><text x="4350" y="521" text-anchor="middle" font-family="Fraunces" font-size="24" fill="#F3EBDD">Packing</text></g>`;
    [[4780, 0], [4850, 0], [4815, -56]].forEach(([x, dy]) => s += `<g><rect x="${x}" y="${G - 56 + dy}" width="64" height="56" rx="4" fill="#C8955A"/><rect x="${x + 27}" y="${G - 56 + dy}" width="10" height="56" fill="#E8D3AE"/></g>`);
    s += `<g id="roastDyn"></g>`;

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
    mk("lProps", "main", `<g id="dryHeld"></g>`);      // what Tito holds, drawn in front of him in world units
  }

  function resize(u) {
    for (const [id, key] of [["lFar", "far"], ["lMid", "mid"], ["lMain", "main"], ["lProps", "main"], ["lFore", "fore"]]) {
      const svg = document.querySelector(`#${id} svg`);
      svg.setAttribute("width", SIZE[key] * u); svg.setAttribute("height", 1000 * u);
    }
  }

  return { build, resize, FACTOR, G, DRY };
})();
