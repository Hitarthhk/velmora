import type { Metadata } from "next";
import { preload } from "react-dom";
import { storyPhotos } from "@/content/site";
import { OurStory } from "@/sections/story/OurStory";

export const metadata: Metadata = {
  title: "Our Story",
  description: "A journey through Himalayan landscapes, the craft of single malt and the natural world.",
};

/** Our Story: one continuous film in five chapters. */
export default function StoryPage() {
  preload(storyPhotos.opening.src, { as: "image", fetchPriority: "high" });
  return <OurStory />;
}
