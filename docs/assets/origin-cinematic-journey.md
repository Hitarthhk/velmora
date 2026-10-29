# Homepage Our Origin: imagery, research and prompts

## Scope

Homepage only: `src/sections/Origin.tsx`. The separate Our Story page and shared legacy Story component remain unchanged. Chapter order and supplied copy are retained: The Foothills, The Emblem, The Philosophy. The existing 300% desktop pin is retained; mobile and reduced motion use native chapter scrolling.

## Authenticity and missing supplied photography

The repository contains the original Gamber Valley emblem and bottle references, but no verified local Solan/Gambhar landscape photographs or photographs of the actual Gamber Valley distillery, equipment or maturation rooms. Those remain the preferred replacement assets when supplied with usage rights. Newly generated environments are visibly labelled **Conceptual scenery & craftsmanship**. They are not documentary evidence of a location, wildlife sighting, facility, cask type, age or production technique. The copper-and-oak image is conceptual craftsmanship styling.

The supplied brand copy identifies Solan and the Himalayan monal/rhododendron inspiration; it is preserved without adding claims. Primary company material consulted:

- [Alcobrew's Gamber Valley location notice](https://www.linkedin.com/posts/alcobrew-distilleries-india-ltd_alcobrew-hiring-golfersshot-activity-7325139296498188288--TbK): places Gamber Valley in Kandla, District Solan, Himachal Pradesh.
- [Alcobrew's Gamber Valley announcement](https://www.linkedin.com/posts/alcobrew-distilleries-india-ltd_alcobrew-gambervalley-indiansinglemalt-activity-7466069591992000513-r_2J): Himalayan inspiration and patience-led philosophy.

No founder history, production specifications, dates, equipment details or maturation assertions have been added. No full-resolution third-party photography was reused.

## Saved assets — built-in imagegen

### Validation

- Production build, TypeScript and all 30 route/lifecycle/readiness tests passed.
- Real Chrome component previews passed at 1440×900, 1901×867, 1024×768, 1366×600, 834×1112, 375×812 and 844×390, plus reduced motion at 1440×900. The isolated fixture mounts the actual Hero, Bottle Showcase, Collection, Origin and Contact components; it does not mount or submit age verification. Origin review uses the built, self-hosted project fonts.
- Checked three chapter indicators, image decoding, original emblem, heading visibility, horizontal overflow, existing 300% desktop pin, native mobile/reduced flow, reverse scrolling, pausing between scenes, and the Contact exit. Screenshots were reviewed; the short landscape layout was refined and rerun.
- Existing collection selection/handoff desktop preview and hero-to-bottle handoff checks on desktop, small desktop, tablet, mobile and reduced motion passed.
- Separate Our Story page, Story component/styles, BottleFeature and Collection source hashes match the pre-change audit.

All scenery was generated using the built-in imagegen tool, then encoded as WebP using sharp. Mobile derivatives reduce download size; scene-specific CSS framing keeps the focal scenery visible. The emblem remains `public/media/brand/gamber-valley-emblem.webp` without alteration.

- `public/media/photography/origin-foothills.webp` — 1672 × 941
- `public/media/photography/origin-foothills-mobile.webp` — 1000 × 563
- `public/media/photography/origin-emblem-forest.webp` — 1672 × 941
- `public/media/photography/origin-emblem-forest-mobile.webp` — 1000 × 563
- `public/media/photography/origin-philosophy.webp` — 1672 × 941
- `public/media/photography/origin-philosophy-mobile.webp` — 1000 × 563
- `public/media/photography/origin-foreground.webp` — 1100 × 619, transparent alpha

## Foothills prompt

A premium cinematic documentary-style PHOTOGRAPH, landscape 16:9, conceptual Himalayan Shivalik foothill valley inspired by the Solan district of Himachal Pradesh. Intimate lower mountain landscape, rounded forested ridgelines with natural chir-pine covered slopes, mixed woodland and quiet deep green river valley, a modest silver-green winding river glimpsed far below in the right-center distance. No snowy peaks, no alpine glacier, no famous landmarks, no dramatic sunset, no temples or villages or buildings, no roads or tourist vista. Cool blue-green morning air, wisps of real translucent low mist between overlapping ridges, soft warm sunlight breaking naturally through high cloud from upper right onto selected green hills. Several layers of true geographical depth, believable irregular Indian foothill geology and vegetation, rich natural shadows, no artificial glow. Framing: left 40 percent a quiet shaded near woodland slope with dark subtle texture, suitable for large ivory editorial text; right 60 percent opens into a breathtaking but grounded river valley. Modest close pine bough and fern details only at far lower right edge, not across the center, and no obscuring the valley. Eye-level elevated view from forest edge, 50mm documentary realism with atmospheric depth, premium restrained natural grading, exquisitely detailed credible photographic landscape. No text, no logo, no border, no people, no whisky bottles. Entire scene conceptual; do not imitate an identifiable photographed location.

## Emblem forest prompt

A premium cinematic nature-documentary PHOTOGRAPH, landscape 16:9. Conceptual Himalayan forest symbolism environment for an Indian whisky brand, Nature Becomes Identity. Move close to a quiet temperate Himalayan woodland floor: ancient moss-covered stone, soft deep green foliage, delicate clusters of pink rhododendron blossoms high at the extreme right, dappled warm natural light filtered through a forest canopy, cool green atmospheric depth behind it. One anatomically accurate male Himalayan monal stands quietly on a mossy stone in the lower RIGHT at around 84 percent width, modest documentary wildlife scale (about 18 percent frame height), iridescent green crest and head, copper back, deep purple-blue body, white rump and chestnut tail, realistic pheasant anatomy, wings folded, NOT flying. No golden bird, no logo, no emblem, no typography, no invented cultural motifs, no temple, no equipment, no people, no bottle. Left 42 percent quiet shaded, naturally textured forest background for large ivory editorial text; center-right around 63 percent width and 42 percent height a dark calm negative-space opening for a separate ORIGINAL golden emblem to be composited later. Bird and blossoms frame the far right edges and do not occupy that emblem opening. Intimate, contemplative, layered photographic nature; not another mountain panorama; no snow, no artificial glow, no particles. Distinct from an expansive river valley, original cinematic conceptual woodland composition, true natural photographic detail, restrained documentary colour grade, widescreen 16:9.

## Philosophy prompt

Premium cinematic editorial PHOTOGRAPH, landscape 16:9, conceptual whisky craftsmanship materials called The Patience Behind the Spirit. Not a photograph of any real named distillery. Intimate close perspective in a quiet unbranded workshop-like material setting: the rounded edge of a single weathered oak whisky cask with dark iron hoops at far RIGHT, rich tactile oak stave end grain, a softly curved burnished copper surface receding in right-center behind it, no identifiable still equipment diagram or complete distillation machine. Warm natural late afternoon light from outside the upper right frame grazes wood and copper, gentle atmospheric depth, deep elegant shadows, tiny reflected amber notes, no glow, no dust particles, no fire. Left 42 percent quietly shaded brown-charcoal negative space for large ivory editorial text; right 58 percent shows the close oak and copper textures. Natural floor planes, layered craftsmanship material photography with restrained light, calm and patient, premium documentary feel, completely different from a forest or mountain view. No landscape, no mountains, no botanicals, no birds, no bottle, no glassware, no branding, no dates, no lettering or production specifications, no people. No implication of a particular cask type or age, no visible barrel markings. Widescreen 16:9 photorealistic environment, real tangible materials with quiet warm directional lighting.

## Foreground prompt

Photorealistic foreground foliage CUTOUT with a fully transparent alpha background. One sparse, naturally curved, dark green Himalayan chir-pine bough and a few slender fern fronds along the LOWER RIGHT edge only, entering from the right side of frame. Most of image empty and genuinely transparent. Nothing in the top or left two thirds, no frame or border. Camera at a forest edge, natural soft side light, deep pine-green shadows, subtle real needle texture, no white outline, no artificial glow, no ground, no rock, no hills, no landscape, no sky, no text, no birds. Elegant restrained foreground layer for subtle parallax over conceptual Solan foothill photography; plant should occupy the bottom-right quarter of a wide 16:9 transparent canvas, with organic feathered leafy edges. Not a decorative wreath, not a full plant portrait. Keep small open gaps between needles and fronds so the valley will remain visible beneath.

## Animation ownership and loading

The existing GSAP/useScene engine owns chapter pinning and text reveals. A normalized driver inside the same scrubbed timeline publishes a Motion value, keeping photographic dissolves and typography synchronized in both directions. Motion owns photo transforms, opacity, independent foreground/mist and emblem presentation. No new WebGL canvas or continuous ambient loop is used. An IntersectionObserver prepares images shortly before Origin enters the viewport; initial hero requests retain priority. Reduced motion disables camera travel and foreground transforms while retaining readable native chapter flow and photographic dissolves.
