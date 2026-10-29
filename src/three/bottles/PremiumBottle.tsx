"use client";

import { Clone, MeshTransmissionMaterial, useGLTF, useTexture } from "@react-three/drei";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { SRGBColorSpace, type MeshPhysicalMaterial } from "three";
import type { Expression } from "@/content/site";
import { designs, type BottleDesign } from "./designs";
import { frontPatch, loft } from "./loft";
import { ApprovedDetails } from './ApprovedDetails';

export type Quality = "high" | "low";

/** Bottle-local construction; the parent owns every camera/scroll/drag transform. */
export function PremiumBottle({ expression, quality }: { expression: Expression; quality: Quality }) {
  if (expression.model) return <GLBBottle src={expression.model} />;
  return <ProceduralBottle expression={expression} quality={quality} />;
}
function GLBBottle({ src }: { src: string }) {
  const { scene } = useGLTF(src);
  return <Clone object={scene} />;
}

function CrystalGlass({ design }: { design: BottleDesign }) {
  const material = useRef<MeshPhysicalMaterial>(null);
  useLayoutEffect(() => {
    const m = material.current;
    if (!m) return;
    const compile = m.onBeforeCompile, cache = m.customProgramCacheKey;
    const { floor, fill } = design.construction;
    m.onBeforeCompile = (shader, renderer) => {
      compile.call(m, shader, renderer);
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying float vCrystalY;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvCrystalY = position.y;');
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vCrystalY;').replace('#include <dithering_fragment>', `
        #include <dithering_fragment>
        // Clear crystal must transmit the page through the transparent canvas,
        // rather than baking a black rectangle into the heavy base/headspace.
        float clearBase = 1.0 - smoothstep(${floor - .01}, ${floor + .015}, vCrystalY);
        float clearNeck = smoothstep(${fill + .012}, ${fill + .045}, vCrystalY);
        float fresnelEdge = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 2.0);
        float crystalReflectedLuma = clamp(dot(gl_FragColor.rgb, vec3(.2126, .7152, .0722)), 0.0, 1.0);
        float clearAlpha = clamp(.22 + .72 * fresnelEdge + .35 * crystalReflectedLuma, .22, .96);
        gl_FragColor.a = mix(1.0, clearAlpha, max(clearBase, clearNeck));
      `);
    };
    m.customProgramCacheKey = () => `velmora-crystal-${floor}-${fill}`;
    m.needsUpdate = true;
    return () => { m.onBeforeCompile = compile; m.customProgramCacheKey = cache; };
  }, [design]);
  return <MeshTransmissionMaterial ref={value => { material.current = value as unknown as MeshPhysicalMaterial | null; }} vertexColors transparent resolution={512} samples={4} transmission={1} thickness={design.construction.wall * 2} roughness={0.027} ior={1.52} chromaticAberration={.0015} anisotropicBlur={.005} color="#f8faf7" attenuationColor="#dce8dd" attenuationDistance={4} clearcoat={0.1} clearcoatRoughness={0.045} specularIntensity={1} envMapIntensity={1.05} />;
}
function ProceduralBottle({ expression, quality }: { expression: Expression; quality: Quality }) {
  const design = designs[expression.id];
  const dark = expression.id === "the-vault-series";
  const segments = quality === "high" ? 192 : 96;
  const [label,backLabel]=useTexture([design.label.src,design.backLabel.src]);
  useMemo(()=>{for(const texture of [label,backLabel]){texture.colorSpace=SRGBColorSpace;texture.anisotropy=8;}},[label,backLabel]);
  const geometry = useMemo(() => {
    const { mouth } = design.construction;
    // A dark sealing insert is visible through the short unfilled neck.
    const seal = loft([
      { y: mouth - .09, a: .117, b: .107, n: 8, cut: .035 },
      { y: mouth + .012, a: .117, b: .107, n: 8, cut: .035 },
    ], { segments });
    return { glass: design.glass(segments), liquid: design.liquid(segments), label: frontPatch(design.section, design.label), back:frontPatch(design.section,design.backLabel), seal };
  }, [design, segments, dark]);
  useEffect(() => () => Object.values(geometry).forEach(g => g.dispose()), [geometry]);
  return (
    <group>
      <mesh geometry={geometry.liquid} renderOrder={1}>
        <meshPhysicalMaterial vertexColors transmission={quality === "high" ? .58 : 0} thickness={dark ? .64 : .55} attenuationColor={dark ? "#bd7c25" : "#dda04a"} attenuationDistance={dark ? 1.05 : 1.8} roughness={0.08} metalness={0} ior={1.36} specularIntensity={0.55} clearcoat={0} envMapIntensity={0.75} />
      </mesh>
      <mesh geometry={geometry.glass} renderOrder={2}>
        {quality === "high" ? (
          <CrystalGlass design={design} />
        ) : (
          <meshPhysicalMaterial vertexColors transparent opacity={0.16} roughness={0.045} metalness={0} ior={1.52} specularIntensity={1} clearcoat={0.2} envMapIntensity={1.25} color="#f1f6f0" depthWrite={false} />
        )}
      </mesh>
      <mesh geometry={geometry.label} renderOrder={3}>
        <meshStandardMaterial map={label} transparent depthWrite={false} alphaTest={0.5} roughness={dark ? .52 : .72} metalness={dark ? .16 : .035} envMapIntensity={.7} />
      </mesh>
      <mesh geometry={geometry.back} rotation-y={Math.PI} renderOrder={3}>
        <meshStandardMaterial map={backLabel} transparent depthWrite={false} alphaTest={.5} roughness={.62} metalness={.08} envMapIntensity={.65}/>
      </mesh>
      <mesh geometry={geometry.seal}>
        <meshStandardMaterial color="#28231c" roughness={.8} />
      </mesh>
      <ApprovedDetails design={design} low={quality==='low'}/>
    </group>
  );
}
