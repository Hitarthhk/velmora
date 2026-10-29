# Contact: The Last Light of the Valley

Homepage only: `src/sections/Contact.tsx` (`scene="twilight"`). The closing scene of the homepage film: The Philosophy's copper light dissolves into this plate, the invitation rises over it, and night fades into the footer.

## Status: interim plate

No dedicated twilight photograph exists in the project, and none could be generated in the implementation session. The scene currently uses the **age-gate twilight photograph** (`public/media/photography/age-gate-himalaya.webp`), mirrored and recomposed. It already matches the brief's mood: deep blue sky, last warm light on the horizon, a cloud sea and forest silhouettes. But it shows the same range and viewpoint as the hero sunrise, and the brief requires Contact to be visibly different from the Hero. **It must be replaced before launch.**

To replace it, add the two files below, then in `TWILIGHT` (`src/sections/Contact.tsx`) set `src` and `mobile` to the new paths, update `width`/`height`, and set `mirrored: false`. No other code changes are needed.

- Desktop: `public/media/photography/contact-twilight.webp` (about 1672 × 941, under ~250 KB)
- Mobile: `public/media/photography/contact-twilight-mobile.webp` (portrait-friendly crop, about 880 × 1100, under ~150 KB)

## Generation prompt

Use case: photorealistic-natural. Asset type: cinematic website environment plate, landscape 16:9, high resolution. Create a vast Himalayan foothill valley at civil twilight, seen from a forested ridge looking down a long valley — a different viewpoint and range from a summit sunrise panorama. Layered blue-grey mountain ridges recede into the distance; a low, distant snow range sits on the far horizon, small in frame. The sky is deep blue overhead, grading to a thin band of fading warm gold and soft rose just above the far horizon on the left third, as if the sun set moments ago. Soft valley mist lies in the folds between ridges in the middle distance. Dark conifer and deodar silhouettes frame the lower corners. Natural evening shadows, believable exposure, restrained colour. The central area from 30% to 70% width and 30% to 65% height must be calm, low-detail sky and mist: negative space for a centred serif heading and buttons. The bottom 20% should fall into near-black forest so it can blend into a dark footer. No stars, no moon, no people, no buildings, no roads, no lights, no text, no logo, no bottle, no lens flare, no sun disk, no artificial glow, no illustration, no vector mountains. Underexpose slightly. Premium cinematic mountain documentary still.

### Mobile crop

Same scene, recomposed for a tall frame: the warm horizon band at about 30–40% height, mist below it, forest silhouettes in the lowest third, and calm sky in the centre for stacked text.

## Authenticity

Illustrative environment only. It is not presented as a photograph of a specific Gamber Valley location. The section keeps no claims beyond the existing supplied copy.

## Integration

- **Desktop.** Contact pins under Our Origin's last 70vh of scroll (`src/components/transition/originJourney.ts`). Its sticky backdrop starts warm (a copper overlay carried over from The Philosophy) and pulled in (scale 1.16), then cools to twilight and pulls back to 1.02 while the craft scene fades above it. The invitation then rises in stages.
- **Dusk.** As the copy leaves, a darkness overlay deepens towards the footer's colour (`#07100c`), and a permanent floor gradient makes the backdrop's lower edge identical to the footer. On this page the footer's top border is hidden.
- **Ambient motion.** A slow horizon breath (22s) and mist drift (70s), using transform and opacity only. Both are disabled with reduced motion; the mist drift is also off on phones.
- **Phones and reduced motion.** Native scroll with no overlap. The section rises out of a night-blue feather that matches the one The Philosophy sinks into.
