import { HalfFloatType, LinearFilter, Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2, WebGLRenderer, WebGLRenderTarget } from "three";
import { himalayaGLSL } from "./glsl";

/**
 * Bakes the age gate’s two frames — the range at midnight and the same range
 * in morning light — for scripts/render-scenes.mjs. At runtime the gate shows
 * these images; the mist drifts and the dawn crossfades with CSS.
 */

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

/** Lit terrain and sky. Alpha stores ray distance (1 = sky). */
const terrainFragment = himalayaGLSL + /* glsl */ `
  uniform float uDawn;
  uniform float uSteps;
  float terrain(vec2 p, int oct) { return terrainBase(p, oct); }

  void main() {
    vec3 rd = rayDir();
    float t;
    float hit = march(RO, rd, uSteps, t);
    vec3 col = mix(nightSky(rd), morningSky(rd), uDawn);
    if (hit > 0.5) {
      vec3 p = RO + rd * t;
      col = shade(p, normalAt(p.xz, t), uDawn);
      col = mix(col, hazeColour(uDawn), clamp(1.0 - exp(-t * 0.018), 0.0, 1.0));
    }
    gl_FragColor = vec4(col, hit > 0.5 ? t / FAR : 1.0);
  }
`;

/** Adds valley mist, a faint cloud veil and a vignette to one lighting. */
const compositeFragment = himalayaGLSL + /* glsl */ `
  uniform sampler2D tScene;
  uniform float uDawn;
  float terrain(vec2 p, int oct) { return terrainBase(p, oct); }

  void main() {
    vec3 rd = rayDir();
    vec4 scene = texture2D(tScene, vUv);
    vec3 col = scene.rgb;
    if (scene.a < 0.999) {
      float t = scene.a * FAR;
      vec3 p = RO + rd * t;
      float low = exp(-max(p.y - 0.9, 0.0) * 1.4) * smoothstep(3.0, 16.0, t) * (0.4 + 0.6 * fbm(p.xz * 0.12));
      vec3 mistCol = mix(vec3(0.11, 0.14, 0.17), vec3(0.78, 0.80, 0.80), uDawn);
      col = mix(col, mistCol, clamp(low * 0.55, 0.0, 0.6));
    } else if (rd.y > 0.0) {
      vec2 cp = rd.xz / (rd.y + 0.08) * 1.6;
      float cl = smoothstep(0.52, 0.85, fbm(cp));
      col = mix(col, mix(vec3(0.16, 0.20, 0.25), vec3(0.95, 0.93, 0.88), uDawn), cl * 0.22 * smoothstep(0.0, 0.25, rd.y));
    }
    vec2 q = vUv - 0.5;
    col *= 1.0 - dot(q, q) * 0.55;
    col += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
    gl_FragColor = vec4(pow(max(col, 0.0), vec3(0.95)), 1.0);
  }
`;

export async function bakeGate(width: number, height: number) {
  const ss = 1.35;
  const W = Math.round(width * ss), H = Math.round(height * ss);
  const canvas = document.createElement("canvas");
  const renderer = new WebGLRenderer({ canvas, alpha: false, preserveDrawingBuffer: true, antialias: false });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  const uRes = { value: new Vector2(W, H) };
  const target = new WebGLRenderTarget(W, H, { type: HalfFloatType, minFilter: LinearFilter, magFilter: LinearFilter, depthBuffer: false });
  const terrain = new ShaderMaterial({ vertexShader: vertex, fragmentShader: terrainFragment, uniforms: { uRes, uDawn: { value: 0 }, uSteps: { value: 240 } }, depthTest: false, depthWrite: false });
  const composite = new ShaderMaterial({ vertexShader: vertex, fragmentShader: compositeFragment, uniforms: { uRes, tScene: { value: target.texture }, uDawn: { value: 0 } }, depthTest: false, depthWrite: false });
  const mesh = new Mesh(new PlaneGeometry(2, 2), terrain);
  mesh.frustumCulled = false;
  const scene = new Scene().add(mesh);
  const camera = new OrthographicCamera();

  // In tiles with a frame between them: one full-screen raymarch at this size
  // can exceed the GPU watchdog and reset the driver.
  const frame = async (dawn: number) => {
    mesh.material = terrain;
    terrain.uniforms.uDawn.value = dawn;
    renderer.setRenderTarget(target);
    renderer.setScissorTest(true);
    const tiles = Math.ceil((W * H) / 150_000);
    for (let i = 0; i < tiles; i++) {
      const y0 = Math.floor((H * i) / tiles), y1 = Math.floor((H * (i + 1)) / tiles);
      target.scissor.set(0, y0, W, y1 - y0);
      target.scissorTest = true;
      renderer.setRenderTarget(target); // a target’s scissor is applied when it is bound
      renderer.render(scene, camera);
      await new Promise((r) => requestAnimationFrame(r));
    }
    target.scissorTest = false;
    renderer.setScissorTest(false);
    mesh.material = composite;
    composite.uniforms.uDawn.value = dawn;
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
    const out = document.createElement("canvas");
    out.width = width;
    out.height = height;
    const ctx = out.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(canvas, 0, 0, width, height);
    await new Promise((r) => requestAnimationFrame(r));
    return out;
  };

  try {
    return { night: await frame(0), dawn: await frame(1) };
  } finally {
    [terrain, composite, target].forEach((d) => d.dispose());
    mesh.geometry.dispose();
    renderer.dispose();
  }
}
