export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 128, g: 128, b: 128 };
}

export function hexToHsl(hex: string): [number, number, number] {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = (gn - bn) / d + (gn < bn ? 6 : 0); break;
      case gn: h = (bn - rn) / d + 2; break;
      case bn: h = (rn - gn) / d + 4; break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(255 * Math.max(0, Math.min(1, color))).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function hexToRgbString(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${r}, ${g}, ${b})`;
}

export function hexToHslString(hex: string): string {
  const [h, s, l] = hexToHsl(hex);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

// Generate 7-shade chromatic scale: dark → bright
export function generateTonalities(hex: string): string[] {
  const [h, s, l] = hexToHsl(hex);
  return [
    hslToHex(h, Math.min(s + 15, 100), Math.max(l * 0.12, 6)),
    hslToHex(h, Math.min(s + 10, 100), Math.max(l * 0.28, 12)),
    hslToHex(h, Math.min(s + 5, 100), l * 0.48),
    hslToHex(h, s, l * 0.68),
    hslToHex(h, s, l),
    hslToHex(h, Math.max(s - 10, 25), Math.min(l * 1.28 + 4, 88)),
    hslToHex(h, Math.max(s - 22, 14), Math.min(l * 1.58 + 8, 95)),
  ];
}

export function getContrastColor(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#000000' : '#FFFFFF';
}

export function getColorName(hex: string): string {
  const [h, s, l] = hexToHsl(hex);
  if (l < 12) return 'Obsidian';
  if (l > 90) return 'Pearl';
  if (s < 12) {
    if (l < 30) return 'Charcoal';
    if (l < 60) return 'Ash';
    return 'Silver';
  }
  if (h < 15 || h >= 345) return l > 58 ? 'Blush' : 'Crimson';
  if (h < 30) return l > 55 ? 'Salmon' : 'Rust';
  if (h < 50) return l > 60 ? 'Peach' : 'Ember';
  if (h < 70) return l > 70 ? 'Champagne' : 'Amber';
  if (h < 85) return 'Citron';
  if (h < 130) return l > 55 ? 'Sage' : 'Forest';
  if (h < 160) return 'Seafoam';
  if (h < 195) return 'Teal';
  if (h < 220) return 'Azure';
  if (h < 250) return l > 50 ? 'Cornflower' : 'Cobalt';
  if (h < 280) return l > 55 ? 'Lavender' : 'Indigo';
  if (h < 320) return l > 55 ? 'Orchid' : 'Plum';
  return l > 55 ? 'Rose' : 'Magenta';
}

// Color zones for simulated image sampling
const SUNSET_ZONES: Array<[number, number, number, number, string]> = [
  [0, 33, 0, 35, '#2D1B69'],
  [33, 67, 0, 30, '#7B2D8B'],
  [67, 100, 0, 35, '#C2185B'],
  [0, 30, 35, 65, '#6A1B9A'],
  [30, 70, 30, 60, '#E91E63'],
  [70, 100, 35, 65, '#FF7043'],
  [0, 35, 65, 100, '#FFB300'],
  [35, 65, 60, 100, '#FF8F00'],
  [65, 100, 65, 100, '#FFD54F'],
];

const FLOWER_ZONES: Array<[number, number, number, number, string]> = [
  [0, 35, 0, 40, '#E53935'],
  [35, 70, 0, 35, '#FB8C00'],
  [65, 100, 0, 45, '#FDD835'],
  [0, 30, 40, 75, '#9C2626'],
  [30, 65, 38, 70, '#E91E63'],
  [62, 100, 42, 72, '#7CB342'],
  [0, 45, 72, 100, '#A1887F'],
  [45, 100, 72, 100, '#CE93D8'],
];

// Sample average color from a canvas context at position (cx, cy) with given radius
export function samplePixelColor(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius = 4,
  canvasWidth = ctx.canvas.width,
  canvasHeight = ctx.canvas.height
): string {
  const x1 = Math.max(0, cx - radius);
  const y1 = Math.max(0, cy - radius);
  const w = Math.min(canvasWidth - 1, cx + radius) - x1 + 1;
  const h = Math.min(canvasHeight - 1, cy + radius) - y1 + 1;
  if (w <= 0 || h <= 0) return "#888888";
  const data = ctx.getImageData(x1, y1, w, h);
  let r = 0, g = 0, b = 0;
  const count = data.data.length / 4;
  for (let i = 0; i < data.data.length; i += 4) {
    r += data.data[i];
    g += data.data[i + 1];
    b += data.data[i + 2];
  }
  const toHex = (n: number) => Math.round(n / count).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function sampleColorFromPosition(x: number, y: number, source: 'camera' | 'photo'): string {
  const zones = source === 'camera' ? SUNSET_ZONES : FLOWER_ZONES;
  for (const [x1, x2, y1, y2, color] of zones) {
    if (x >= x1 && x < x2 && y >= y1 && y < y2) return color;
  }
  return source === 'camera' ? '#7B2D8B' : '#E91E63';
}

export const DEMO_PALETTES = [
  {
    id: 'p1',
    name: 'Golden Hour',
    colors: ['#2D1B69', '#7B2D8B', '#E91E63', '#FF7043', '#FFB300'],
    date: 'Today',
    source: 'camera' as const,
  },
  {
    id: 'p2',
    name: 'Flower Market',
    colors: ['#E53935', '#FB8C00', '#FDD835', '#E91E63', '#7CB342'],
    date: 'Yesterday',
    source: 'photo' as const,
  },
  {
    id: 'p3',
    name: 'Electric Night',
    colors: ['#1A237E', '#6A1B9A', '#AD1457', '#F57F17', '#00838F'],
    date: '2 days ago',
    source: 'camera' as const,
  },
];
