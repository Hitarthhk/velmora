/**
 * Liquid-edge clip-path. Returns a polygon whose leading edge is a travelling
 * wave — used for whisky-inspired scene transitions.
 *
 * progress 0 → fully hidden, 1 → fully revealed (wave sweeps bottom → top).
 */
export function liquidClip(progress: number, { amplitude = 6, waves = 1.6, phase = 0, points = 28 } = {}) {
  const p = Math.min(1, Math.max(0, progress));
  // Amplitude swells mid-transition and settles flat at both ends.
  const amp = amplitude * Math.sin(p * Math.PI);
  const base = 100 - p * (100 + amplitude) + (p === 1 ? -amplitude : 0);
  const edge: string[] = [];
  for (let i = 0; i <= points; i++) {
    const x = (i / points) * 100;
    const y = base + Math.sin((i / points) * Math.PI * 2 * waves + phase + p * 5) * amp;
    edge.push(`${x.toFixed(2)}% ${Math.max(-10, Math.min(110, y)).toFixed(2)}%`);
  }
  return `polygon(${edge.join(", ")}, 100% 110%, 0% 110%)`;
}
