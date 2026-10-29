"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import { useEffect, useRef, useState, type RefObject } from "react";
import type { Expression } from "@/content/site";
import { Bottle, CAMERA, type Quality } from "./Bottle";
import { designs } from "./bottles/designs";
import { StudioReflections } from "./StudioReflections";
import { WhiskyLighting } from "./WhiskyLighting";
import { useDragRotate } from "./useDragRotate";
import { ContextLossGuard } from "./ContextLossGuard";
import { TransmissionBackdrop } from "./useTransmissionBackdrop";
import type { GalleryTarget } from "@/components/transition/HeroBottleHandoff";

type Props = {
  expression: Expression;
  /** Room tone behind the canvas, refracted by clear glass. */
  backdrop: string;
  progress: RefObject<number>;
  quality: Quality;
  mode: "scroll" | "static";
  idle: boolean;
  className?: string;
  /** Report only after the loaded model has rendered in its current pose. */
  onReady?: () => void;
  onUnavailable?: () => void;
  gallery?: GalleryTarget;
};

/**
 * WebGL stage for one bottle. The canvas is created only once the stage nears
 * the viewport, renders only while visible, clamps DPR and builds its studio
 * lighting from procedural light-formers tinted to the expression (no HDR
 * download). Dragging the stage turns the bottle.
 */
export default function BottleStage({ expression, backdrop, progress, quality, mode, idle, className, onReady, onUnavailable, gallery }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  const [struggling, setStruggling] = useState(false);
  const drag = useDragRotate(host);
  const light = designs[expression.id].light;

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      setVisible(e.isIntersecting);
      if (e.isIntersecting) setNear(true);
    }, { rootMargin: "50% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={host} className={className} style={{ touchAction: "pan-y", cursor: "grab" }} data-cursor="Drag">
      {near && (
        <Canvas
          frameloop={visible ? "always" : "never"}
          dpr={struggling ? 1 : quality === "high" ? [1, 1.75] : [1, 1.25]}
          camera={{ position: [0, 0, CAMERA.z], fov: CAMERA.fov }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          aria-hidden="true"
        >
          {/* Sustained low frame rates drop to 1× pixels for the rest of the visit. */}
          <PerformanceMonitor onDecline={() => setStruggling(true)} />
          <TransmissionBackdrop color={backdrop} />
          {onUnavailable && <ContextLossGuard onUnavailable={onUnavailable} />}
          <WhiskyLighting expression={expression} gallery={gallery} progress={progress} reduced={!idle} />
          <Bottle expression={expression} progress={progress} quality={quality} mode={mode} idle={idle} drag={drag} onReady={onReady} gallery={gallery} />
          <Environment resolution={256} frames={1}>
            <StudioReflections />
            {/* Thin strip lights: crisp streak reflections on flat glass, as in product photography. */}
            <Lightformer form="rect" intensity={5} color="#fff1d6" position={[-3.2, 1, 3]} scale={[0.22, 7, 1]} target={[0, 0, 0]} />
            <Lightformer form="rect" intensity={3} color={light.fill} position={[3.4, 0.5, 2.4]} scale={[0.16, 6, 1]} target={[0, 0, 0]} />
            <Lightformer form="rect" intensity={1.4} color={light.rim} position={[0, 0.4, -5]} scale={[3, 5, 1]} target={[0, 0, 0]} />
            <Lightformer form="ring" intensity={0.22} color="#ffffff" position={[0, 4, -3]} scale={2} target={[0, 0, 0]} />
            <Lightformer form="rect" intensity={0.35} color="#284a39" position={[0, -4, 0]} rotation-x={Math.PI / 2} scale={[12, 12, 1]} />
          </Environment>
        </Canvas>
      )}
    </div>
  );
}
