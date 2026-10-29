import { Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2, WebGLRenderer } from "three";
import { himalayaGLSL } from "./glsl";
import { crestLine, drawTreeline } from "./pines";

/**
 * Bakes the hero’s Himalayan valley into independent layers — sky, distant
 * peaks, middle ridges, forested ridges, foothills with their treeline,
 * foreground pines, fog bands and clouds — as plain 2D canvases. The DOM
 * layers then move them with transforms only, so scrolling costs no WebGL.
 *
 * Each mountain layer is rendered with only its own distance band of
 * terrain, so nothing is missing behind it when the layers separate.
 * Rendering happens in tiles with a frame break between them, so the page
 * never stalls; one WebGL context is used and released afterwards.
 */

export type HimalayaBake = {
  sky: HTMLCanvasElement;
  /** Far → near: peaks, middle ridges, forested ridges, foothills, foreground pines. */
  layers: HTMLCanvasElement[];
  fog: HTMLCanvasElement[];
  clouds: HTMLCanvasElement[];
};

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const fragment = himalayaGLSL + /* glsl */ `
  uniform int uMode;      // 0 sky · 1 terrain band · 2 fog band · 3 clouds
  uniform vec2 uBand;     // terrain band: near and far z
  uniform float uSteps;
  uniform float uSeed;

  // Only this layer’s band of terrain; behind it the ground falls away.
  float terrain(vec2 p, int oct) {
    return mix(terrainBase(p, oct), -60.0, smoothstep(uBand.y - 1.0, uBand.y + 2.0, p.y));
  }

  // March from the band’s near edge, so nothing in front of it can occlude it.
  float marchBand(vec3 rd, out float t) {
    t = max(0.4, (uBand.x - 3.0 - RO.z) / max(rd.z, 1e-3));
    // Rays that start behind a nearer crest begin underground: walk them out
    // before searching, or the layer leaves a seam just above that crest.
    bool clear = false;
    for (int i = 0; i < 48; i++) {
      vec3 p = RO + rd * t;
      if (p.y - terrain(p.xz, 6) > 0.0) { clear = true; break; }
      t += 0.12 + t * 0.004;
    }
    // Still underground: this pixel is deep behind nearer terrain — leave it to that layer.
    if (!clear) return 0.0;
    for (int i = 0; i < 260; i++) {
      if (float(i) >= uSteps) break;
      vec3 p = RO + rd * t;
      float d = p.y - terrain(p.xz, 6);
      if (d < 0.0018 * t) return 1.0;
      t += 0.42 * max(d, 0.002);
      if (t > FAR) break;
    }
    return 0.0;
  }

  vec4 terrainLayer() {
    vec3 rd = rayDir();
    float t;
    if (marchBand(rd, t) < 0.5) return vec4(0.0);
    vec3 p = RO + rd * t;
    // Ground beyond the band belongs to the next layer; a little overlap in front
    // keeps the layers seamless at rest and as the parallax separates them.
    if (p.z > uBand.y - 2.0) return vec4(0.0);
    vec3 col = shade(p, normalAt(p.xz, t), 1.0);
    // Aerial perspective: cooler and paler with every kilometre.
    col = mix(col, hazeColour(1.0), clamp(1.0 - exp(-t * 0.022), 0.0, 0.92));
    return vec4(col, 1.0);
  }

  vec4 fogBand() {
    float aspect = uRes.x / uRes.y;
    vec2 p = vec2(vUv.x * aspect * 2.2, vUv.y * 1.6) + uSeed;
    float n = fbm(p * vec2(0.7, 2.2) + fbm(p * 1.3) * 0.8);
    float profile = pow(sin(3.14159 * vUv.y), 1.6);
    float a = smoothstep(0.32, 0.78, n) * profile;
    vec3 col = mix(vec3(0.74, 0.78, 0.80), vec3(0.95, 0.92, 0.86), vUv.y);
    return vec4(col, a * 0.85);
  }

  // Soft, horizontal stratus veils: stretched noise, gently warped, feathered edges.
  vec4 clouds() {
    float aspect = uRes.x / uRes.y;
    vec2 p = vec2(vUv.x * aspect * 0.9, vUv.y * 2.6) + uSeed;
    float warp = fbm(p * vec2(0.6, 1.4) + 3.1);
    float n = fbm(p * vec2(0.45, 1.9) + vec2(warp * 0.9, warp * 0.25));
    float profile = smoothstep(0.0, 0.4, vUv.y) * smoothstep(1.0, 0.6, vUv.y);
    float a = smoothstep(0.5, 0.82, n) * profile;
    vec3 col = mix(vec3(0.66, 0.72, 0.77), vec3(1.0, 0.97, 0.92), smoothstep(0.3, 0.8, n) * 0.6 + vUv.x * 0.25);
    return vec4(col, a * 0.5);
  }

  void main() {
    vec4 c;
    if (uMode == 0) c = vec4(morningSky(rayDir()), 1.0);
    else if (uMode == 1) c = terrainLayer();
    else if (uMode == 2) c = fogBand();
    else c = clouds();
    c.rgb = pow(max(c.rgb, 0.0), vec3(0.95)) + (hash(gl_FragCoord.xy) - 0.5) / 255.0;
    gl_FragColor = c;
  }
`;

// Distance bands in world z (the viewer stands at z = −6, the range rises beyond 30).
const BANDS: [number, number][] = [
  [30, 1e4], // distant snow peaks
  [19, 31.5], // middle-distance ridges
  [10, 20.5], // forested ridges
  [-100, 11.5], // foothills
];

const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

export async function bakeHimalaya(width: number, height: number, quality: "high" | "low"): Promise<HimalayaBake> {
  const ss = quality === "high" ? 1.35 : 1;
  const glCanvas = document.createElement("canvas");
  const renderer = new WebGLRenderer({ canvas: glCanvas, alpha: true, premultipliedAlpha: false, preserveDrawingBuffer: true, antialias: false });
  renderer.setPixelRatio(1);
  renderer.autoClear = false;
  renderer.setClearColor(0x000000, 0);

  const uniforms = {
    uRes: { value: new Vector2() },
    uMode: { value: 0 },
    uBand: { value: new Vector2() },
    uSteps: { value: quality === "high" ? 170 : 110 },
    uSeed: { value: 0 },
  };
  const material = new ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, uniforms, depthTest: false, depthWrite: false });
  const mesh = new Mesh(new PlaneGeometry(2, 2), material);
  mesh.frustumCulled = false;
  const scene = new Scene().add(mesh);
  const camera = new OrthographicCamera();

  const render = async (w: number, h: number, mode: number, setup: () => void = () => {}) => {
    const W = Math.round(w * ss), H = Math.round(h * ss);
    renderer.setSize(W, H, false);
    uniforms.uRes.value.set(W, H);
    uniforms.uMode.value = mode;
    setup();
    renderer.setScissorTest(false);
    renderer.clear();
    renderer.setScissorTest(true);
    // Short GPU calls only: a long full-screen raymarch can trip the driver watchdog.
    const n = mode === 1 ? Math.ceil((W * H) / 150_000) : 1;
    for (let i = 0; i < n; i++) {
      const y0 = Math.floor((H * i) / n), y1 = Math.floor((H * (i + 1)) / n);
      renderer.setScissor(0, y0, W, y1 - y0);
      renderer.render(scene, camera);
      if (n > 1) await frame();
    }
    renderer.setScissorTest(false);
    // Copy out at the target size (downsampling smooths the ridgelines).
    const out = document.createElement("canvas");
    out.width = w;
    out.height = h;
    const ctx = out.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(glCanvas, 0, 0, w, h);
    await frame();
    return out;
  };

  try {
    const sky = await render(width, height, 0);
    const layers: HTMLCanvasElement[] = [];
    for (const band of BANDS) layers.push(await render(width, height, 1, () => uniforms.uBand.value.set(...band)));

    // Treelines planted on the crests of the forested ridges and foothills.
    const [, , ridges, hills] = layers;
    // Stands of trees rather than a fence: density rises and falls along the crest.
    const stands = (seed: number) => (x: number) => Math.max(0, Math.sin(x / width * 23 + seed) * 0.6 + Math.sin(x / width * 61 + seed * 2) * 0.4 + 0.35);
    const ridgeStands = stands(1.3), hillStands = stands(4.1);
    drawTreeline(ridges.getContext("2d")!, width, {
      ground: crestLine(ridges),
      size: (x) => height * 0.017 * Math.min(1, ridgeStands(x) * 1.6),
      spacing: width / 300,
      colour: "rgba(58, 72, 72, 0.85)",
      seed: 11,
      blur: 0.7,
    });
    drawTreeline(hills.getContext("2d")!, width, {
      ground: crestLine(hills),
      size: (x) => height * 0.032 * Math.min(1, hillStands(x) * 1.5),
      spacing: width / 210,
      colour: "rgba(26, 38, 35, 0.96)",
      seed: 23,
      blur: 0.4,
    });

    // Foreground pines framing the valley, clear of the centre where the type sits.
    const fore = document.createElement("canvas");
    fore.width = width;
    fore.height = height;
    const fctx = fore.getContext("2d")!;
    const shade = fctx.createLinearGradient(0, height * 0.35, 0, height);
    shade.addColorStop(0, "#1a2622");
    shade.addColorStop(1, "#0b1210");
    const edge = (x: number) => {
      const u = x / width;
      return Math.max(1 - u / 0.3, (u - 0.7) / 0.3, 0);
    };
    // Close and slightly out of focus, as through a long lens.
    drawTreeline(fctx, width, {
      ground: (x) => height * (1.03 - edge(x) * 0.06),
      size: (x) => height * 0.62 * edge(x) ** 1.4,
      spacing: width / 40,
      colour: shade,
      seed: 37,
      blur: Math.max(1, width / 900),
    });
    fctx.fillStyle = "#0b1210";
    fctx.fillRect(0, height * 0.985, width, height * 0.02);
    layers.push(fore);

    const fog: HTMLCanvasElement[] = [];
    for (const seed of [1.7, 5.3, 9.1]) fog.push(await render(width, Math.round(height * 0.45), 2, () => (uniforms.uSeed.value = seed)));
    const clouds: HTMLCanvasElement[] = [];
    for (const seed of [3.2, 8.4]) clouds.push(await render(Math.round(width * 1.6), Math.round(height * 0.5), 3, () => (uniforms.uSeed.value = seed)));

    return { sky, layers, fog, clouds };
  } finally {
    material.dispose();
    mesh.geometry.dispose();
    renderer.dispose();
  }
}
