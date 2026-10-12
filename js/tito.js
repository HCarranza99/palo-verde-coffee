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
  const hat = $("hat"), apron = $("apron"), stache = $("stache"), tint = $("ambTint"), rim = $("rimLight");

  // pose weights, tweened by the story timeline
  const pose = { walk: 1, reach: 0, carry: 0, sit: 0, wave: 0, y: 0 };
  // scene light, also tweened by the timeline: warm = sunset, dusk = evening, rim = street-lamp edge light
  const light = { warm: 0, dusk: 0, rim: 0 };
  const WARM = [251, 222, 196], DUSK = [210, 192, 204];

  let phase = 0, moving = 0, facing = 1, lastHead = 0, lastBob = 0, lightKey = "";
  const mix = (a, b, t) => a + (b - a) * t;
  // tiny damped spring for secondary motion (hat, apron)
  const spring = (s, target, k = .18, damp = .74) => { s.v = (s.v + (target - s.x) * k) * damp; s.x += s.v; return s.x; };
  const hatRot = { x: 0, v: 0 }, hatY = { x: 0, v: 0 }, apronRot = { x: 0, v: 0 };
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

    // --- reach up into the bush (with a little picking wiggle), arm kept clear of the face
    const r = pose.reach;
    armR = mix(armR, -118 + Math.sin(t * 9) * 6, r);
    foreR = mix(foreR, -50 + Math.sin(t * 9 + 1) * 10, r);
    head = mix(head, -9, r);

    // --- carry the box: front hand flat on its side, back hand gripping the far top edge
    const k = pose.carry;
    armR = mix(armR, -35, k); armL = mix(armL, -62, k);
    foreR = mix(foreR, -55, k); foreL = mix(foreL, -50, k);

    // --- sit on the paper plane
    const st = pose.sit;
    legR = mix(legR, -84, st); legL = mix(legL, -78, st);
    shinR = mix(shinR, 88, st); shinL = mix(shinL, 84, st);
    bob = mix(bob, 22 + Math.sin(t * 2.5) * 2, st);

    // --- wave hello
    const wv = pose.wave;
    armR = mix(armR, -110 + Math.sin(t * 11) * 6, wv);
    foreR = mix(foreR, -60 + Math.sin(t * 11 + .8) * 22, wv);
    head = mix(head, 4 + Math.sin(t * 3) * 2, wv);

    set("legR", legR); set("legL", legL); set("shinR", shinR); set("shinL", shinL);
    set("armR", armR); set("armL", armL); set("foreR", foreR); set("foreL", foreL); set("head", head);
    // --- secondary motion: the hat and apron lag behind the body
    const dh = head - lastHead, vy = bob - lastBob; lastHead = head; lastBob = bob;
    const hr = spring(hatRot, Math.max(-4, Math.min(4, -dh * 2.5)));
    const hy = spring(hatY, Math.max(-3, Math.min(3, -vy * 2)));
    hat.setAttribute("transform", `translate(0 ${hy.toFixed(2)}) rotate(${hr.toFixed(2)} 100 66)`);
    apron.setAttribute("transform", `rotate(${spring(apronRot, 3 * moving * pose.walk + Math.sin(phase * 2) * 1.2 * w).toFixed(2)} 100 178)`);
    // mustache: wiggles while waving, plus a rare twitch
    const twitch = Math.pow(Math.max(0, Math.sin(t * .9)), 60) * Math.sin(t * 40) * 4;
    stache.setAttribute("transform", `rotate(${(wv * Math.sin(t * 14) * 5 + twitch).toFixed(2)} 130 121)`);

    // --- squash & stretch with the walk bounce, anchored at the feet
    const sy = 1 + .014 * w * (2 * Math.abs(c) - 1), sx = 1 - (sy - 1) * .6;
    rigEl.setAttribute("transform", `matrix(${sx.toFixed(4)} 0 0 ${sy.toFixed(4)} ${(100 - 100 * sx).toFixed(2)} ${(297 - 297 * sy + bob + pose.y).toFixed(2)})`);

    // --- scene light (only touches the DOM when it changes; no filter at all in daylight)
    const col = WARM.map((v, i) => Math.round(mix(mix(255, v, light.warm), DUSK[i], light.dusk)));
    const key = col.join() + "|" + light.rim.toFixed(2);
    if (key !== lightKey) {
      lightKey = key;
      tint.setAttribute("flood-color", `rgb(${col.join()})`);
      rim.setAttribute("flood-opacity", (light.rim * .75).toFixed(2));
      if (light.warm + light.dusk + light.rim > .001) rigEl.setAttribute("filter", "url(#titoLight)");
      else rigEl.removeAttribute("filter");
    }
    shadow.setAttribute("rx", (46 - Math.abs(bob) * .8 - pose.y * .1).toFixed(1));
    shadow.style.opacity = 1 - st;
  }

  return { pose, light, update };
})();
