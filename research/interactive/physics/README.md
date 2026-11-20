# SuaveForge Research / Physics Simulation Lab — 2026-11-21

## Purpose and entrypoints
- Homepage research mega-menu and mobile submenu: `물리 시뮬레이션`.
- Research landing: third study tile, preserved charts and Interactive.
- Interactive laboratory: a distinct `물리 시뮬레이션 · 실제 계산 실험 12종` banner before existing 12 UI demos.
- Physics Lab: `https://suaveforge.com/research/interactive/physics/`.

## Exact scope
- Source: `suaveforge/suaveforge-home`; public deployment repo: `suaveforge/suaveforge-home-deploy`.
- New: `research/interactive/physics/{index.html,physics.css,models.js,lab.js,qa.cjs,README.md}`.
- Existing affected: `index.html`, `research/index.html`, `research/interactive/index.html`, `research/interactive/interactive.css`. All original chart engines, sample gallery, Three.js building/device, content and deployment remain untouched.
- Only standalone Canvas2D/vanilla JS in the physics gallery; no physics vendor SDK, licensed demo art or external runtime module.

## Twelve interactive numerical models (two per category)
1. Rigid: impulse circle-circle collision with 2D gravity, restitution and boundary; Newtonian projectile with gravity, launch angle, trail.
2. Soft: Verlet cloth with edge-distance constraints, wind & mouse drag; PBD rope with gravity, constraints & mouse drag.
3. Fluid: position-constrained liquid-particle approximation (NOT full fluid dynamics); 1D height-field surface waves from a discretized wave equation.
4. Waves: damped spring oscillator `m*x¨+c*x˙+kx=0`; nonlinear double pendulum integrated via RK4.
5. Gravity: approximate central inverse-square gravity orbits; softened pairwise N-body gravity.
6. Electromagnetics/optics: Coulomb electric vector field + moving test charge; Snell's law refraction with editable refractive index and incident angle.
- All models use a bounded, fixed time step of 1/90s and visibility-aware rendering. User can modify one per-model physical parameter, click/drag where applicable, pause/resume, reset, and open a larger independent copy of the solver.
- Formulas are representative and constants/coordinates are display-oriented. NOT validated for scientific measurement, mechanical engineering, CFD/FEM or classroom assessment without separate calibration.
- Fluid is explicitly marked as a particle-based approximation; no misleading claim to solve incompressible Navier–Stokes.

## Curated official references
- Fourteen links from Rapier, Matter.js, Planck.js, Ten Minute Physics, WebGPU demos, Falstad, myPhysicsLab and PhET.
- All links are ordinary external links and never embedded as remote frames, copied code, or screenshotted proprietary assets.
- PhET's regular HTML simulations carry CC BY-NC 4.0, with commercial use requiring separate license. Link only. https://phet.colorado.edu/en/licensing
- Ten Minute Physics official page https://matthias-research.github.io/pages/tenMinutePhysics/index.html, author-specific license must be examined before reuse.
- Rapier official demos https://rapier.rs/demos/ , Matter.js official demo https://brm.io/matter-js/demo/.

## QA contract
- CI runs source syntax checks, static host, Chromium `research/interactive/physics/qa.cjs`.
- Verify 12/12 models in 6 category groups, actual integration advances and changes numerical states, parameters change, pause stops ticks, reset restarts, canvas renders, pointer click is processed, search filters, full-size modal, 14 reference links, and direct routes from site + Research + Interactive.
- Mobile 390×844 check real Canvas model + param slider + visible current link + no horizontal overflow; desktop 1440×930 check no overflow.
- Save screenshots per category and full catalog for desktop and mobile, plus machine-readable `qa-report.json` in GitHub Actions artifact.
- Success must be based on actual Actions conclusion and logs. GitHub Pages success alone is not a production-domain visual test.
