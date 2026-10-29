"use client";

import { useMotion } from "@/animation";
import { ChapterBeginning } from "./ChapterBeginning";
import { ChapterEmblem } from "./ChapterEmblem";
import { ChapterLandscape } from "./ChapterLandscape";
import { ChapterPhilosophy } from "./ChapterPhilosophy";
import { ChapterRail } from "./ChapterRail";
import { ChapterValley } from "./ChapterValley";
import { Film } from "./film";
import { StoryClosing } from "./StoryClosing";
import { StoryOpening } from "./StoryOpening";

/** The five chapters as one film. Remounted only if the motion preference
 * changes, so scroll-linked and static styles are never swapped on a live
 * element. */
export function OurStory() {
  const { reduced } = useMotion();
  return (
    <Film key={String(reduced)}>
      <StoryOpening />
      <ChapterValley />
      <ChapterBeginning />
      <ChapterLandscape />
      <ChapterEmblem />
      <ChapterPhilosophy />
      <StoryClosing />
      <ChapterRail />
    </Film>
  );
}
