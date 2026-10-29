# Project review

## Implementation follow-up — 27 October 2026

The source findings below have now been addressed in code:

- Upgraded to Next.js 16.4.3 and React/React DOM 19.3.1; regenerated the lockfile. The install audit reported zero known vulnerabilities. The current official security release is documented at https://nextjs.org/blog/nextjs-security-update-october-14-2026.
- Development and production now use separate output folders. Production builds pass compilation, type checking and prerendering of all seven application routes after the upgrade/configuration changes; the earlier missing-page failures have not recurred. Their exact original cause was not established.
- The menu uses a native modal dialog, a shared native/Lenis scroll lock, focus restoration and cancellation of both opening and closing animations. Reduced motion uses an immediate menu reveal.
- Craft masks restore their original styles on animation teardown. Collection selection timelines revert their detail styles before rebuilding.
- Hotspot disclosures are positioned within the full scene and use an inset bottom panel on mobile, with scrollable overflow.
- WebGL capability detection requires WebGL2. Renderer/model failures have SVG fallbacks; bottle fallback rebuilds its scroll choreography. Optional collection viewers are mounted only while visible on capable desktops, clone shared model scenes and fit their bounds.
- Footer and age-gate policy links work. Three preview notices are accessible before age confirmation. They are explicitly provisional and do not claim to be approved launch policies.
- The closing section now references an existing heading ID.
- Route transitions gain a lazily loaded Three.js/R3F/Drei terrain camera move on capable desktops. The Canvas exists only during navigation. SVG/fade fallbacks cover unsupported devices and reduced motion. A timeout recovers interrupted navigation, and query-only/new-tab links retain native behavior.

Validation: production builds pass, TypeScript passes, and all eight production HTTP smoke tests pass (seven routes plus 404 handling). The browser tool could not initialize because of an environment connection error; visual/GPU rendering, rapid menu interaction, preference changes and mobile focus/scroll behavior still require interactive verification. No interactive success is claimed by the HTTP tests.

Real brand imagery, final product specifications, verification of brand claims, approved policy wording/operator details and market-specific age requirements cannot be supplied from the files in this workspace. Those remain launch dependencies, visibly marked in the site. Search indexing remains disabled.

## Historical findings from the review

Reviewed again on 27 October 2026. Application source was not changed. The earlier findings were checked against the current files; an additional collection-animation cleanup defect is recorded below.

## Scope and validation

Read all 59 files under `src`, the README, root configuration files, generated Next type declarations, and `.claude/launch.json`. Checked the lockfile's root dependency agreement and resolution/integrity metadata for all 126 package entries. Inspected the generated `.next` structure and dependency directory at the package level; generated bundles, caches, and third-party dependency source were not individually audited. `public/media` is empty. This workspace has no Git repository.

On 27 October, two fresh `npm.cmd run build` attempts passed compilation and type checking but failed during page-data collection. The first reported `PageNotFoundError: Cannot find module for page: /story`; the retry reported an unhandled `PageNotFoundError` for `/_document`. The generated `/story` server file existed after the first failure. The cause is unresolved; the changing missing-page errors do not establish a source-routing defect. A successful production build is therefore **not verified in this review**. The earlier review recorded a successful build, but that result does not describe the current validation runs.

There is no configured lint command, test command, test suite, or CI configuration. The build's lint/type-check stage does not establish that an ESLint ruleset exists. `npm.cmd ls --depth=0` confirms the installed direct dependencies agree with the manifest. All 126 lockfile entries were parsed; package entries have resolution/integrity metadata and use the npm registry, and direct versions agree with the manifest. This metadata check is not a full transitive vulnerability audit.

Findings below come from source inspection and the production build, not interactive browser reproduction. Security applicability depends on deployment: a running Next server differs from a deployment serving only exported static files.

## Findings, ordered by priority

### 1. High: vulnerable Next.js version must be upgraded before server deployment

Location: `package.json:16`, also pinned in `package-lock.json`.

The application uses the App Router with Next.js 15.5.4. This predates the fix for CVE-2025-66478, the downstream React Server Components remote-code-execution issue. The official advisory identifies 15.5.7 as the initial fix in this release line; that historical fix is not a recommendation to stop at that version, because further security updates followed. Upgrade to a currently patched supported Next release and compatible React/React DOM versions, regenerate the lockfile, and repeat the build and route checks.

Prerendering every route does not by itself make a deployment using `next start` a static-only deployment. No exploitation was attempted.

Sources: https://nextjs.org/blog/CVE-2025-66478 and https://react.dev/blog/2025/12/11/denial-of-service-and-source-code-exposure-in-react-server-components

### 2. Medium: opening the menu can race an unfinished closing animation

Location: `src/components/Nav.tsx:59-69`.

The closed branch starts a GSAP tween without returning cleanup. If the menu opens while that tween is running, its old completion callback still sets the menu to `display: none`. This can happen during initial load or when closing and quickly reopening the menu. `open` and `aria-expanded` can remain true while the menu disappears. Capture and kill/revert the closing tween on effect cleanup; use one scoped animation lifecycle for both branches.

### 3. Medium: the full-screen menu does not lock native scrolling or contain focus

Location: `src/components/Nav.tsx:40-69` and the rendered menu.

Opening the menu only stops Lenis. Lenis is absent on touch devices and for reduced-motion users, so those users can scroll the underlying page while the full-screen menu is open. Background links and collection/hotspot controls also remain focusable. Escape closes the menu without restoring focus to the toggle, leaving focus in an inert, subsequently hidden element.

Use a shared scroll-lock mechanism that handles native scrolling, contain keyboard focus within the menu and its close control, make background content inert while open, and restore focus to the toggle after dismissal. Coordinate this with the existing age-gate lock.

### 4. Medium: craft reveal masks survive animation teardown

Location: `src/sections/Craft.tsx:25-44`, `72-73`, and `91`.

Craft masks are assigned directly through `scene.style.clipPath`. GSAP context teardown cannot automatically restore these direct writes. If a visitor enables reduced motion after the animated setup, the new setup immediately returns, leaving the previous partial or fully hidden mask in place. Resizing between mobile and desktop can also retain masks on scenes whose new setup does not initialize them, particularly the first desktop scene.

Restore every scene's original inline clip path in cleanup for both animation branches, or manage the actual style through GSAP so context reversion restores it. Check preference changes and breakpoint changes at several scroll positions.

### 5. Medium: mobile craft disclosures can be clipped outside the viewport

Location: `src/components/craft/Craft.module.css:131-136`, `168-173`; `src/content/site.ts` craft hotspot coordinates.

On mobile, disclosure panels are centered on their hotspot and are up to 70vw wide. The water hotspot sits at 72% horizontal position: at 375 px viewport width, its panel extends to approximately 401 px. The containing scene clips overflow, so the right side of the content is inaccessible. Similar clipping can occur on narrow desktop layouts because desktop panels always open to the right.

Clamp disclosures to viewport edges, select their opening direction based on available room, or use a fixed inset panel on small screens.

### 6. Medium: WebGL capability detection accepts an unsupported fallback

Location: `src/animation/MotionProvider.tsx:19`; `src/sections/BottleFeature.tsx:24`.

Detection returns true when WebGL1 works even if WebGL2 does not. The installed Three.js r180 renderer requires WebGL2; its source explicitly rejects WebGL1 contexts. Such devices enter the 3D branch instead of receiving the existing SVG fallback. Check specifically for WebGL2 and handle renderer initialization failure with an error boundary/fallback as well.

### 7. Medium: changing motion preference can leave collection details hidden

Location: `src/sections/Collection.tsx:70-80`.

The selection effect uses `from` tweens to put `[data-detail]` elements at `autoAlpha: 0` and an offset. Its cleanup calls `tl.kill()`, which stops the animation without restoring those elements' inline styles; only the split heading is reverted. If reduced motion is enabled before the reveal finishes, the replacement effect returns before restoring the details. Product notes, specifications, and CTAs can remain hidden or partly transparent indefinitely. Rapid selection changes can also capture an interrupted opacity as the next reveal's destination.

Use a GSAP context with reversion for the entire selection animation, or revert the timeline rather than only killing it. Explicitly ensure the reduced-motion branch leaves every detail visible. Validate by toggling the preference during the first 150 ms after selection and by selecting several cards quickly. This finding is based on source inspection; it was not reproduced interactively.

### 8. Low: legal footer destinations are placeholders

Location: `src/components/Footer.tsx:30-32`; `src/components/AgeGate.tsx:113-116`.

Terms, Privacy, and Responsible Drinking all link to `#`. The gate says entry accepts Terms and Privacy Policy, but provides no working policy destinations. This is a concrete content/navigation gap for launch. Supply approved policy pages and link them from both the footer and gate.

### 9. Low: closing section references a missing accessible label

Location: `src/sections/Closing.tsx:24`.

The section uses `aria-labelledby="closing-title"`, but no element receives that ID. Add it to the rendered heading by extending `SplitReveal` to accept an ID, or use another valid accessible label.

### 10. Future integration risk: collection GLBs bypass device fallbacks

Location: `src/sections/Collection.tsx` Card component; `src/three/ProductModel.tsx:23-31`.

Currently no expression supplies a model, so this is dormant. Once a GLB is configured, each matching card unconditionally mounts a continuously rendered Canvas and auto-rotates, including for reduced-motion users and devices without WebGL2. It also lacks an error boundary for failed model loads. Reuse the bottle's capability policy, stop off-screen rendering, disable automatic rotation for reduced motion, and retain the SVG fallback.

## File and folder coverage

| Folder | Files reviewed | Assessment |
| --- | --- | --- |
| `src/app` | `layout.tsx`, `page.tsx`, `globals.css`, `story/page.tsx`, `craft/page.tsx`, `collection/page.tsx` | Four static routes, shared providers, fonts, metadata, base styles; concept deliberately has noindex metadata. |
| `src/animation` | `gsap.ts`, `index.ts`, `liquid.ts`, `Magnetic.tsx`, `MotionProvider.tsx`, `Parallax.tsx`, `Reveal.tsx`, `SmoothScroll.tsx`, `SplitReveal.tsx`, `useScene.ts` | Shared animation setup, media conditions, cleanup, text reveals, pointer and scroll effects. WebGL detection finding above. |
| `src/components` | `AgeGate.tsx`, `AgeGate.module.css`, `BottleSVG.tsx`, `Button.tsx`, `Button.module.css`, `Cursor.tsx`, `Cursor.module.css`, `Footer.tsx`, `Footer.module.css`, `MountainMark.tsx`, `Nav.tsx`, `Nav.module.css`, `Pending.tsx` | Gate, navigation, buttons, cursor, SVG product fallback, claim labeling, footer. Menu and policy findings above. |
| `src/components/craft` | `Craft.module.css`, `CraftArt.tsx`, `Hotspot.tsx`, `MediaPlate.tsx` | Static SVG art, optional supplied media, disclosure state and placement. Clipping finding above. |
| `src/components/landscape` | `Landscape.module.css`, `Landscape.tsx`, `palettes.ts`, `ridges.ts` | Deterministic procedural ridges, reusable palettes, ambient clouds/fog. No additional concrete defect identified. |
| `src/components/transition` | `Transition.module.css`, `TransitionLink.tsx`, `TransitionProvider.tsx` | Route wipe and click interception. Only pathname changes finish navigation; query-only routes or navigation failures would need recovery if introduced. Current route links use distinct paths. |
| `src/content` | `site.ts` | Central content, claim flags, hotspot positions, placeholder expressions and specifications. Some visible copy also remains hardcoded in sections/components despite the README's centralization claim. |
| `src/sections` | `BottleFeature.tsx`, `BottleFeature.module.css`, `Closing.tsx`, `Closing.module.css`, `Collection.tsx`, `Collection.module.css`, `Craft.tsx`, `Hero.tsx`, `Hero.module.css`, `PageIntro.tsx`, `PageIntro.module.css`, `Story.tsx`, `Story.module.css` | Desktop pins, mobile layouts, section copy, selection, intro timing. Craft and collection cleanup and closing-label findings above. |
| `src/three` | `Bottle.tsx`, `BottleStage.tsx`, `labelTexture.ts`, `ProductModel.tsx`, `profile.ts` | Bottle geometry, materials, lighting, render visibility, texture lifecycle, optional GLB viewer. Future viewer fallback/performance issue above. |
| Project root | `.gitignore`, `package.json`, `package-lock.json`, `next.config.mjs`, `tsconfig.json`, `README.md`, `next-env.d.ts`, `tsconfig.tsbuildinfo` | Source/configuration read; lock metadata checked; generated type/build metadata recognized. Strict TypeScript enabled. No test/lint scripts or repository history. |
| `.claude` | `launch.json` | Local development launch configuration only. |
| `public/media` | Empty | No photographs, videos, product models, or other production brand assets supplied. |
| `.next` | Build output, types, static assets, server output, manifests, cache | Generated output inspected structurally; both current build attempts stopped at page-data collection. Generated bundles and caches were not individually source-reviewed. |
| `node_modules` | Installed dependencies | Package metadata checked; Three.js renderer source consulted for the WebGL2 finding. Third-party files were not exhaustively audited. |

## Remaining validation

Resolve the page-data collection failure and obtain a successful production build. After fixes, run focused interaction checks for rapid menu open/close, touch scrolling while the menu is open, Escape/focus restoration, switching reduced motion during craft and collection reveals, rapid collection selection, resizing at different scroll positions, narrow-screen disclosure placement, and WebGL2 initialization failure. Production brand assets, product details, policy pages, and approval of factual claims remain explicit concept-to-launch work.
