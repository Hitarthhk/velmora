import { BottleFeature } from "@/sections/BottleFeature";
import { Collection } from "@/sections/Collection";
import { Contact } from "@/sections/Contact";
import { Hero } from "@/sections/Hero";
import { Origin } from "@/sections/Origin";
import { HeroBottleHandoff } from "@/components/transition/HeroBottleHandoff";

/** Hero → bottle showcase → collection → origin → contact, one continuous film. */
export default function Home() {
  return (
    <>
      <HeroBottleHandoff>
        <Hero />
        <BottleFeature><Collection /></BottleFeature>
      </HeroBottleHandoff>
      <Origin />
      <Contact scene="twilight" />
    </>
  );
}
