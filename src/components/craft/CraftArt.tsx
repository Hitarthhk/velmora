/**
 * Art-directed placeholder plates standing in for the craftsmanship
 * photography. Each is a single static SVG (cheap to composite) lit like a
 * film still so the motion design can be judged before the shoot happens.
 */

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function CopperArt() {
  const rivets = Array.from({ length: 15 }, (_, i) => 400 + i * 34);
  return (
    <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id="cu-bg" cx="0.42" cy="0.5" r="0.75">
          <stop offset="0" stopColor="#3d2414" />
          <stop offset="0.55" stopColor="#140c07" />
          <stop offset="1" stopColor="#060403" />
        </radialGradient>
        <linearGradient id="cu" x1="0" x2="1">
          <stop offset="0" stopColor="#3a1a0a" />
          <stop offset="0.22" stopColor="#9a4f24" />
          <stop offset="0.38" stopColor="#f2b27a" />
          <stop offset="0.5" stopColor="#c46a33" />
          <stop offset="0.8" stopColor="#6b3315" />
          <stop offset="1" stopColor="#2a1206" />
        </linearGradient>
        <linearGradient id="cu-arm" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0b07a" />
          <stop offset="0.4" stopColor="#b5602c" />
          <stop offset="1" stopColor="#3e1d0c" />
        </linearGradient>
        <linearGradient id="brass" x1="0" x2="1">
          <stop offset="0" stopColor="#5a4320" />
          <stop offset="0.4" stopColor="#e4c88c" />
          <stop offset="1" stopColor="#4a3618" />
        </linearGradient>
        <filter id="cu-soft">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <filter id="cu-haze">
          <feGaussianBlur stdDeviation="40" />
        </filter>
      </defs>
      <rect width="1600" height="1000" fill="url(#cu-bg)" />
      {/* Second still, out of focus */}
      <g filter="url(#cu-soft)" opacity="0.55">
        <ellipse cx="1300" cy="760" rx="210" ry="160" fill="url(#cu)" />
        <ellipse cx="1300" cy="590" rx="110" ry="80" fill="url(#cu)" />
        <rect x="1270" y="330" width="60" height="260" fill="url(#cu)" />
      </g>
      {/* Lyne arm */}
      <path d="M640 250 C 760 200, 1000 230, 1620 420" fill="none" stroke="url(#cu-arm)" strokeWidth="40" strokeLinecap="round" />
      {/* Neck */}
      <path d="M592 470 C 600 400, 606 330, 612 262 L 668 262 C 674 330, 680 400, 688 470 Z" fill="url(#cu)" />
      <ellipse cx="640" cy="258" rx="34" ry="14" fill="#f0b07a" opacity="0.6" />
      {/* Helmet */}
      <ellipse cx="640" cy="530" rx="160" ry="110" fill="url(#cu)" />
      {/* Pot */}
      <ellipse cx="640" cy="760" rx="290" ry="200" fill="url(#cu)" />
      <rect x="352" y="652" width="576" height="18" fill="url(#brass)" opacity="0.9" />
      {rivets.map((x) => (
        <circle key={x} cx={x + 4} cy="661" r="3.4" fill="#f6d9a6" opacity="0.8" />
      ))}
      {/* Sight glass */}
      <circle cx="560" cy="780" r="34" fill="#1b0f08" stroke="url(#brass)" strokeWidth="8" />
      <circle cx="550" cy="770" r="10" fill="#f6d9a6" opacity="0.4" />
      {/* Floor */}
      <rect x="0" y="930" width="1600" height="70" fill="#050302" />
      {/* Fire glow and steam */}
      <ellipse cx="640" cy="960" rx="420" ry="60" fill="#e07a2c" opacity="0.25" filter="url(#cu-haze)" />
      <ellipse cx="900" cy="300" rx="380" ry="120" fill="#efe9dc" opacity="0.07" filter="url(#cu-haze)" />
      {/* Key light */}
      <ellipse cx="470" cy="520" rx="220" ry="320" fill="#ffd9a6" opacity="0.12" filter="url(#cu-haze)" />
    </svg>
  );
}

export function GrainArt() {
  const r = rng(7);
  const ear = (x: number, scale: number, lean: number, key: string) => {
    const top = 1000 - 760 * scale;
    const tipX = x + lean * 120 * scale;
    const grains = [];
    for (let i = 0; i < 9; i++) {
      const t = i / 9;
      const gx = x + (tipX - x) * (0.7 + t * 0.3);
      const gy = top + 40 * scale + i * 26 * scale;
      for (const side of [-1, 1]) {
        grains.push(
          <g key={`${key}-${i}-${side}`} transform={`translate(${gx + side * 9 * scale} ${gy}) rotate(${side * 24 + lean * 10})`}>
            <ellipse rx={9 * scale} ry={20 * scale} fill="url(#barley)" />
            <line x1="0" y1={-18 * scale} x2={side * 6 * scale} y2={-110 * scale} stroke="#d9b56c" strokeWidth={1.1 * scale} opacity="0.7" />
          </g>,
        );
      }
    }
    return (
      <g key={key}>
        <path d={`M${x} 1000 Q ${x + lean * 20} ${(1000 + top) / 2} ${tipX} ${top + 30 * scale}`} stroke="#8a6a32" strokeWidth={3 * scale} fill="none" />
        {grains}
      </g>
    );
  };
  const back = Array.from({ length: 16 }, (_, i) => ear(40 + i * 100 + r() * 40, 0.7 + r() * 0.2, r() - 0.5, `b${i}`));
  const mid = Array.from({ length: 7 }, (_, i) => ear(180 + i * 210 + r() * 60, 1.05 + r() * 0.2, r() - 0.5, `m${i}`));
  const front = Array.from({ length: 3 }, (_, i) => ear(150 + i * 620 + r() * 80, 1.6, r() - 0.5, `f${i}`));
  return (
    <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id="gr-bg" cx="0.6" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#4a3c22" />
          <stop offset="0.5" stopColor="#1a150c" />
          <stop offset="1" stopColor="#080705" />
        </radialGradient>
        <linearGradient id="barley" x1="0" x2="1">
          <stop offset="0" stopColor="#7d5a24" />
          <stop offset="0.45" stopColor="#f0d293" />
          <stop offset="1" stopColor="#8c6a2e" />
        </linearGradient>
        <filter id="gr-far">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="gr-near">
          <feGaussianBlur stdDeviation="12" />
        </filter>
        <filter id="gr-glow">
          <feGaussianBlur stdDeviation="60" />
        </filter>
      </defs>
      <rect width="1600" height="1000" fill="url(#gr-bg)" />
      <ellipse cx="1050" cy="280" rx="420" ry="220" fill="#f6d9a6" opacity="0.18" filter="url(#gr-glow)" />
      <g filter="url(#gr-far)" opacity="0.45">{back}</g>
      <g>{mid}</g>
      <g filter="url(#gr-near)" opacity="0.6">{front}</g>
    </svg>
  );
}

export function OakArt() {
  const rows = [
    { y: 250, r: 118, n: 7, x0: 120 },
    { y: 500, r: 118, n: 7, x0: 60 },
    { y: 750, r: 118, n: 7, x0: 120 },
  ];
  return (
    <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id="oak-head" cx="0.4" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#8a5a30" />
          <stop offset="0.7" stopColor="#4a2c14" />
          <stop offset="1" stopColor="#24140a" />
        </radialGradient>
        <linearGradient id="oak-light" x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="beam" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe2b0" stopOpacity="0.22" />
          <stop offset="1" stopColor="#ffe2b0" stopOpacity="0" />
        </linearGradient>
        <filter id="oak-blur">
          <feGaussianBlur stdDeviation="18" />
        </filter>
      </defs>
      <rect width="1600" height="1000" fill="#120c07" />
      {rows.map((row, ri) =>
        Array.from({ length: row.n }, (_, i) => {
          const cx = row.x0 + i * 250;
          const id = `b${ri}-${i}`;
          return (
            <g key={id}>
              <clipPath id={`${id}c`}>
                <circle cx={cx} cy={row.y} r={row.r} />
              </clipPath>
              <circle cx={cx} cy={row.y} r={row.r + 10} fill="#1b120b" />
              <circle cx={cx} cy={row.y} r={row.r} fill="url(#oak-head)" />
              <g clipPath={`url(#${id}c)`} stroke="#22140a" strokeWidth="2" opacity="0.7">
                {Array.from({ length: 7 }, (_, s) => (
                  <line key={s} x1={cx - row.r + (s + 1) * 30} y1={row.y - row.r} x2={cx - row.r + (s + 1) * 30} y2={row.y + row.r} />
                ))}
              </g>
              <circle cx={cx} cy={row.y} r={row.r + 4} fill="none" stroke="#0b0806" strokeWidth="9" />
              <circle cx={cx} cy={row.y} r={row.r - 14} fill="none" stroke="#2a190c" strokeWidth="2" opacity="0.6" />
              <circle cx={cx + 20} cy={row.y + 40} r="9" fill="#1a0f07" />
            </g>
          );
        }),
      )}
      <rect width="1600" height="1000" fill="url(#oak-light)" />
      <polygon points="80,0 520,0 1300,1000 600,1000" fill="url(#beam)" filter="url(#oak-blur)" />
    </svg>
  );
}
