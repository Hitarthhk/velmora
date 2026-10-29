"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import type { MotionValue } from "motion/react";
import { Color, MathUtils, PointLight, SpotLight } from "three";
import type { Expression } from "@/content/site";
import type { GalleryTarget } from "@/components/transition/HeroBottleHandoff";
import { COLLECTION_ENVIRONMENTS } from "@/components/landscape/collectionEnvironments";
import { galleryMix } from "../components/transition/bottleCollectionProgress";
import { designs } from "./bottles/designs";

/** Existing studio lights, with Three owning their gradual colour change.
 * Scroll blends the showcase into its gallery; selection changes the palette.
 * Static reflection maps remain cached rather than regenerated per frame. */
export function WhiskyLighting({ expression, gallery, progress, collection = false, reduced = false, world }: {
  expression: Expression; gallery?: GalleryTarget; progress?: RefObject<number>; collection?: boolean; reduced?: boolean; world?: MotionValue<number>;
}) {
  const key = useRef<SpotLight>(null);
  const rim = useRef<SpotLight>(null);
  const fill = useRef<PointLight>(null);
  const colors = useMemo(() => Object.fromEntries(Object.entries(COLLECTION_ENVIRONMENTS).map(([id, palette]) =>
    [id, { key: new Color(palette.key), rim: new Color(palette.rim), fill: new Color(palette.fill) }])), []);
  const base = useMemo(() => {
    const light = designs[expression.id].light;
    return { key: new Color(light.key), rim: new Color(light.rim), fill: new Color(light.fill) };
  }, [expression.id]);
  const target = useMemo(() => new Color(), []);
  useFrame((_, dt) => {
    const blend = gallery?.world.current ?? world?.get() ?? (expression.id === "private-edition-i" ? 0 : 1);
    const first = colors["private-edition-i"];
    const second = colors["the-vault-series"];
    const mix = collection ? 1 : gallery && progress ? galleryMix(progress.current) : 0;
    for (const [light, part] of [[key.current, "key"], [rim.current, "rim"], [fill.current, "fill"]] as const) {
      if (!light) continue;
      target.copy(first[part]).lerp(second[part], blend);
      target.lerp(base[part], 1 - mix);
      // The shared Motion value already eases the full 1.05s selection.
      light.color.copy(target);
    }
    if (fill.current) fill.current.intensity = MathUtils.damp(fill.current.intensity, collection ? 5 : 4, 5, dt);
  });
  const light = designs[expression.id].light;
  return <>
    <ambientLight intensity={collection ? 0.16 : 0.18} />
    <spotLight ref={key} position={collection ? [-4, 5, 4] : [-4, 5, 3]} angle={collection ? 0.5 : 0.4}
      penumbra={1} intensity={collection ? 45 : 60} color={light.key} />
    {!collection && <spotLight ref={rim} position={[4, 2, -3]} angle={0.5} penumbra={1} intensity={55} color={light.rim} />}
    <pointLight ref={fill} position={[3, -1, 2]} intensity={collection ? 5 : 4} color={light.fill} distance={8} />
  </>;
}
