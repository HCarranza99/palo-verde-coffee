/* ==========================================================================
   TITO — a procedural character rig.
   Instead of a pre-baked Lottie, every joint is driven each frame from a few
   pose weights (walk, reach, carry, sit, wave) that the scroll timeline tweens.
   The walk cycle phase advances with the distance actually travelled, so feet
   stay planted and scrolling backwards literally walks him backwards.
   ========================================================================== */
const Tito = (() => {
  const $ = id => document.getElementById(id);
  const J = {                                  // joint -> [element, pivotX, pivotY]
    armL: [$("armL"), 82, 150], foreL: [$("foreL"), 82, 188],
    legL: [$("legL"), 92, 216], shinL: [$("shinL"), 92, 254],
    legR: [$("legR"), 110, 216], shinR: [$("shinR"), 110, 254],
    armR: [$("armR"), 118, 150], foreR: [$("foreR"), 118, 188],
    head: [$("head"), 100, 132],
  };
  const rigEl = $("rig"), shadow = $("shadow"), svg = $("tito");

  // pose weights, tweened by the story timeline
  const pose = { walk: 1, reach: 0, carry: 0, sit: 0, wave: 0, y: 0 };

  let phase = 0, moving = 0, facing = 1;
  const mix = (a, b, t) => a + (b - a) * t;
  const set = (k, a) => { const [el, x, y] = J[k]; el.setAttribute("transform", `rotate(${a.toFixed(2)} ${x} ${y})`); };

  // dp = world units travelled since last frame, t = seconds
  function update(dp, t) {
    phase += dp * 0.042;
    const speed = Math.min(1, Math.abs(dp) / 2.5);
    moving += (speed - moving) * 0.15;
    if (Math.abs(dp) > 0.4) facing = dp > 0 ? 1 : -1;
    svg.style.transform = facing < 0 ? "scaleX(-1)" : "";

    const w = pose.walk * moving;
    const s = Math.sin(phase), c = Math.cos(phase);
    const sL = Math.sin(phase + Math.PI), cL = Math.cos(phase + Math.PI);

    // --- walk cycle
    let legR = -28 * s * w, legL = -28 * sL * w;
    let shinR = 46 * Math.max(0, c) * w + 4, shinL = 46 * Math.max(0, cL) * w + 4;
    let armR = 24 * s * w, armL = 24 * sL * w;
    let foreR = -14 - 10 * Math.max(0, -s) * w, foreL = -14 - 10 * Math.max(0, -sL) * w;
    let head = 2 * Math.sin(phase * 2) * w + Math.sin(t * 1.3) * 1.5;
    const breathe = Math.sin(t * 2.2) * 1.4 * (1 - w);
    let bob = -6 * Math.abs(c) * w + breathe;

    // --- reach up into the bush (with a little picking wiggle)
    const r = pose.reach;
    armR = mix(armR, -150 + Math.sin(t * 9) * 8, r);
    foreR = mix(foreR, -28 + Math.sin(t * 9 + 1) * 10, r);
    head = mix(head, -9, r);

    // --- carry the box in front
    const k = pose.carry;
    armR = mix(armR, -55, k); armL = mix(armL, -62, k);
    foreR = mix(foreR, -55, k); foreL = mix(foreL, -50, k);

    // --- sit on the paper plane
    const st = pose.sit;
    legR = mix(legR, -84, st); legL = mix(legL, -78, st);
    shinR = mix(shinR, 88, st); shinL = mix(shinL, 84, st);
    bob = mix(bob, 22 + Math.sin(t * 2.5) * 2, st);

    // --- wave hello
    const wv = pose.wave;
    armR = mix(armR, -160 + Math.sin(t * 11) * 16, wv);
    foreR = mix(foreR, -22 + Math.sin(t * 11 + .8) * 18, wv);
    head = mix(head, 4 + Math.sin(t * 3) * 2, wv);

    set("legR", legR); set("legL", legL); set("shinR", shinR); set("shinL", shinL);
    set("armR", armR); set("armL", armL); set("foreR", foreR); set("foreL", foreL); set("head", head);
    rigEl.setAttribute("transform", `translate(0 ${(bob + pose.y).toFixed(2)})`);
    shadow.setAttribute("rx", (46 - Math.abs(bob) * .8 - pose.y * .1).toFixed(1));
    shadow.style.opacity = 1 - st;
  }

  return { pose, update };
})();
