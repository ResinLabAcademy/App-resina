// Diseño vectorial de respaldo: si el proveedor de imágenes por IA no responde
// (red bloqueada, rate-limit, timeout), generamos una composición abstracta en
// SVG con la paleta de la marca, para que el ebook nunca se vea "roto" o
// genérico. Se ve intencional, no como un error.

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateFallbackArt({ colors, seed = 1, width = 1024, height = 1536 }) {
  const rnd = mulberry32(seed);
  const blobs = Array.from({ length: 5 }, () => ({
    cx: Math.round(rnd() * width),
    cy: Math.round(rnd() * height),
    r: Math.round(width * (0.28 + rnd() * 0.32)),
    opacity: (0.18 + rnd() * 0.22).toFixed(2)
  }));

  const waveY = Math.round(height * (0.55 + rnd() * 0.15));

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${colors.soft}"/>
      <stop offset="100%" stop-color="${colors.paper}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="35%" r="75%">
      <stop offset="0%" stop-color="${colors.accent}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${colors.accent}" stop-opacity="0"/>
    </radialGradient>
    <filter id="blur1"><feGaussianBlur stdDeviation="${Math.round(width * 0.045)}"/></filter>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect width="${width}" height="${height}" fill="url(#glow)"/>
  <g filter="url(#blur1)">
    ${blobs
      .map(
        (b) =>
          `<circle cx="${b.cx}" cy="${b.cy}" r="${b.r}" fill="${colors.primary}" opacity="${b.opacity}"/>`
      )
      .join("\n    ")}
  </g>
  <path d="M0 ${waveY} C ${width * 0.25} ${waveY - 90}, ${width * 0.75} ${waveY + 90}, ${width} ${waveY} L ${width} ${height} L 0 ${height} Z"
        fill="${colors.primary}" opacity="0.14"/>
  <path d="M0 ${waveY + 60} C ${width * 0.3} ${waveY - 40}, ${width * 0.7} ${waveY + 160}, ${width} ${waveY + 60} L ${width} ${height} L 0 ${height} Z"
        fill="${colors.accent}" opacity="0.16"/>
</svg>`.trim();
}
