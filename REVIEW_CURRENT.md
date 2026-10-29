# Gamber Valley review — 27 October 2026

Reviewed the current workspace independently of `PROJECT_REVIEW.md`. No application source was changed. The production build regenerated build output and generated Next declarations/type metadata.

## Findings

### 1. Medium: collection keyboard scrolling mixes coordinate systems

Location: `src/sections/Collection.tsx:61`; `src/sections/Collection.module.css:6`, `:91`.

`reveal()` uses `li.offsetLeft` as an offset within the track. The track is not positioned; its list items' positioned ancestor is the stage. Their offsets therefore include the details column to the left of the track. The computed scroll destination overestimates the required movement by that column's width, before clamping. Tabbing between cards can move the focused card too far left, potentially behind the details panel, instead of centering it in the visible gallery.

Calculate the card position relative to the track, either by establishing the track as the offset parent or by subtracting its offset in the same coordinate system. Validate with keyboard navigation through all four cards at desktop widths and after resizing. This finding is from source inspection; interactive reproduction was unavailable.

### 2. Medium: covered craft scenes retain keyboard and assistive-technology access

Location: `src/sections/Craft.tsx:70`, `:114`; `src/components/craft/Hotspot.tsx:31`; `src/components/craft/Craft.module.css:21`.

Desktop craft articles occupy the same area. Clip paths reveal later articles above earlier ones, but the articles never become inert or otherwise leave keyboard navigation when covered. Once the second or third scene covers the first, the first scene's hotspot buttons remain focusable. A keyboard user can activate a disclosure behind the visible scene, with no focus handler to reveal the corresponding scene. Clip paths also do not provide an accessibility-tree visibility policy for the scene content.

Track the active scene and synchronize focusability/accessibility with visibility. Keep all scenes accessible in the stacked layout; define a safe focus handoff when a scene becomes inactive. Verify forward and reverse Tab navigation at each desktop scene and across breakpoint/reduced-motion changes. Source finding, not browser reproduced.

### 3. Medium: age-gate denial can be overwritten by an in-flight confirmation

Location: `src/components/AgeGate.tsx:84`, `:125`.

Confirmation writes the verification flag immediately and starts an exit timeline whose completion unconditionally sets status to `entered`. The No button remains active during the beginning of that animation. Activating Yes and then quickly No sets `denied`, but does not cancel the confirmation timeline or undo storage. The original completion then admits the visitor after displaying the denial state.

Make confirmation/denial mutually exclusive during the exit, or cancel the pending confirmation and clear its stored result when denial is chosen. Own the exit timeline so it can also be cleaned up on unmount. Verify rapid pointer and keyboard activation with motion enabled. The conflicting state transitions are evident in source; timing was not browser tested.

### 4. Low: documented custom cursor is never mounted

Location: `src/components/Cursor.tsx:11`, `src/app/layout.tsx:34`, `README.md:33`.

The Cursor component and styles exist, and buttons advertise cursor labels, but no application file imports or renders Cursor. The documented cursor and its Select/Discover/Explore labels never appear. Either mount it within MotionProvider or remove the unused component/hooks and update the experience documentation if the native cursor is intentional.

## Validation

| Check | Result |
| --- | --- |
| `npm.cmd run typecheck` | Passed |
| `npm.cmd run build` | Passed compilation, type checking and static generation |
| `npm.cmd test` | All eight passed: seven routes and actual 404 handling |
| `npm.cmd ls --depth=0` | Installed direct dependencies agree with manifest |
| Lockfile metadata | Version 3; 129 package entries; root dependencies agree; every non-root package has integrity metadata; resolved URLs use npm registry |
| Dependency vulnerability audit | Unverified: `npm.cmd audit --json` failed to reach the advisory endpoint |
| Browser/visual/GPU tests | Unverified: browser setup failed before a connection could be established |

The HTTP tests inspect server HTML. They do not execute the age gate, menu, animation system, canvas, or responsive interaction. There is no lint script or CI configuration in this workspace. There is no Git repository here.

## Existing fixes checked in source

The historical findings in `PROJECT_REVIEW.md` should not be read as current open defects. Current code includes native modal menu focus handling and scroll locking, cancellation of closing menu tweens, craft clip restoration, collection timeline reversion, WebGL2 detection and renderer/model error boundaries, capability-gated optional model viewers, working policy routes, a valid closing heading ID, separate development/production output, and a route-transition watchdog. The build failure described in the historical report did not recur in this run. Current installed versions are Next.js 16.4.3 and React/React DOM 19.3.1; the failed audit means this review makes no claim that those dependencies are vulnerability-free.

## Coverage and architecture

All 67 files under `src` were read, along with the test suite, root project documents/configuration, generated Next declarations, and local launch configuration. The file inventory below records the application coverage.

| Folder | Review focus |
| --- | --- |
| `src/app` and route folders | Seven routes, metadata, fonts, provider nesting, page composition and base styles |
| `src/animation` | GSAP registration, scene lifecycle, matchMedia handling, splitting, reveals, pointer effects and Lenis |
| `src/components` | Navigation, age gate, locking, fallback art, controls, footer, policies and accessibility |
| `src/components/craft` | Scene media, procedural art, disclosure semantics and placement |
| `src/components/landscape` | Deterministic ridge generation, palettes, layered SVG output and ambient animation |
| `src/components/transition` | Link interception, navigation state, wipe timing, recovery and optional terrain |
| `src/content` | Central content types, placeholder expressions, verification flags and hotspot positions |
| `src/sections` | Scene choreography, pinning, layouts, keyboard selection and animation cleanup |
| `src/three` | Bottle geometry/materials, textures, canvas visibility, GLB viewer and terrain |
| `tests` | Production-server setup/cleanup and route assertions |
| `.claude` | Development launch configuration |
| `public/media` | Empty; no final brand media supplied |
| `.next`, `.next-dev` | Generated manifests, server/static output, caches, diagnostics and types inspected structurally |
| `node_modules` | Installed dependency metadata checked; third-party implementation files were not exhaustively audited |

Generated bundles/caches and every third-party dependency file were not individually read. This is a complete application-source review, not an exhaustive audit of generated and vendor code. Root `tsconfig.tsbuildinfo` is compiler cache data, not authored application source.

## Additional follow-up

- Check the collection on short desktop viewports and at browser zoom: the cinematic stage clips overflow at 100svh while its detail panel includes substantial copy, spacing and potentially wrapping CTAs. A height-aware layout or scrollable details may be needed.
- Optional craft videos currently have no supplied media to exercise. When adding them, verify that changing reduced motion actually pauses an already playing video; changing `autoPlay` alone does not implement playback control.
- README's claim that all copy lives in `src/content/site.ts` is broader than the implementation: headings, policy text, gate text and CTA labels also live in components/routes.
- Final imagery, official identity assets, product details, verified claims and approved operator/policy information remain explicitly marked launch dependencies. Indexing is intentionally disabled in root metadata.
- Focused interaction tests should cover the three medium findings, rapid menu interaction, responsive/motion changes, narrow-screen disclosures and GPU initialization/context failure.

## Application file inventory

- `src/animation/gsap.ts`
- `src/animation/index.ts`
- `src/animation/liquid.ts`
- `src/animation/Magnetic.tsx`
- `src/animation/MotionProvider.tsx`
- `src/animation/Parallax.tsx`
- `src/animation/Reveal.tsx`
- `src/animation/SmoothScroll.tsx`
- `src/animation/SplitReveal.tsx`
- `src/animation/useScene.ts`
- `src/app/collection/page.tsx`
- `src/app/craft/page.tsx`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/privacy/page.tsx`
- `src/app/responsible-drinking/page.tsx`
- `src/app/story/page.tsx`
- `src/app/terms/page.tsx`
- `src/components/AgeGate.module.css`
- `src/components/AgeGate.tsx`
- `src/components/BottleSVG.tsx`
- `src/components/Button.module.css`
- `src/components/Button.tsx`
- `src/components/craft/Craft.module.css`
- `src/components/craft/CraftArt.tsx`
- `src/components/craft/Hotspot.tsx`
- `src/components/craft/MediaPlate.tsx`
- `src/components/Cursor.module.css`
- `src/components/Cursor.tsx`
- `src/components/Footer.module.css`
- `src/components/Footer.tsx`
- `src/components/landscape/Landscape.module.css`
- `src/components/landscape/Landscape.tsx`
- `src/components/landscape/palettes.ts`
- `src/components/landscape/ridges.ts`
- `src/components/MountainMark.tsx`
- `src/components/Nav.module.css`
- `src/components/Nav.tsx`
- `src/components/Pending.tsx`
- `src/components/PolicyPage.module.css`
- `src/components/PolicyPage.tsx`
- `src/components/transition/Transition.module.css`
- `src/components/transition/TransitionLink.tsx`
- `src/components/transition/TransitionProvider.tsx`
- `src/components/useScrollLock.ts`
- `src/components/WebGLBoundary.tsx`
- `src/content/site.ts`
- `src/sections/BottleFeature.module.css`
- `src/sections/BottleFeature.tsx`
- `src/sections/Closing.module.css`
- `src/sections/Closing.tsx`
- `src/sections/Collection.module.css`
- `src/sections/Collection.tsx`
- `src/sections/Craft.tsx`
- `src/sections/Hero.module.css`
- `src/sections/Hero.tsx`
- `src/sections/PageIntro.module.css`
- `src/sections/PageIntro.tsx`
- `src/sections/Story.module.css`
- `src/sections/Story.tsx`
- `src/three/Bottle.tsx`
- `src/three/BottleStage.tsx`
- `src/three/labelTexture.ts`
- `src/three/ProductModel.tsx`
- `src/three/profile.ts`
- `src/three/TransitionTerrain.tsx`
