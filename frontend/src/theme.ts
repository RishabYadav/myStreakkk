/** Semantic design tokens — 8px grid, WCAG AA oriented */

export const colors = {
  // Legacy aliases (kept for gradual migration)
  canvas: '#F8FAFC',
  canvasAlt: '#F8FAFC',
  heroStart: '#2563EB',
  heroMid: '#1D4ED8',
  heroEnd: '#1E3A8A',
  heroLegacyStart: '#2563EB',
  heroLegacyEnd: '#1E3A8A',
  royalDeep: '#1E3A8A',
  royalMid: '#1D4ED8',
  royalDark: '#1E40AF',
  customerGreen: '#059669',
  customerGreenDark: '#065F46',
  brandBlue: '#2563EB',
  white: '#FFFFFF',
  accent: '#FF6A3D',
  gold: '#E8A317',
  goldLight: '#FDE68A',
  goldDark: '#C98A0E',
  mint: '#059669',
  red: '#DC2626',
  amber: '#D97706',
  navy: '#0F172A',
  body: '#475569',
  purpleTag: '#E8E0F5',
  purpleTagText: '#6B5B95',
  orangeTag: '#FFF0E5',
  orangeTagText: '#E87A2E',

  surface: {
    canvas: '#F8FAFC',
    canvasTint: '#EEF2FF',
    card: '#FFFFFF',
    overlay: 'rgba(15, 23, 42, 0.48)',
  },
  partner: {
    hero: ['#2563EB', '#1D4ED8', '#1E3A8A'] as const,
    accent: '#2563EB',
    accentSoft: '#EFF6FF',
  },
  customer: {
    hero: ['#065F46', '#0D9488', '#047857'] as const,
    accent: '#059669',
    accentSoft: '#ECFDF5',
  },
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    tertiary: '#64748B',
    inverse: '#FFFFFF',
    inverseMuted: 'rgba(255,255,255,0.75)',
  },
  border: {
    default: '#E2E8F0',
    subtle: '#F1F5F9',
    focus: '#2563EB',
  },
  status: {
    success: '#059669',
    successSoft: '#D1FAE5',
    warning: '#D97706',
    warningSoft: '#FEF3C7',
    error: '#DC2626',
    errorSoft: '#FEE2E2',
  },
};

export const fonts = {
  heading: 'Sora_700Bold',
  headingExtra: 'Sora_800ExtraBold',
  body: 'PlusJakartaSans_500Medium',
  bodySemi: 'PlusJakartaSans_600SemiBold',
  bodyBold: 'PlusJakartaSans_700Bold',
};

export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 32,
  8: 40,
  9: 48,
  10: 56,
  11: 64,
};

/** @deprecated use space */
export const spacing = {
  xs: space[1],
  sm: space[2],
  md: space[4],
  lg: space[5],
  xl: space[6],
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  sheet: 28,
  pill: 999,
};

export const type = {
  display: { fontSize: 32, lineHeight: 38, fontFamily: fonts.headingExtra, letterSpacing: -0.5 },
  title: { fontSize: 22, lineHeight: 28, fontFamily: fonts.headingExtra, letterSpacing: -0.3 },
  heading: { fontSize: 17, lineHeight: 24, fontFamily: fonts.heading, letterSpacing: -0.2 },
  body: { fontSize: 15, lineHeight: 22, fontFamily: fonts.body },
  bodySm: { fontSize: 13, lineHeight: 18, fontFamily: fonts.body },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: fonts.bodyBold,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  caption: { fontSize: 12, lineHeight: 16, fontFamily: fonts.body },
};

export const touch = {
  min: 44,
};

export const shadows = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardLifted: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  nav: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  button: {
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
};
