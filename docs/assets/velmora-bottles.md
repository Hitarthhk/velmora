# Approved reference bottle reconstruction

The final directions are the two supplied 2400 × 1792 multi-view sheets, preserved under `.source-assets/approved-bottles`:

- `01.png` came from `Gemini_Generated_Image_vqozh2vqozh2vqoz.png`: straight rectangular decanter, heavy beveled base, engraved shoulder plates, compact decorated neck, rectangular faceted stopper, ivory/black front cartouche, lower back label and starburst sides with a diamond monogram boss.
- `02.png` came from `Gemini_Generated_Image_vqozh2vqozh2vqoz (1).png`: gently waisted body, rounded shoulders, longer decorated neck, jewel-like faceted stopper, shaped black/gold front and back cartouches and flowing acanthus side relief.

The front/back label artwork and decorative material maps are taken directly from these sheets. Native raised geometry supplies the 01 starburst rays, diamond bosses, neck rings and cap scrolls. The 02 side panels combine a reference-derived shallow closed relief mesh with the original acanthus appearance and bump detail. Lower-quality devices use a reduced relief mesh density. No new label copy or branding is invented.

The shoulder and width stations were calibrated from reference pixel rows. Both models retain the original 1.746/2.742 overall heights for compatibility with the existing choreography. Internal edition IDs remain stable. Parent camera, scroll, drag, product switching and transition code are unchanged.

## Regeneration

`node scripts/bake-assets.mjs --review` bakes the material maps and relief data, then renders front, back, both sides and perspective views of the actual models. The sheet is saved to `.source-assets/bottle-review/signature-reserve.png`; front renders update the existing public bottle assets. The `design=approved-reference-v1` query invalidates older fallback images.

`scripts/prepare-approved-bottles.mjs --inspect` additionally produces reference-coordinate inspection sheets. It preserves the reference originals and rebuilds `src/three/bottles/approved-relief-02.json`, so texture and geometry preparation remains reproducible.

These are reference-based real-time reconstructions, not a dimensional scan or original manufacturer CAD. The visible source details are retained; unseen geometry is modeled consistently with the supplied front/back/side views.
