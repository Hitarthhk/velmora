import { Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2, WebGLRenderer } from "three";

/**
 * The route transition's whisky pour: one full-screen shader. Amber liquid
 * swells out from where the visitor clicked, its edge lit like a meniscus,
 * slow currents turning inside it; then the level drains away with a
 * rippling surface to reveal the new page. Created once, reused for every
 * navigation, and rendered only while a transition runs.
 */
const fragment = /* glsl */ `
precision highp float;
uniform vec2 uRes;
uniform vec2 uOrigin;
uniform float uCover;
uniform float uDrain;
uniform float uTime;
varying vec2 vUv;

// fract-only hash: stable precision on mobile GPUs (no large sin() arguments).
float hash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = vUv;
  float aspect = uRes.x / uRes.y;
  vec2 q = vec2(uv.x * aspect, uv.y);
  float t = uTime;

  // Whisky in motion: slow, domain-warped currents.
  vec2 warp = vec2(fbm(q * 1.5 + t * 0.06), fbm(q * 1.5 - t * 0.05 + 4.0));
  float body = fbm(q * 2.1 + warp * 1.5 + t * 0.035);

  // I · The pour spreads from the click.
  vec2 o = vec2(uOrigin.x * aspect, uOrigin.y);
  float far = max(max(length(o), length(o - vec2(aspect, 0.0))), max(length(o - vec2(0.0, 1.0)), length(o - vec2(aspect, 1.0))));
  float radius = mix(-0.15, far + 0.3, uCover);
  float spread = radius - length(q - o) + (fbm(q * 3.2 + t * 0.35) - 0.5) * 0.24;

  // II · The level falls, its surface rippling, to reveal the page.
  float level = mix(1.3, -0.3, uDrain);
  float swell = sin(uv.x * 8.0 + t * 2.4) * 0.016 + sin(uv.x * 19.0 - t * 3.1) * 0.006;
  float surface = level + (swell + (fbm(vec2(uv.x * 3.5, t * 0.45)) - 0.5) * 0.09) * (1.0 - abs(uDrain * 2.0 - 1.0) * 0.6);
  float fill = surface - uv.y;

  float inside = uDrain > 0.0 ? fill : spread;
  float mask = smoothstep(0.0, 0.01, inside);
  float rim = exp(-abs(inside) * 70.0);

  vec3 deep = vec3(0.085, 0.038, 0.014);
  vec3 amber = vec3(0.70, 0.37, 0.10);
  vec3 gold = vec3(0.98, 0.80, 0.46);
  vec3 col = mix(deep, amber, smoothstep(0.28, 0.86, body) * 0.72);
  col += gold * pow(smoothstep(0.58, 0.92, body), 3.0) * 0.28;         // caustics
  col = mix(col, amber * 1.25, smoothstep(0.09, 0.0, inside) * mask * 0.55); // meniscus
  col *= 0.7 + 0.4 * (1.0 - length(uv - 0.5));                       // vignette
  col = mix(col, gold, rim * 0.9);

  float alpha = clamp(max(mask, rim * 0.85), 0.0, 1.0);
  gl_FragColor = vec4(col * alpha, alpha);
}`;

const vertex = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

export type Pour = {
  render: (cover: number, drain: number, origin: { x: number; y: number }, time: number) => void;
  resize: () => void;
  dispose: () => void;
};

export function createPour(canvas: HTMLCanvasElement): Pour {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  const uniforms = {
    uRes: { value: new Vector2(1, 1) },
    uOrigin: { value: new Vector2(0.5, 0.5) },
    uCover: { value: 0 },
    uDrain: { value: 0 },
    uTime: { value: 0 },
  };
  const material = new ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, uniforms, transparent: true, depthTest: false, depthWrite: false });
  const geometry = new PlaneGeometry(2, 2);
  const scene = new Scene();
  scene.add(new Mesh(geometry, material));
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const resize = () => {
    // The liquid is soft: two-thirds resolution, upscaled, costs half the pixels.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5) * 0.66);
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    uniforms.uRes.value.set(window.innerWidth, window.innerHeight);
  };
  resize();
  // Compile now (during idle warm-up), not on the first visible frame.
  renderer.compile(scene, camera);

  return {
    render(cover, drain, origin, time) {
      uniforms.uCover.value = cover;
      uniforms.uDrain.value = drain;
      uniforms.uOrigin.value.set(origin.x, origin.y);
      uniforms.uTime.value = time;
      renderer.render(scene, camera);
    },
    resize,
    dispose() {
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
