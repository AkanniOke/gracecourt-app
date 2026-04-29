export const GraceCourtLightColors = {
  background: '#0A2E73',
  surface: '#FFFFFF',
  textPrimary: '#111111',
  textSecondary: '#22304D',
  textMuted: '#6F7E97',
  textSoft: '#D7E2F7',
  tintSurface: '#EEF3FC',
  tintSurfaceAlt: '#F6F8FD',
  border: '#D7E2F7',
  accent: '#0A2E73',
  accentSoft: '#5E739B',
  iconSurface: '#E9F0FB',
} as const;

export const GraceCourtDarkColors = {
  background: '#061836',
  surface: '#0F1E38',
  textPrimary: '#FFFFFF',
  textSecondary: '#D7E2F7',
  textMuted: '#9EAED0',
  textSoft: '#D7E2F7',
  tintSurface: '#19335C',
  tintSurfaceAlt: '#132948',
  border: '#2B4772',
  accent: '#8FB8FF',
  accentSoft: '#B5C7E7',
  iconSurface: '#19335C',
} as const;

export const GraceCourtColorPalettes = {
  dark: GraceCourtDarkColors,
  light: GraceCourtLightColors,
} as const;

export type GraceCourtThemeName = keyof typeof GraceCourtColorPalettes;
export type GraceCourtColorPalette = (typeof GraceCourtColorPalettes)[GraceCourtThemeName];

export const GraceCourtColors = GraceCourtLightColors;

export const GraceCourtRadius = {
  large: 24,
  card: 22,
  medium: 18,
  pill: 999,
  icon: 20,
} as const;

export const GraceCourtSpacing = {
  screenX: 20,
  screenTop: 28,
  screenBottom: 36,
  section: 20,
  stack: 16,
  tight: 12,
  cardPadding: 20,
} as const;

export const GraceCourtShadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  subtle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  accent: {
    shadowColor: '#0A2E73',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 4,
  },
} as const;
