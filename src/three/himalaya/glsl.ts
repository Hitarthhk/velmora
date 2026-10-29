/**
 * Shared GLSL for the procedural Himalaya: noise, the ridged terrain, the
 * viewpoint and the morning light. Used by the age-gate night scene and the
 * hero's baked layers, so the gateway dissolves into the same range.
 *
 * Consumers define `float terrain(vec2 p, int oct)` (usually wrapping
 * `terrainBase`) after including this chunk.
 */
export const himalayaGLSL = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform vec2 uRes;
  const float FAR = 160.0;

  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  const mat2 M = mat2(1.6, 1.2, -1.2, 1.6);
  float fbm(vec2 p) { float h = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { h += a * noise(p); p = M * p; a *= 0.5; } return h; }

  // Ridged multifractal: sharp crests that read as eroded rock and snow arêtes.
  float ridged(vec2 p, int oct) {
    float h = 0.0, a = 0.5, w = 1.0;
    for (int i = 0; i < 9; i++) {
      if (i >= oct) break;
      float n = 1.0 - abs(noise(p) * 2.0 - 1.0);
      n *= n * w;
      h += a * n;
      w = clamp(n * 1.8, 0.0, 1.0);
      p = M * p;
      a *= 0.5;
    }
    return h;
  }

  // World: x right, y up, z away from the viewer. Foothills near, a high range far.
  float terrainBase(vec2 p, int oct) {
    float far = smoothstep(9.0, 46.0, p.y);
    float h = ridged(p * vec2(0.075, 0.06) + vec2(3.1, 0.0), oct);
    h = h * mix(2.4, 11.5, far) + far * 2.4;
    // Layered foothills: long forested ridges stepping back toward the range.
    float near = 1.0 - far;
    h += near * 0.9 * smoothstep(0.35, 1.0, sin(p.y * 0.42 + p.x * 0.05 + noise(p * 0.2) * 1.5) * 0.5 + 0.5);
    // Open the valley floor in front of the viewer.
    h -= near * 1.6 * exp(-p.x * p.x * 0.01);
    return h;
  }

  float terrain(vec2 p, int oct);

  vec3 normalAt(vec2 p, float t) {
    float e = 0.0025 * t + 0.002;
    float h = terrain(p, 8);
    return normalize(vec3(h - terrain(p + vec2(e, 0), 8), e, h - terrain(p + vec2(0, e), 8)));
  }

  float march(vec3 ro, vec3 rd, float steps, out float t) {
    t = 0.4;
    for (int i = 0; i < 260; i++) {
      if (float(i) >= steps) break;
      vec3 p = ro + rd * t;
      float d = p.y - terrain(p.xz, 6);
      if (d < 0.0018 * t) return 1.0;
      t += 0.42 * d;
      if (t > FAR) break;
    }
    return 0.0;
  }

  float shadow(vec3 ro, vec3 rd) {
    float res = 1.0, t = 0.15;
    for (int i = 0; i < 32; i++) {
      vec3 p = ro + rd * t;
      float d = p.y - terrain(p.xz, 4);
      res = min(res, 10.0 * d / t);
      if (res < 0.01) break;
      t += clamp(d, 0.08, 1.2);
    }
    return clamp(res, 0.0, 1.0);
  }

  // A long lens from the valley floor: compression makes the range loom.
  const vec3 RO = vec3(0.0, 1.7, -6.0);
  vec3 rayDir() {
    vec2 uv = (vUv * 2.0 - 1.0) * vec2(uRes.x / uRes.y, 1.0);
    vec3 fw = normalize(vec3(0.0, 4.6, 40.0) - RO);
    vec3 rt = normalize(cross(vec3(0, 1, 0), fw));
    vec3 up = cross(fw, rt);
    return normalize(uv.x * rt + uv.y * up + 2.7 * fw);
  }

  // ---- Light ----
  const vec3 MOON = vec3(-0.5508, 0.4206, 0.7210);
  // Low morning sun from the right: raking light that draws out every ridge.
  const vec3 SUN = vec3(0.8992, 0.4150, -0.1383);

  vec3 nightSky(vec3 rd) {
    float y = max(rd.y, 0.0);
    vec3 c = mix(vec3(0.075, 0.105, 0.135), vec3(0.018, 0.028, 0.040), pow(y, 0.55));
    float m = max(dot(rd, MOON), 0.0);
    return c + vec3(0.20, 0.24, 0.30) * pow(m, 1400.0) + vec3(0.035, 0.045, 0.06) * pow(m, 60.0);
  }

  // Morning: pale warm horizon, glacier blue overhead, deep mountain blue at the zenith.
  vec3 morningSky(vec3 rd) {
    float y = max(rd.y, 0.0);
    vec3 c = mix(vec3(0.86, 0.80, 0.70), vec3(0.58, 0.67, 0.73), smoothstep(0.0, 0.14, y));
    c = mix(c, vec3(0.20, 0.30, 0.37), smoothstep(0.12, 0.55, y));
    vec2 az = normalize(rd.xz), sz = normalize(SUN.xz);
    float glow = pow(max(dot(az, sz), 0.0), 3.0) * (1.0 - smoothstep(0.0, 0.35, y));
    return c + vec3(0.34, 0.20, 0.07) * glow * 0.6;
  }

  /** Lit terrain without haze. day: 0 = moonlight, 1 = morning sun. */
  vec3 shade(vec3 p, vec3 n, float day) {
    float alt = p.y + (fbm(p.xz * 0.9) - 0.5) * 1.1;
    float snow = smoothstep(3.3, 4.6, alt) * smoothstep(0.3, 0.66, n.y);
    float forest = (1.0 - smoothstep(2.0, 3.2, p.y)) * smoothstep(0.45, 0.8, n.y);
    vec3 rock = vec3(0.075, 0.085, 0.095) * (0.75 + 0.5 * fbm(p.xz * 3.0));
    // Forest canopy reads as fine dark texture, not flat fill.
    vec3 canopy = vec3(0.028, 0.045, 0.038) * (0.6 + 0.8 * noise(p.xz * 18.0));
    vec3 alb = mix(rock, canopy, forest);
    alb = mix(alb, vec3(0.80, 0.85, 0.90), snow);

    vec3 L = normalize(mix(MOON, SUN, day));
    vec3 lightCol = mix(vec3(0.46, 0.56, 0.72) * 1.75, vec3(1.0, 0.76, 0.52) * 2.1, day);
    vec3 amb = mix(vec3(0.035, 0.05, 0.07), vec3(0.20, 0.26, 0.32), day);
    float dif = clamp(dot(n, L), 0.0, 1.0);
    float sh = dif > 0.001 ? shadow(p + n * 0.02, L) : 0.0;
    // Snow in shadow still glows with skylight; rock and forest do not.
    return alb * (lightCol * dif * sh + amb * (0.55 + 0.45 * n.y) * (1.0 + snow * 1.8));
  }

  vec3 hazeColour(float day) { return mix(vec3(0.055, 0.08, 0.10), vec3(0.62, 0.68, 0.72), day); }
`;
