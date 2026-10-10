import type { CompanyConfig, HeaderFontId, HeaderStyle } from '../types';

export const HEADER_FONTS: { id: HeaderFontId; label: string; css: string }[] = [
  { id: 'arial', label: 'Arial', css: 'Arial, Helvetica, sans-serif' },
  { id: 'times', label: 'Times New Roman', css: '"Times New Roman", Times, serif' },
  { id: 'georgia', label: 'Georgia', css: 'Georgia, "Times New Roman", serif' },
  { id: 'verdana', label: 'Verdana', css: 'Verdana, Geneva, sans-serif' },
  { id: 'trebuchet', label: 'Trebuchet MS', css: '"Trebuchet MS", Arial, sans-serif' },
  { id: 'courier', label: 'Courier New', css: '"Courier New", Courier, monospace' },
];

/** The standard look: bold 18pt name, small regular lines, 128px logo. */
export const DEFAULT_HEADER_STYLE: HeaderStyle = {
  nameFont: 'arial',
  nameSizePt: 18,
  nameBold: true,
  nameItalic: false,
  detailSizePt: 10,
  detailBold: false,
  logoHeightPx: 128,
};

const clamp = (n: unknown, lo: number, hi: number, fallback: number) =>
  typeof n === 'number' && Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback;

/** Fills in anything missing or out of range, so old saved profiles keep working. */
export const resolveHeaderStyle = (config?: Partial<CompanyConfig> | null): HeaderStyle => {
  const s: Partial<HeaderStyle> = config?.headerStyle ?? {};
  const d = DEFAULT_HEADER_STYLE;
  return {
    nameFont: HEADER_FONTS.some((f) => f.id === s.nameFont) ? (s.nameFont as HeaderFontId) : d.nameFont,
    nameSizePt: clamp(s.nameSizePt, 10, 36, d.nameSizePt),
    nameBold: typeof s.nameBold === 'boolean' ? s.nameBold : d.nameBold,
    nameItalic: typeof s.nameItalic === 'boolean' ? s.nameItalic : d.nameItalic,
    detailSizePt: clamp(s.detailSizePt, 7, 14, d.detailSizePt),
    detailBold: typeof s.detailBold === 'boolean' ? s.detailBold : d.detailBold,
    logoHeightPx: clamp(s.logoHeightPx, 40, 220, d.logoHeightPx),
  };
};

export const fontCss = (id: HeaderFontId) => (HEADER_FONTS.find((f) => f.id === id) ?? HEADER_FONTS[0]).css;