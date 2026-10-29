# Our Story: imagery and editorial review

Page: `/story`. Sections are in `src/sections/story/`. Copy and image metadata are in `src/content/site.ts` (`ourStory`, `storyPhotos`).

## Structure

One continuous film: a sticky "screen" sits behind the whole page and each chapter renders its imagery into it (`film.tsx`). A chapter's scene dissolves in over the previous one as its section rises. Everything is scrubbed by scroll, so it plays backwards exactly. There are no GSAP pins; text holds in sticky stages.

| Scene | Scroll (desktop / phone) | Transition in |
| --- | --- | --- |
| Opening: *Rooted in Solan* | 170 / 150 vh | First light over the Solan hills; a chapter index links to I–V |
| I · The Valley | 210 / 190 vh | The opening's valley mist lifts; the camera draws back over the Shivaliks |
| II · The Beginning | 300 / 270 vh | The valley light sinks; a gold seam opens on a dark stone interior; the second statement warms to oak |
| III · The Landscape | 340 / 300 vh | Warm dusk ridges; then cloud, forest and snow, one per word of the heading, graded warm for summer and cold for winter nights |
| IV · The Emblem | 220 vh + explorer | Wild monal → rhododendron → dark forest, then the interactive emblem |
| V · The Philosophy | 400 / 340 vh | The emblem's gold glow gives way to sunset (Place), copper (Craft), casks (Patience) and the emblem (Identity) |
| Closing: *Some places cannot be hurried.* | 165 / 150 vh | Last light through deodars; night falls into the footer |

The emblem explorer: hovering previews a part, clicking or tapping selects it, and the list buttons are fully keyboard operable. The selected part is lit on the **original artwork**, using masked copies of the same image; nothing is redrawn. A reference photograph from nature accompanies the Flower, Twin Monals and Crossed Tails.

## Imagery

Regional photographs are from Wikimedia Commons, used under the licences below, and resized or cropped for the web (adaptations of CC BY-SA images remain CC BY-SA). Credits are shown on the page under **Photography** in the closing scene.

| File (`public/media/story/`) | Subject | Author | Licence |
| --- | --- | --- | --- |
| `opening-solan-hills` | The hills around Solan | Mayankgupta954 | CC BY-SA 4.0 |
| `valley-shivaliks` | The Shivaliks rising toward the Himalaya | Timothy A. Gonsalves | CC BY-SA 4.0 ⚠ |
| `landscape-ridge` | Ridges of the Shivalik range at dusk | Donvikro | CC BY-SA 4.0 |
| `landscape-cloud` | Deodar forest in monsoon cloud, Shimla | RayAdvait | CC BY 4.0 |
| `landscape-forest` | Deodar forest, Himachal Pradesh | BhotaRohit | CC0 |
| `landscape-snow` | Churdhar peak from Thundal, Himachal Pradesh | Jagriti Zinta | CC BY-SA 4.0 |
| `emblem-monal` | A male Himalayan monal in the forest | Mike Prince | CC BY 2.0 |
| `emblem-crest` | The monal's raised crest | H005 | Public domain |
| `emblem-rhododendron` | *Rhododendron arboreum* in Seraj, Himachal Pradesh | The Nilgiris Raju L | CC BY-SA 4.0 |
| `philosophy-place` | Sunset over the hills of Himachal Pradesh | Aaryan Singh | CC BY-SA 4.0 |
| `philosophy-craft` | Copper pot stills (**conceptual**) | Thechadwix | CC BY-SA 4.0 |
| `philosophy-patience` | Casks at rest (**conceptual**) | sebastian.b. | CC BY 2.0 |
| `closing-twilight` | Twilight through deodars in the Himalaya | Poojilsharma07 | CC0 |

Source pages are linked from `storyPhotos` in `site.ts`.

- **⚠ Before launch:** Timothy A. Gonsalves's description asks to be contacted before commercial use. The licence permits it, but contact him or replace `valley-shivaliks`.
- The copper-still and cask photographs are of other distilleries. They were cropped to exclude every name, maker's plate and cask marking, and are labelled conceptual. They do not show the Gamber Valley distillery. Replace them with the distillery's own photography when available.
- The stone and oak interiors of Chapter II are the project's existing generated plates (`collection-midnight-vault`, `collection-golden-heritage`), used illustratively.
- No photograph of the Gambhar/Gamber river was available, and no other river is presented as it.
- No executive portraits are used.

## For editorial review

Supplied copy is used as written. The following should be confirmed before launch:

1. **River and site:** "The distillery stands on the banks of the River Gamber." The river is commonly spelled *Gambhar* (a Sutlej tributary in Solan district). Confirm the spelling and the site; company material places Gamber Valley at Kandla, District Solan.
2. **Climate:** summer days of 20–33°C and winter nights of 0–5°C in Solan; check against IMD normals.
3. **Ingredients:** six-row barley from Rajasthan and Haryana, two-row from abroad, and mountain water. These are production claims.
4. **Production and availability:** "distilled, matured and bottled in one place"; "released in a small number of states, with others to follow in phases."
5. **Leadership:** names, titles and approval to publish both quotations: Romesh Pandita (Chairman & Managing Director) and Ashutosh Rajput (Chief Operating Officer), Alcobrew Distilleries India.
6. **Emblem copy:** *Crossed Tails* and *The Wordmark* had no existing text. Neutral, descriptive drafts are shown with the visible **Pending verification** tag until approved. *The Flower* uses the previously approved line identifying it as the rhododendron.
7. **Wordmark:** the brief describes a "Gamber Valley Indian Single Malt Whisky wordmark". The supplied emblem (`/media/brand/gamber-valley-emblem.webp`; the brief's `assets/brand/gamber-valley-logo.webp` does not exist) contains only the "Gamber Valley" lettering and "20 02". The original PNG's line beneath reads "That time is almost here".
8. **Closing CTAs:** "Discover Our Whisky" is kept. "Read Our Story" linked to this same page, so it is now "Explore Our Craft".
