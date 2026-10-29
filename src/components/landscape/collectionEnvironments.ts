import type { ExpressionId } from "@/content/site";

/** Art direction only. These environments imply no ingredient, cask or age claim. */
export const COLLECTION_ENVIRONMENTS = {
  "private-edition-i": {
    name: "The Aromatic Highlands", src: "/media/photography/collection-aromatic-highlands.webp",
    key: "#ffe1a6", rim: "#b29d9e", fill: "#cc8b48", backdrop: "#25170f",
  },
  "the-vault-series": {
    name: "The Golden Whisper", src: "/media/photography/collection-golden-whisper.webp",
    key: "#fff0cf", rim: "#d9c9ae", fill: "#d9ac6e", backdrop: "#241e19",
  },
} satisfies Record<ExpressionId, { name: string; src: string; key: string; rim: string; fill: string; backdrop: string }>;
