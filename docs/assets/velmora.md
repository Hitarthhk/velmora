# Velmora identity

The user supplied the gold V/mountain/river emblem above the VELMORA wordmark and a separate V/mountain/ribbon symbol for the favicon. Those two supplied designs replace the earlier generated amber emblem.

Transparent cutouts were prepared with the built-in image-generation tool: remove only the dark/checkerboard backgrounds, retain the supplied letterforms, gold shading, layout and symbol, and do not introduce other graphics. The prepared masters are preserved under `.source-assets/velmora`.

`node scripts/prepare-velmora.mjs` creates optimized wordmark and symbol assets under `public/media/identity`, plus `src/app/icon.png` and `src/app/apple-icon.png`. The wide wordmark uses the existing header/menu/footer/age-gate placements. The standalone symbol uses the existing transition placement.

The website wordmark/symbol above remain unchanged. The final approved multi-view bottle sheets subsequently superseded the earlier bottle direction. `node scripts/bake-assets.mjs` now extracts their label and ornament maps and renders the actual 3D models as `public/media/bottles/velmora-malt-01.webp` and `velmora-malt-02.webp`. Their geometry, source mapping and reconstruction workflow are documented in `velmora-bottles.md`; camera choreography and drag handling remain unchanged.
