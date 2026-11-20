# SuaveForge Research — Shader & VFX Laboratory
Updated 2026-11-21.

## Public route and integration
- `https://suaveforge.com/research/interactive/shaders/`
- Homepage Research mega-menu and mobile menu `쉐이더·VFX`.
- Research tile #04 and Interactive landing `쉐이더·VFX` study CTA. Physics lab cross-link.
- Existing 12 Interactive demos and 12 physics numerical experiments intentionally preserved; do not redesign or mutate them for shader work.

## The delivered GPU experience
- **16 independently authored GLSL ES 1.00 fragment programs** grouped into eight effect categories: metal/material, glass/refraction, liquid/distortion, dissolve/glitch, particles/smoke, raymarch/procedural, lighting/aurora, print/retro postprocessing.
- Each card supports actual GPU render, intensity, speed, palette, pause/resume, pointer-linked interactions, modal fullscreen-like enlargement, and reference links.
- A pin-to-compare tray shows up to **three GPU effects in parallel under a common intensity/speed**. Same parameter does not make different effects performance-equivalent.
- Renderer `shaders/lab.js` reuses **one WebGL 1.0 context** and compiles one shader program for each effect on demand. Each card's canvas is a **Canvas 2D presentation of pixels rendered by the shared WebGL context**; this is real GPU fragment rendering and deliberately avoids exhausting mobile devices' active WebGL context quota.
- The only shader program code is `shaders/effects.js`. All effect sources are original to SuaveForge and contain no copied Shadertoy/Paper/Shaders.com author source. No third-party images or textures are downloaded.
- WebGL absence is reported as an explicit fallback instead of claiming that a CSS animation is GPU rendering.
- Data are synthetic; stylized volumetric smoke/light/glass are approximations, not physically calibrated refraction/CFD.

## Curated professional sources
16 official references: Shadertoy, Paper Shaders, Shaders presets, WebGL Shader Lab, Book of Shaders, Codrops, pmndrs postprocessing, Three.js, Shader Park, GLSL Sandbox, glslCanvas, LYGIA, VertexShaderArt, React Bits, Inigo Quilez and Clyune.
- Links only. **No mirroring, iframe embedding, scraping vendor samples or appropriating professional author works**.
- Creative author showcase pieces require original author permissions. Commercial and Pro libraries are NOT free-to-reuse code. License provenance displayed per source.
- Third-party engine reuse in deliverables needs library version, plugin, dependency and assets checked separately.

## Important technical limitations
- GPU color conversion, blur, glass and ripple are illustrative; do not use for physical accuracy claims.
- The gallery is performance-aware: lazy rendering of visible cards, max five GPU draws/frame and a single shared context. Comparison pins initially select three complementary shaders.
- Browser support requires functional WebGL 1 and shader fragment precision; unsupported environments show explicit fallback.
- At this stage it is a **cross-effect comparison of self-authored shaders**, NOT comparison of the underlying algorithms or licensed original presets from multiple vendor engines.

## QA acceptance criteria
- Public repo `suaveforge/suaveforge-home-deploy` workflow `research-shaders-qa.yml`: syntax checks, static site, Chromium desktop & mobile.
- Check 16 GLSL programs all compile and actual WebGL-drawn pixels appear, categories all have two each, sliders/palettes/pausing, compare pins and common sliders, modal, search, nav, no horizontal overflow, 16 linked references.
- Produce full-page desktop/mobile screenshots and one screenshot per category plus comparison screenshot.
- Historical reports are not substitutes for inspecting new run ID and screenshots. Record actual latest success and artifact IDs below after QA.

## Handoff / verification history
- Source: `suaveforge/suaveforge-home`; public repo: `suaveforge/suaveforge-home-deploy`.
- Implementation paths: `research/interactive/shaders/{index.html,shaders.css,effects.js,lab.js,qa.cjs,README.md}`.
- Do not confuse public Pages build status with direct domain accessibility; check browser test separately.
