# SuaveForge Research — Interactive Systems (2026-11-21)

## Goal & routes
- Home `https://suaveforge.com/`: existing *연구소* mega-menu > *인터랙티브*; mobile submenu too.
- Research `https://suaveforge.com/research/`: second research collection.
- Live & curated catalog: `https://suaveforge.com/research/interactive/`.

## Scope (preserve existing site)
- New files only: `research/interactive/index.html`, `interactive.css`, `catalog.js`, `spatial-lab.js`, `qa/qa.cjs`.
- Existing code touched: only one mega-menu link, one mobile nav link, Research home tile/nav/CTA, and cross-links from the four chart research pages. No changes to work/services, current chart renderers, production backends or shared navigation JavaScript.
- Original and public repositories: `suaveforge/suaveforge-home` & `suaveforge/suaveforge-home-deploy`.

## Original live demos
1. Synthetic 5-level building, entirely programmatically generated geometry. Theme layer: structure, electrical, HVAC, fire/safety. Dimming and highlighting, 1F–5F selection, model click/raycast, orbit drag, wheel zoom, exploded levels, automatic rotation, move/rotate/scale animations and reset.
2. Synthetic modular HVAC equipment: original base, electrical board, vent/fan, sensor and transparent shell components; same theme layer / exploded transforms / camera and animation controls.
3. The CSS/SVG research hero is original illustrative geometry and may not be described as a real surveyed building.
4. Implementation: Three.js r180 (MIT), imported over a pinned jsDelivr URL, WebGL software fallback message; **no external 3D asset or proprietary 3D model**.
5. 24 curated direct official source URLs across spatial/BIM, products, motion, WebGL/shaders, geospatial/data. No vendor source code or images are scraped, cached, or embedded on the SuaveForge site.

## Provenance & license cautions
- `Three.js` MIT permitted open source. `xeokit` often AGPL or commercial; not presumed usable in a private commercial app without review.
- That Open package/component license is product-specific and must be examined before applying to delivery systems.
- Spline, GSAP, Rive, Theatre.js and independent Shadertoy/CodeDrops/Awwwards works may have separate content or commercial license restrictions. The research catalog only links.
- IFC/BIM viewer functionality and real survey-grade alignment are NOT implemented; building uses synthetic conceptual geometry and imaginary floor systems.
- Data, routing and actual engineering dimensions are invented solely for demonstration, not real facility facts.

## QA acceptance
- GitHub Actions in public repo runs separate Playwright Chromium with software WebGL support, static local server, JS syntax checks and artifacts.
- Check WebGL renderer real canvas; menu links; catalog 24 items and 5 filters; search; all four layers; selected floors; levels separated after explode; model rotation, translation, scaling; module switch/part separation; mobile taps, no horizontal overflow.
- Capture desktop building, equipment, exploded HVAC and mobile screenshots **after animations have had time to complete**.
- Record actual run ID, logs, artifact and deploy only on success. DNS-independent static QA does not establish production-domain reachability.
- WebGL blocked browser should show fallback, not falsely claim a working 3D render.

## Later work (not included)
- Real IFC BIM ingestion, object metadata from source model, persistent floor selections and server data.
- Dedicated product galleries with user-uploaded GLB and independent material rights review.
- A benchmark/side-by-side comparison of multiple vendors with the same dataset and animation.
