"use client";

import { useEffect, useRef } from "react";

/**
 * One pre-rendered Himalayan scene image (see scripts/render-scenes.mjs),
 * in a landscape and a portrait cut. It fades in once decoded; the parent
 * provides a matching colour beneath, so nothing pops.
 */
export function ScenePicture({ name, className, priority = false }: { name: string; className?: string; priority?: boolean }) {
  const img = useRef<HTMLImageElement>(null);

  // Images that finished before hydration never fire onLoad.
  useEffect(() => {
    if (img.current?.complete) img.current.dataset.loaded = "true";
  }, []);

  return (
    <picture>
      <source media="(orientation: portrait)" srcSet={`/media/scenes/portrait/${name}.webp`} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={img}
        src={`/media/scenes/landscape/${name}.webp`}
        alt=""
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        className={className}
        data-scene-img
        // Priority images show as soon as the browser has them — no waiting for hydration.
        data-loaded={priority ? "true" : undefined}
        onLoad={(e) => (e.currentTarget.dataset.loaded = "true")}
      />
    </picture>
  );
}
