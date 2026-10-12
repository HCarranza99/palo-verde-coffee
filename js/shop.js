/* ==========================================================================
   SHOP — product grid, one-time vs subscription, sizes, cart drawer.
   Demo only: the cart lives in the browser, checkout is not wired up.
   ========================================================================== */
const IMG = id => `https://images.unsplash.com/${id}?w=900&q=75&auto=format`;
const products = [
  { id: "finca", name: "Finca Palo Verde", origin: "Washed · Caturra · 1,650 m", roast: "medium", level: 3, notes: ["Milk chocolate", "Red apple", "Panela"], price: { "12 oz": 19, "2 lb": 44 }, img: IMG("photo-1497935586351-b67a49e012bf"), badge: "Bestseller" },
  { id: "honey", name: "Honey Lot", origin: "Honey · Bourbon · 1,700 m", roast: "light", level: 2, notes: ["Caramel", "Apricot", "Cinnamon"], price: { "12 oz": 22, "2 lb": 52 }, img: IMG("photo-1607681034540-2c46cc71896d"), badge: "New harvest" },
  { id: "natural", name: "Natural Reserve", origin: "Natural · Geisha · 1,800 m", roast: "light", level: 1, notes: ["Strawberry", "Jasmine", "Cacao nib"], price: { "12 oz": 29, "2 lb": 68 }, img: IMG("photo-1447933601403-0c6688de566e"), badge: "Only 200 bags" },
  { id: "dark", name: "Tito's Espresso", origin: "Washed · Castillo · Blend", roast: "dark", level: 5, notes: ["Dark chocolate", "Molasses", "Almond"], price: { "12 oz": 17, "2 lb": 40 }, img: IMG("photo-1529892485617-25f63cd7b1e9"), badge: "For espresso" },
];
const SUB_OFF = 0.15, FREE_SHIP = 40;
let mode = "once", filter = "all";
const size = Object.fromEntries(products.map(p => [p.id, "12 oz"]));
let cart = [];
try { cart = JSON.parse(localStorage.getItem("pv-cart") || "[]"); } catch (e) { cart = []; }
const save = () => { try { localStorage.setItem("pv-cart", JSON.stringify(cart)); } catch (e) {} };
const money = n => "$" + n.toFixed(2);
const unit = (p, s, m) => p.price[s] * (m === "sub" ? 1 - SUB_OFF : 1);

function card(p) {
  const s = size[p.id], sub = mode === "sub";
  return `<article class="card" data-id="${p.id}">
    <div class="media"><img src="${p.img}" alt="${p.name} coffee" loading="lazy"><span class="badge">${p.badge}</span>
      <div class="quick">${Object.keys(p.price).map(k => `<button data-size="${k}" class="${k === s ? "on" : ""}">${k}</button>`).join("")}</div></div>
    <div class="info">
      <div class="top"><div><h3>${p.name}</h3><div class="origin">${p.origin}</div></div>
        <div class="price">${money(unit(p, s, mode))}${sub ? `<s>${money(p.price[s])}</s>` : ""}</div></div>
      <div class="notes">${p.notes.map(n => `<span>${n}</span>`).join("")}</div>
      <div class="roast">Roast <i>${[1, 2, 3, 4, 5].map(i => `<u class="${i <= p.level ? "f" : ""}"></u>`).join("")}</i></div>
      <button class="add" data-add><span>${sub ? "Subscribe" : "Add to cart"} · ${s}</span><span>→</span></button>
    </div></article>`;
}

function render(animate) {
  const list = products.filter(p => filter === "all" || p.roast === filter);
  $("#grid").innerHTML = list.map(card).join("");
  if (animate) gsap.from("#grid .card", { y: 40, opacity: 0, duration: .8, stagger: .08, ease: "power3.out" });
}
render(false);
ScrollTrigger.create({ trigger: "#grid", start: "top 85%", once: true, onEnter: () => gsap.from("#grid .card", { y: 80, opacity: 0, duration: 1.1, stagger: .12, ease: "power3.out" }) });

/* filters */
$("#chips").addEventListener("click", e => {
  const b = e.target.closest(".chip"); if (!b) return;
  filter = b.dataset.f; $$(".chip").forEach(c => c.classList.toggle("on", c === b)); render(true);
});

/* one-time / subscribe pill */
const pill = $("#purchase .pill");
function placePill() { const on = $("#purchase button.on"); pill.style.left = on.offsetLeft + "px"; pill.style.width = on.offsetWidth + "px"; }
placePill(); window.addEventListener("resize", placePill); document.fonts.ready.then(placePill);
$("#purchase").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b || b.dataset.m === mode) return;
  mode = b.dataset.m; $$("#purchase button").forEach(x => x.classList.toggle("on", x === b)); placePill();
  gsap.to("#subNote", { opacity: mode === "sub" ? 1 : 0, x: mode === "sub" ? 0 : 10, duration: .4 });
  render(false);
  gsap.fromTo("#grid .price, #grid .add span:first-child", { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: .45, stagger: .04, ease: "power2.out" });
});

/* sizes + add to cart */
$("#grid").addEventListener("click", e => {
  const el = e.target.closest(".card"); if (!el) return;
  const p = products.find(x => x.id === el.dataset.id);
  const sb = e.target.closest("[data-size]");
  if (sb) { size[p.id] = sb.dataset.size; el.outerHTML = card(p); return; }
  const add = e.target.closest("[data-add]"); if (!add) return;
  const key = `${p.id}|${size[p.id]}|${mode}`;
  const line = cart.find(l => l.key === key);
  line ? line.qty++ : cart.push({ key, id: p.id, size: size[p.id], mode, qty: 1 });
  save(); flyToCart(el.querySelector(".media img")); updateCart();
  add.classList.add("done"); add.firstElementChild.textContent = "Added ✓";
  setTimeout(() => { add.classList.remove("done"); add.firstElementChild.textContent = `${mode === "sub" ? "Subscribe" : "Add to cart"} · ${size[p.id]}`; }, 1400);
});

function flyToCart(img) {
  const a = img.getBoundingClientRect(), b = $("#cartBtn").getBoundingClientRect();
  const f = document.createElement("img"); f.src = img.src; f.className = "fly"; document.body.appendChild(f);
  gsap.set(f, { left: a.left + a.width / 2 - 22, top: a.top + a.height / 2 - 22, scale: 2.2 });
  gsap.timeline({ onComplete: () => { f.remove(); gsap.fromTo("#cartBtn", { scale: 1.15 }, { scale: 1, duration: .5, ease: "elastic.out(1,.4)" }); } })
    .to(f, { left: b.left + b.width / 2 - 22, duration: .8, ease: "power1.inOut" }, 0)
    .to(f, { top: b.top + b.height / 2 - 22, duration: .8, ease: "back.in(1.4)" }, 0)
    .to(f, { scale: .4, duration: .8, ease: "power2.in" }, 0);
}

/* drawer */
function updateCart() {
  const count = cart.reduce((n, l) => n + l.qty, 0);
  $("#cartCount").textContent = count;
  const total = cart.reduce((n, l) => n + unit(products.find(p => p.id === l.id), l.size, l.mode) * l.qty, 0);
  $("#subtotal").textContent = money(total);
  const left = FREE_SHIP - total;
  $("#shipMsg").textContent = left > 0 ? `Add ${money(left)} more for free shipping` : "You've unlocked free US shipping 🎉";
  $("#shipBar").style.width = Math.min(100, total / FREE_SHIP * 100) + "%";
  $("#items").innerHTML = cart.length ? cart.map(l => {
    const p = products.find(x => x.id === l.id);
    return `<div class="item" data-key="${l.key}"><img src="${p.img}" alt=""><div><h4>${p.name}</h4><small>${l.size} · ${l.mode === "sub" ? "Every 2 weeks · −15%" : "One-time"}</small>
      <div class="qty"><button data-q="-1" aria-label="Less">−</button>${l.qty}<button data-q="1" aria-label="More">+</button></div></div>
      <b>${money(unit(p, l.size, l.mode) * l.qty)}</b></div>`;
  }).join("") : `<div class="empty">Your cart is empty.<br>Tito is waiting by the door.</div>`;
}
$("#items").addEventListener("click", e => {
  const b = e.target.closest("[data-q]"); if (!b) return;
  const line = cart.find(l => l.key === b.closest(".item").dataset.key);
  line.qty += +b.dataset.q; cart = cart.filter(l => l.qty > 0); save(); updateCart();
});
const drawer = $("#drawer");
$("#cartBtn").addEventListener("click", () => { drawer.classList.add("open"); lenis && lenis.stop(); });
drawer.addEventListener("click", e => { if (e.target.closest("[data-close]")) { drawer.classList.remove("open"); lenis && lenis.start(); } });
document.addEventListener("keydown", e => { if (e.key === "Escape" && drawer.classList.contains("open")) { drawer.classList.remove("open"); lenis && lenis.start(); } });
updateCart();
