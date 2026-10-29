"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState, type RefObject } from "react";
import type { MotionValue } from "motion/react";
import { Group, MathUtils, SpotLight } from "three";
import type { Expression, ExpressionId } from "@/content/site";
import { CAMERA } from "./Bottle";
import { designs } from "./bottles/designs";
import { StudioReflections } from "./StudioReflections";
import { PremiumBottle, type Quality } from "./bottles/PremiumBottle";
import { stepDrag, type DragState } from "./useDragRotate";
import { WhiskyLighting } from "./WhiskyLighting";
import { ContextLossGuard } from "./ContextLossGuard";
import { Precompile } from "./Precompile";
import { TransmissionBackdrop } from "./useTransmissionBackdrop";

type Props = {
  expressions: Expression[];
  active: number;
  /** The card areas each bottle should stand in (DOM elements). */
  slots: RefObject<Partial<Record<ExpressionId, HTMLElement | null>>>;
  drags: RefObject<Partial<Record<ExpressionId, DragState>>>;
  quality: Quality;
  idle: boolean;
  className?: string;
  omitFirst?: boolean;
  rendering?: boolean;
  world?: MotionValue<number>;
  onReady?: () => void;
  onUnavailable?: () => void;
};

const VIS_H = 2 * CAMERA.z * Math.tan(MathUtils.degToRad(CAMERA.fov / 2));

/**
 * Both expressions in one WebGL context, standing behind their cards. Each
 * bottle is fitted to its card every frame, so it tracks layout, hover lifts
 * and responsive changes. The selected bottle steps forward into the light.
 */
export default function CollectionStage({ expressions, active, slots, drags, quality, idle, className, omitFirst = false, rendering = true, onReady, onUnavailable, world }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  const [struggling, setStruggling] = useState(false);

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

  const loaded = useRef(new Set<string>());
  const markReady = (id: string) => {
    loaded.current.add(id);
    if (loaded.current.size >= expressions.length - (omitFirst ? 1 : 0)) onReady?.();
  };
  const tint = designs[expressions[active].id].light;
  // A stable dark transmission plate avoids refraction flashes on selection;
  // Three.js blends the directional studio colours instead.
  const backdrop = "#16181d";

  return (
    <div ref={host} className={className}>
      {near && (
        <Canvas
          frameloop={visible && rendering ? "always" : "never"}
          dpr={struggling ? 1 : quality === "high" ? [1, 1.75] : [1, 1.25]}
          camera={{ position: [0, 0, CAMERA.z], fov: CAMERA.fov }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          aria-hidden="true"
        >
          {/* Sustained low frame rates drop to 1× pixels for the rest of the visit. */}
          <PerformanceMonitor onDecline={() => setStruggling(true)} />
          <TransmissionBackdrop color={backdrop} />
          <ContextLossGuard onUnavailable={onUnavailable} />
          <WhiskyLighting expression={expressions[active]} collection reduced={!idle} world={world} />
          {expressions.map((e, i) => (omitFirst && i === 0 ? null : (
            <SlotBottle key={e.id} expression={e} active={i === active} host={host} slots={slots} drags={drags} quality={quality} idle={idle} world={world} onReady={() => markReady(e.id)} />
          )))}
          <Environment resolution={256} frames={1}>
            <StudioReflections />
            <Lightformer form="rect" intensity={5} color="#fff1d6" position={[-3.2, 1, 3]} scale={[0.22, 7, 1]} target={[0, 0, 0]} />
            <Lightformer form="rect" intensity={3} color={tint.fill} position={[3.4, 0.5, 2.4]} scale={[0.16, 6, 1]} target={[0, 0, 0]} />
            <Lightformer form="rect" intensity={1.4} color={tint.rim} position={[0, 0.4, -5]} scale={[3, 5, 1]} target={[0, 0, 0]} />
            <Lightformer form="ring" intensity={0.22} color="#ffffff" position={[0, 4, -3]} scale={2} target={[0, 0, 0]} />
          </Environment>
        </Canvas>
      )}
    </div>
  );
}

function SlotBottle({ expression, active, host, slots, drags, quality, idle, onReady, world }: Omit<Props, "expressions" | "active" | "className"> & { expression: Expression; active: boolean; host: RefObject<HTMLDivElement | null> }) {
  const group = useRef<Group>(null);
  const spot = useRef<SpotLight>(null);
  const design = designs[expression.id];
  const yawIdle = useRef(0);
  const loaded = useRef(false);
  const reported = useRef(false);
  const pending = useRef<number | null>(null);
  useEffect(() => () => { if (pending.current !== null) cancelAnimationFrame(pending.current); }, []);

  useFrame((state, dt) => {
    const g = group.current;
    const slot = slots.current?.[expression.id];
    const frame = host.current?.getBoundingClientRect();
    if (!g || !slot || !frame || !frame.width) return;
    const r = slot.getBoundingClientRect();
    const visW = VIS_H * (frame.width / frame.height);
    const x = ((r.left + r.width / 2 - frame.left) / frame.width - 0.5) * visW;
    const y = (0.5 - (r.top + r.height / 2 - frame.top) / frame.height) * VIS_H;
    const fit = Math.min(((r.height / frame.height) * VIS_H * 0.84) / design.height, ((r.width / frame.width) * visW * 0.86) / design.width);

    const drag = drags.current?.[expression.id];
    const user = drag ? stepDrag(drag, dt) : 0;
    const quiet = drag ? (performance.now() - drag.lastInteraction) / 1000 > 1.5 : true;
    const blend = world?.get() ?? (active ? expression.id === "private-edition-i" ? 0 : 1 : expression.id === "private-edition-i" ? 1 : 0);
    const weight = expression.id === "private-edition-i" ? 1 - blend : blend;
    // A bounded breath keeps the label facing visitors during long pauses.
    yawIdle.current = MathUtils.damp(yawIdle.current,
      active && idle && quiet ? Math.sin(state.clock.elapsedTime * 0.35) * 0.025 : 0, 5, dt);
    const hover = drag?.hover ?? 0;

    g.position.x = MathUtils.damp(g.position.x, x, 6, dt);
    g.position.y = MathUtils.damp(g.position.y, y, 6, dt);
    g.position.z = MathUtils.damp(g.position.z, MathUtils.lerp(-0.25, 0.12, weight), 3, dt);
    g.scale.setScalar(MathUtils.damp(g.scale.x, fit * MathUtils.lerp(0.94, 1, weight), 4, dt));
    g.rotation.y = MathUtils.damp(g.rotation.y, MathUtils.lerp(-0.35, -0.18, weight) + yawIdle.current + user + hover * 0.25, drag?.dragging ? 14 : 3.5, dt);
    if (loaded.current && !reported.current && Math.abs(g.position.x - x) < visW * 0.02 && Math.abs(g.position.y - y) < VIS_H * 0.02 && Math.abs(g.scale.x - fit * MathUtils.lerp(0.94, 1, weight)) < fit * 0.04) {
      reported.current = true;
      pending.current = requestAnimationFrame(() => { pending.current = null; onReady?.(); });
    }
    if (spot.current) {
      spot.current.position.set(g.position.x + 1.2, g.position.y + 3, 3);
      spot.current.target.position.set(g.position.x, g.position.y, 0);
      spot.current.target.updateMatrixWorld();
      spot.current.intensity = MathUtils.damp(spot.current.intensity, MathUtils.lerp(12, 70, weight), 3, dt);
    }
  });

  return (
    <>
      <spotLight ref={spot} angle={0.35} penumbra={1} intensity={12} color={design.light.key} />
      <group ref={group} position={[0, -6, 0]}>
        <group position={[0, -design.height / 2, 0]}>
          <Suspense fallback={null}>
            <PremiumBottle expression={expression} quality={quality} />
            <Precompile />
            <Loaded flag={loaded} />
          </Suspense>
        </group>
      </group>
    </>
  );
}

function Loaded({ flag }: { flag: RefObject<boolean> }) {
  useEffect(() => { flag.current = true; return () => { flag.current = false; }; }, [flag]);
  return null;
}
