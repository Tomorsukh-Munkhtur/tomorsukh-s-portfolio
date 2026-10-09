const HEX = /^#([0-9a-f]{6})$/i;

export const isHexColor = (value: string) => HEX.test(value);

function luminance(hex: string) {
  const n = Number.parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Optional accent colour from the admin settings (buttons, pills, selection).
 * Empty means monochrome: the accent is then simply the text colour.
 * Returns the colour and a readable text colour to put on it.
 */
export function accentPalette(input: string) {
  if (!isHexColor(input)) return null;
  const accent = input.toLowerCase();
  return { accent, onAccent: luminance(accent) > 0.4 ? "#111111" : "#ffffff" };
}
