import { ourStory } from "@/content/site";

/** Anchors for the five chapters, used by the opening index and the rail. */
export const STORY_CHAPTERS = [
  { id: "story-valley", ...ourStory.valley.heading },
  { id: "story-beginning", ...ourStory.beginning.heading },
  { id: "story-landscape", ...ourStory.landscape.heading },
  { id: "story-emblem", ...ourStory.emblem.heading },
  { id: "story-philosophy", ...ourStory.philosophy.heading },
];
