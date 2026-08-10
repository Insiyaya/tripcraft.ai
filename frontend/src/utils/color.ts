/**
 * Pick a readable label colour for text sitting on an arbitrary swatch.
 *
 * Day colours are chosen for identity (distinguishable hues, colourblind-safe
 * separation), which pulls them toward mid lightness — and mid-lightness fills
 * are exactly where a hardcoded white label fails WCAG. Our cyan slot sits at
 * 3.68:1 against white, below the 4.5:1 needed for the 12px labels we put on it.
 *
 * Deriving the ink from the swatch keeps that guarantee independent of the
 * palette, so re-tuning day colours later can't silently break contrast.
 */

const INK_DARK = '#2A1D0F';
const INK_LIGHT = '#FFFFFF';

function channels(hex: string): [number, number, number] {
  const s = hex.replace('#', '').trim();
  const full =
    s.length === 3
      ? s
          .split('')
          .map((c) => c + c)
          .join('')
      : s;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255) as [
    number,
    number,
    number,
  ];
}

/** WCAG relative luminance. */
function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4),
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** The better-contrasting of white or near-black ink for `background`. */
export function readableInkOn(background: string): string {
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(background.trim())) return INK_LIGHT;
  return contrastRatio(INK_LIGHT, background) >= contrastRatio(INK_DARK, background)
    ? INK_LIGHT
    : INK_DARK;
}
