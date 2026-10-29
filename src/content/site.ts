/** Neutral editorial content. Bottle designs and tasting notes are illustrative. */
export type Claim = { text: string; verified: boolean };
export const brand = {
  category: "Single Malt Whisky",
  origin: "Himalayan landscapes",
  originShort: "The Himalayan foothills",
  philosophy: ["Patience", "Craftsmanship", "Character"],
  responsibility: "Enjoy responsibly. For adults of legal drinking age only.",
};


export const hero = {
  eyebrow: "Single Malt Whisky · A Himalayan Journey",
  headline: ["Shaped by Time.", "Defined by Craft."] as const,
  sub: "An exploration of single malt whisky, framed by the quiet grandeur of the Himalayas.",
};
export type Chapter = { numeral: string; title: string; body: Claim };
export type ChapterSet = { intro: string; chapters: Chapter[] };
export const origin: ChapterSet = {
  intro: "The Inspiration",
  chapters: [
    { numeral: "I", title: "The Foothills", body: { text: "Himalayan ridgelines, pine forests and shifting mountain light offer a setting for a slower appreciation of whisky.", verified: true } },
    { numeral: "II", title: "The Natural World", body: { text: "Rhododendron, forest birds and deodar pines reveal the colour and texture of the mountains, a quiet counterpoint to the warmth of amber spirit.", verified: true } },
    { numeral: "III", title: "The Philosophy", body: { text: "Grain, copper, oak and time. Single malt invites attention to the small decisions that shape its character.", verified: true } },
  ],
};
export type StoryHeading = { numeral: string; label: string; lead: string; emphasis: string };
export type Quote = { text: string; name: string; role: string };
export type EmblemPartId = "flower" | "monals" | "tails" | "wordmark";
export type EmblemRegion = { cx: number; cy: number; rx: number; ry: number };
export type EmblemPart = { id: EmblemPartId; index: string; title: string; body: Claim; regions: EmblemRegion[] };
export type Principle = { index: string; title: string; body: string };
export const ourStory = {
  opening: { eyebrow: "Our Story", title: "A Slower Perspective", lede: "A journey through mountain landscapes and the patient craft of single malt. A setting for discovery, rather than a claim of provenance." },
  valley: {
    heading: { numeral: "I", label: "The Valley", lead: "Among the", emphasis: "Himalayan foothills." } satisfies StoryHeading,
    body: ["Pine-covered ridges rise above the plains. Light moves across the slopes, revealing a landscape of depth and quiet contrast.", "These mountain scenes frame an exploration of whisky: its materials, its making and the time it takes to develop character."],
  },
  beginning: {
    heading: { numeral: "II", label: "The Beginning", lead: "Simple ingredients,", emphasis: "considered choices." } satisfies StoryHeading,
    body: ["Single malt begins with malted barley, water and yeast. Fermentation and distillation transform those ingredients into a spirit ready for oak.", "From the shape of a still to the choice of a cask, each decision offers another way to explore aroma, texture and balance."],
    quotes: [
      { text: "From grain to spirit, character takes shape through care.", name: "The Making", role: "Barley · Water · Copper" },
      { text: "Oak gives time a texture, and spirit a deeper voice.", name: "The Maturation", role: "Wood · Time · Balance" },
    ] satisfies Quote[],
  },
  landscape: {
    heading: { numeral: "III", label: "The Landscape", lead: "Ridge, cloud,", emphasis: "forest, snow." } satisfies StoryHeading,
    statements: [
      { figure: "Mountain light", caption: "Across the ridgelines", text: "Warm light moves across distant slopes;" },
      { figure: "Forest air", caption: "Among the deodars", text: "cloud drifts through the pines." },
      { figure: "Grain & water", caption: "The foundations of the craft", text: "In whisky, a few simple ingredients open a world of aroma and texture." },
    ],
  },
  emblem: {
    heading: { numeral: "IV", label: "The Natural World", lead: "Forest colour,", emphasis: "mountain detail." } satisfies StoryHeading,
    body: "A rhododendron in bloom, the iridescence of a monal, the rhythm of a forest ridge. Explore the natural details that bring this Himalayan setting to life.",
    parts: [
      { id: "flower", index: "01", title: "Rhododendron", body: { text: "Rhododendron brings vivid colour to the mountain slopes, a brief bloom against the deep green of the forest.", verified: true }, regions: [{ cx: 0.5, cy: 0.17, rx: 0.21, ry: 0.19 }] },
      { id: "monals", index: "02", title: "The Monal", body: { text: "Copper, emerald and violet catch the light in the plumage of the Himalayan monal.", verified: true }, regions: [{ cx: 0.19, cy: 0.55, rx: 0.2, ry: 0.27 }] },
      { id: "tails", index: "03", title: "The Forest", body: { text: "Deodar branches and layered canopies create a world of shade, texture and shifting light.", verified: true }, regions: [{ cx: 0.5, cy: 0.83, rx: 0.33, ry: 0.17 }] },
      { id: "wordmark", index: "04", title: "The Ridgeline", body: { text: "One ridge gives way to another, their silhouettes softened by distance and mountain air.", verified: true }, regions: [{ cx: 0.81, cy: 0.55, rx: 0.2, ry: 0.27 }] },
    ] satisfies EmblemPart[],
  },
  philosophy: {
    heading: { numeral: "V", label: "The Philosophy", lead: "Place, craft,", emphasis: "patience, character." } satisfies StoryHeading,
    principles: [
      { index: "01", title: "Place", body: "A landscape can invite a different pace, and a closer attention to detail." },
      { index: "02", title: "Craft", body: "Few ingredients, many decisions. Copper, wood and water handled with care." },
      { index: "03", title: "Patience", body: "Maturation is a conversation between spirit and wood, guided by time." },
      { index: "04", title: "Character", body: "Aroma, texture and finish: an invitation to discover the subtle differences." },
    ] satisfies Principle[],
  },
  closing: { eyebrow: "The Journey Continues", title: "Some things cannot be hurried." },
};
export type Photo = { src: string; mobile?: string; width: number; height: number; subject: string; author?: string; license?: string; licenseUrl?: string; source?: string; conceptual?: boolean };

/** Regional photographs retain their original credits and licences. */
export const storyPhotos = {
  opening: { src: "/media/story/opening-solan-hills.webp", mobile: "/media/story/opening-solan-hills-mobile.webp", width: 2000, height: 1205, subject: "The hills around Solan", author: "Mayankgupta954", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", source: "https://commons.wikimedia.org/wiki/File:The_Lovely_Solan_Hills.jpg" },
  valley: { src: "/media/story/valley-shivaliks.webp", mobile: "/media/story/valley-shivaliks-mobile.webp", width: 2000, height: 1333, subject: "The Shivaliks rising toward the Himalaya, Himachal Pradesh", author: "Timothy A. Gonsalves", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", source: "https://commons.wikimedia.org/wiki/File:Shivaliks_Himalayas_Aerial_Dehaze_Himachal_Feb20_R16_02827.jpg" },
  stone: { src: "/media/photography/collection-midnight-vault.webp", width: 1672, height: 941, subject: "Stone and low light", conceptual: true },
  oak: { src: "/media/photography/collection-golden-heritage.webp", width: 1672, height: 941, subject: "Oak and bronze", conceptual: true },
  ridge: { src: "/media/story/landscape-ridge.webp", mobile: "/media/story/landscape-ridge-mobile.webp", width: 2000, height: 1333, subject: "Ridges of the Shivalik range at dusk", author: "Donvikro", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", source: "https://commons.wikimedia.org/wiki/File:Shiwalik_Range.jpg" },
  cloud: { src: "/media/story/landscape-cloud.webp", mobile: "/media/story/landscape-cloud-mobile.webp", width: 2000, height: 1125, subject: "Deodar forest in monsoon cloud, Shimla", author: "RayAdvait", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0", source: "https://commons.wikimedia.org/wiki/File:Deodar_forests_of_Shimla_in_monsoon.jpg" },
  forest: { src: "/media/story/landscape-forest.webp", mobile: "/media/story/landscape-forest-mobile.webp", width: 1836, height: 1102, subject: "Deodar forest, Himachal Pradesh", author: "BhotaRohit", license: "CC0", source: "https://commons.wikimedia.org/wiki/File:Traditional_Devdar_forest_in_the_western_Himalayas_Himachal_Pradesh.jpg" },
  snow: { src: "/media/story/landscape-snow.webp", mobile: "/media/story/landscape-snow-mobile.webp", width: 2000, height: 1160, subject: "Churdhar peak from Thundal, Himachal Pradesh", author: "Jagriti Zinta", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", source: "https://commons.wikimedia.org/wiki/File:Churdhar_Peak_seen_from_Thundal_village,_Himachal_Pradesh,_India.jpg" },
  monal: { src: "/media/story/emblem-monal.webp", mobile: "/media/story/emblem-monal-mobile.webp", width: 2000, height: 1500, subject: "A male Himalayan monal in the forest", author: "Mike Prince", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0", source: "https://commons.wikimedia.org/wiki/File:Himalayan_Monal_(43705024970).jpg" },
  crest: { src: "/media/story/emblem-crest.webp", mobile: "/media/story/emblem-crest-mobile.webp", width: 2000, height: 1328, subject: "The monal's raised crest", author: "H005", license: "Public domain", source: "https://commons.wikimedia.org/wiki/File:Lophophorus_impejanus_Zoo_DU_1.jpg" },
  rhododendron: { src: "/media/story/emblem-rhododendron.webp", mobile: "/media/story/emblem-rhododendron-mobile.webp", width: 2000, height: 1333, subject: "Rhododendron arboreum in Seraj, Himachal Pradesh", author: "The Nilgiris Raju L", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", source: "https://commons.wikimedia.org/wiki/File:Rhododendron_arboreum_in_Seraj.jpg" },
  place: { src: "/media/story/philosophy-place.webp", mobile: "/media/story/philosophy-place-mobile.webp", width: 2000, height: 1200, subject: "Sunset over the hills of Himachal Pradesh", author: "Aaryan Singh", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", source: "https://commons.wikimedia.org/wiki/File:A_Mountain_sunset.jpg" },
  craft: { src: "/media/story/philosophy-craft.webp", mobile: "/media/story/philosophy-craft-mobile.webp", width: 2000, height: 1028, subject: "Copper pot stills (conceptual)", author: "Thechadwix", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", source: "https://commons.wikimedia.org/wiki/File:ASW_Distillery_-_Atlanta%27s_hometown_whiskey_bourbon_craft_distillery.jpg", conceptual: true },
  patience: { src: "/media/story/philosophy-patience.webp", mobile: "/media/story/philosophy-patience-mobile.webp", width: 2000, height: 1240, subject: "Casks at rest (conceptual)", author: "sebastian.b.", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0", source: "https://commons.wikimedia.org/wiki/File:Bruichladdich_(9860712223).jpg", conceptual: true },
  twilight: { src: "/media/story/closing-twilight.webp", mobile: "/media/story/closing-twilight-mobile.webp", width: 2000, height: 1126, subject: "Twilight through deodars in the Himalaya", author: "Poojilsharma07", license: "CC0", source: "https://commons.wikimedia.org/wiki/File:Twilight_in_Himalayas.jpg" },
} satisfies Record<string, Photo>;

export type Hotspot = { id: string; x: number; y: number; title: string; body: Claim };
export type CraftScene = {
  id: "copper" | "grain" | "oak";
  index: string;
  title: string;
  lede: string;
  /** Path to supplied photography / video. Empty → art-directed placeholder. */
  media?: string;
  mediaNote: string;
  hotspots: Hotspot[];
};

export const craft: { intro: string; heading: string; lede: string; scenes: CraftScene[] } = {
  intro: "Our Craft",
  heading: "From fire, grain and oak",
  lede: "An illustrated exploration of the ingredients, materials and patient decisions behind single malt whisky.",
  scenes: [
    {
      id: "copper",
      index: "01",
      title: "Copper & Fire",
      lede: "Where wash becomes spirit.",
      mediaNote: "Illustrative copper still scene",
      hotspots: [
        { id: "pot", x: 38, y: 58, title: "Pot still", body: { text: "Copper pot stills transform fermented wash into spirit through heat and condensation.", verified: true } },
        { id: "neck", x: 62, y: 26, title: "Swan neck", body: { text: "A still’s shape influences reflux and the character of its spirit.", verified: true } },
      ],
    },
    {
      id: "grain",
      index: "02",
      title: "Malted Barley",
      lede: "The single grain at the heart of a single malt.",
      mediaNote: "Illustrative malted barley scene",
      hotspots: [
        { id: "barley", x: 46, y: 44, title: "The grain", body: { text: "Malting prepares barley for the conversion of starch into fermentable sugars.", verified: true } },
        { id: "water", x: 72, y: 70, title: "Water", body: { text: "Water plays a role throughout whisky making, from mashing to the final balance of the spirit.", verified: true } },
      ],
    },
    {
      id: "oak",
      index: "03",
      title: "Oak & Time",
      lede: "Spirit and wood, in conversation over time.",
      mediaNote: "Illustrative oak maturation scene",
      hotspots: [
        { id: "cask", x: 34, y: 50, title: "Cask types", body: { text: "Oak and a cask’s previous contents can contribute colour, aroma and texture.", verified: true } },
        { id: "climate", x: 68, y: 32, title: "Maturation", body: { text: "Time and storage conditions shape the exchange between spirit, wood and air.", verified: true } },
      ],
    },
  ],
};

export type ShowcaseStep = { kicker: string; title: string; body: Claim };
export type ExpressionId = "private-edition-i" | "the-vault-series";

export type Expression = {
  id: ExpressionId;
  name: string;
  /** One line drawn from the supplied tasting notes. */
  descriptor: string;
  /** Liquid tone used for 2D glows. */
  liquid: string;
  /** Room tint while this expression is selected. */
  accent: string;
  /** Showcase room: centre and edge of its radial light. */
  stage: [string, string];
  /** Visual theme supplied by the brand. */
  theme: { name: string; colors: string[] };
  /** Reference photograph: lightweight fallback when WebGL is unavailable. */
  image: { src: string; alt: string; width: number; height: number };
  /** Optional accurate GLB. When present it replaces the procedural model. */
  model?: string;
  notes: { nose: string; palate: string; finish: string };
  /** Exactly three beats — the showcase choreography is timed to them. */
  showcase: [ShowcaseStep, ShowcaseStep, ShowcaseStep];
};

const supplied = (text: string): Claim => ({ text, verified: true });

/** Illustrative profiles, not specifications or claims about a commercial product. */
export const expressions: Expression[] = [
  {
    id: "private-edition-i", name: "Single Malt · 01", descriptor: "Malt, orchard fruit and gentle oak",
    liquid: "#b5621a", accent: "#0f3326", stage: ["#12261d", "#0c1a14"],
    theme: { name: "Deep emerald, antique gold and amber", colors: ["#0f3326", "#b08a43", "#b5621a"] },
    image: { src: "/media/bottles/velmora-malt-01.webp?design=approved-reference-v1", alt: "Approved Velmora 01 decanter with an ivory-and-black cartouche, engraved shoulders, ornate stopper and raised starburst sides", width: 596, height: 1250 },
    notes: { nose: "An illustrative profile of orchard fruit, soft vanilla and toasted grain.", palate: "Rounded malt, a little honey and gentle oak spice.", finish: "A soft, warm finish with a lingering suggestion of oak." },
    showcase: [
      { kicker: "Single Malt · 01", title: "A Study in Balance", body: supplied("Architectural shoulders, warm amber spirit and an understated ivory label. An exploration of single malt in its simplest form.") },
      { kicker: "The Nose", title: "Fruit, grain and vanilla", body: supplied("An illustrative tasting journey through orchard fruit, toasted grain and soft vanilla.") },
      { kicker: "Palate & Finish", title: "Rounded malt, gentle oak", body: supplied("Imagine honeyed malt and quiet spice, settling into a soft, warming finish.") },
    ],
  },
  {
    id: "the-vault-series", name: "Single Malt · 02", descriptor: "Dried fruit, cocoa and warm spice",
    liquid: "#7a1f2b", accent: "#331219", stage: ["#2a1218", "#14090c"],
    theme: { name: "Dark stone, copper and deep amber", colors: ["#331219", "#b08a43", "#7a1f2b"] },
    image: { src: "/media/bottles/velmora-malt-02.webp?design=approved-reference-v1", alt: "Approved Velmora 02 decanter with a black-and-gold cartouche, flowing side relief, wrapped long neck and faceted jewel stopper", width: 498, height: 1250 },
    notes: { nose: "An illustrative profile of dried fruit, cocoa and a hint of vanilla.", palate: "Deep malt, toasted oak and warming spice.", finish: "A lingering suggestion of dark fruit and dry oak." },
    showcase: [
      { kicker: "Single Malt · 02", title: "Depth in Every Detail", body: supplied("Faceted glass, a dark label and copper accents frame a deeper amber spirit.") },
      { kicker: "The Nose", title: "Dried fruit and cocoa", body: supplied("An illustrative tasting journey through dark fruit, cocoa and soft vanilla.") },
      { kicker: "Palate & Finish", title: "Deep malt, warming spice", body: supplied("Imagine toasted oak and rich malt, followed by a lingering, gently spiced finish.") },
    ],
  },
];

export const expressionById = (id: ExpressionId) => expressions.find((e) => e.id === id)!;

/** Approved product-led introduction for the homepage showcase only. */
export const bottleIntroduction = {
  kicker: "SINGLE MALT WHISKY",
  title: "A Spirit Worth Discovering.",
  body: { text: "Explore the colour, form and character of single malt whisky.", verified: true },
};

export const collection = {
  intro: "Our Whisky",
  heading: "Two expressions",
  expressions,
};

export const contact = {
  intro: "Contact",
  heading: "Write to the valley",
  lede: "For general, trade, press and partnership enquiries.",
  enquiryTypes: ["General enquiry", "Trade & distribution", "Press & media", "Partnerships"],
  /** No address, email or phone has been supplied — none is shown. */
  pendingDetails: "Direct contact details will be published at launch.",
};

export const nav = [
  { href: "/", label: "Home" },
  { href: "/story", label: "Our Story" },
  { href: "/craft", label: "Our Craft" },
  { href: "/whisky", label: "Our Whisky" },
  { href: "/contact", label: "Contact" },
];

/** Pages readable before age confirmation. */
export const informationPages = ["/terms", "/privacy", "/responsible-drinking"];

/** "The Sound of the Valley": licensed field recordings (Wikimedia Commons),
 * each labelled by where it was actually recorded. None is from Solan; see
 * docs/assets/soundscape.md for the recordings still to be made there. */
export const soundCredits = [
  { subject: "Dawn soundscape, Pathari Forest Range, Uttarakhand", author: "Taukeer Alam Lodha", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", source: "https://commons.wikimedia.org/wiki/File:Sonus_naturalis_-_Soundscape_XC376330.mp3" },
  { subject: "Streaked laughingthrush, Shimla, Himachal Pradesh", author: "Shyamal", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0", source: "https://commons.wikimedia.org/wiki/File:Streaked_laughing_thrush_simla.ogg" },
  { subject: "Great barbet, Munsiyari, Uttarakhand", author: "L. Shyamal", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0", source: "https://commons.wikimedia.org/wiki/File:MegalaimaVirens.ogg" },
  { subject: "Wind in woodland, Bourne Woods, England", author: "Robert EA Harvey", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", source: "https://commons.wikimedia.org/wiki/File:Bourne_woods_windy_2020-05-05_0757.mp3" },
  { subject: "Wind in a pine forest, Lysekil, Sweden", author: "W.carter", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", source: "https://commons.wikimedia.org/wiki/File:Wind_in_Swedish_pine_forest_at_25_mps.ogg" },
];
