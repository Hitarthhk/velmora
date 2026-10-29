# Whisky website

A cinematic single malt whisky presentation with Himalayan scenery and the supplied Velmora identity. The full gold wordmark appears in the header, menu, age gate, footer and on both bottle labels; the standalone symbol appears in transitions and browser icons. Bottle designs and tasting profiles remain illustrative; mountain imagery does not imply product provenance. Asset preparation: `docs/assets/velmora.md`.

The existing design, typography, scroll choreography, 3D stages, product selection, drag controls, liquid page transitions, age gate and ambient sound remain in place. The former identity explorer now explores Himalayan nature through the same selection and hover controls.

## Development

```sh
npm install
npm run dev
npm run build
npm start
npm run typecheck
npm test
```

Run a production build before the route tests. Development uses `.next-dev`; production uses `.next`.

## Files and routes

- `src/app`: homepage, five-chapter `/story`, the existing coming-soon `/craft`, `/whisky` and `/contact` pages, and three policy routes. `/collection` redirects to `/whisky`.
- `src/content/site.ts`: neutral editorial copy, illustrative profiles and photo/audio credits.
- `src/three/bottles`: the approved reference-based 01 and 02 decanters, with hollow crystal shells, ornate caps/necks, back labels and edition-specific side relief. Internal expression IDs stay stable for the existing animation mappings. Construction notes: `docs/assets/velmora-bottles.md`.
- `src/components`, `src/sections`, `src/animation`: existing interface and motion system.
- `public/media`: scenery, sound, replacement bottle renders and Velmora label textures.
- `docs/assets`: original scene briefs and photography/audio licensing records. Earlier review reports are historical.

## Bottle assets

```sh
node scripts/prepare-velmora.mjs
node scripts/bake-assets.mjs
```

Prepares the supplied identity, embeds it into both label textures and renders the actual 3D models as matching transparent WebP fallbacks. Requires local Chrome; no website routes or age-verification flow are mounted during rendering. `scripts/render-bottles.mjs` can also render existing textures independently. If render dimensions change, update the image dimensions in `site.ts`.

Retired identity artwork and the original favicon are preserved in `.source-assets/previous-identity`, outside Next.js public assets and application routes. They are not served by the website.

## Validation and launch

`npm test` covers routes, absence of retired identity, replacement asset delivery, age-gate animation recovery, motion notifications, bottle readiness, liquid containment and label placement. Browser preview commands in `package.json` exercise the isolated choreography without submitting age verification. `node scripts/render-bottles.mjs --review` produces a multi-angle render sheet under `.source-assets/bottle-review`.

The enquiry form component retains its optional `NEXT_PUBLIC_ENQUIRY_ENDPOINT` integration; the contact route remains the existing coming-soon page. Search indexing is disabled and policy pages remain preview notices pending final operator information.
