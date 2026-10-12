# Palo Verde Coffee — prototype

Concept storefront for a direct-trade specialty coffee brand. The landing page tells the farm-to-door story as a scroll-driven animation (GSAP ScrollTrigger + Lenis), then opens into a demo shop.

- `index.html`: page structure
- `css/style.css`: styles
- `js/world.js`: illustrated side-scrolling world (layered SVG parallax)
- `js/tito.js`: procedural character rig (walk cycle tied to distance travelled)
- `js/story.js`: preloader, hero, and the pinned scroll timeline
- `js/shop.js`: product grid, subscriptions, cart drawer (demo, no checkout)

Photos are Unsplash placeholders. Run locally with any static server, e.g. `python -m http.server`.
