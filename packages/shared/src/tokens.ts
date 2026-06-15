// ─── Color Tokens ────────────────────────────────────────────────────────────

export const colors = {
  // Brand — warm amber/gold
  brand: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // Neutrals — warm gray
  neutral: {
    0: '#ffffff',
    50: '#fafaf9',
    100: '#f5f5f4',
    200: '#e7e5e4',
    300: '#d6d3d1',
    400: '#a8a29e',
    500: '#78716c',
    600: '#57534e',
    700: '#44403c',
    800: '#292524',
    900: '#1c1917',
    950: '#0c0a09',
  },

  // Semantic
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
  },
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
  },
  error: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },
  info: {
    50: '#eff6ff',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },

  // Order status colors
  status: {
    pending: '#f59e0b',
    accepted: '#3b82f6',
    preparing: '#8b5cf6',
    ready: '#22c55e',
    completed: '#78716c',
    cancelled: '#ef4444',
  },
} as const;

// ─── Semantic Surface Aliases ─────────────────────────────────────────────────

export const surface = {
  background: colors.neutral[50],
  card: colors.neutral[0],
  cardBorder: colors.neutral[200],
  cardElevated: colors.neutral[0],
  overlay: 'rgba(28, 25, 23, 0.5)',
  sidebar: colors.neutral[900],
  sidebarActive: colors.neutral[800],
  sidebarBorder: colors.neutral[800],
} as const;

export const text = {
  primary: colors.neutral[900],
  secondary: colors.neutral[500],
  tertiary: colors.neutral[400],
  inverse: colors.neutral[0],
  brand: colors.brand[700],
  link: colors.brand[600],
} as const;

export const border = {
  default: colors.neutral[200],
  strong: colors.neutral[300],
  focus: colors.brand[500],
  error: colors.error[500],
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

export const fontFamily = {
  display: 'PlayfairDisplay_700Bold',
  displayItalic: 'PlayfairDisplay_700Bold_Italic',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  mono: 'SpaceMono_400Regular',
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
} as const;

export const lineHeight = {
  tight: 1.2,
  snug: 1.35,
  normal: 1.5,
  relaxed: 1.65,
} as const;

export const letterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1,
  widest: 2,
} as const;

// ─── Spacing Scale ────────────────────────────────────────────────────────────

export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
} as const;

// ─── Radius ───────────────────────────────────────────────────────────────────

export const radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
} as const;

// ─── Shadow / Elevation ───────────────────────────────────────────────────────

export const shadow = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  xl: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
} as const;

// ─── Breakpoints (web) ────────────────────────────────────────────────────────

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// ─── Layout ───────────────────────────────────────────────────────────────────

export const layout = {
  sidebarWidth: 240,
  headerHeight: 64,
  maxContentWidth: 1200,
  cardPadding: spacing[5],
  pagePadding: spacing[6],
  sectionGap: spacing[6],
  cardGap: spacing[4],
} as const;

// ─── Animation ────────────────────────────────────────────────────────────────

export const animation = {
  durationFast: 150,
  durationBase: 200,
  durationSlow: 300,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

// ─── Z-Index ──────────────────────────────────────────────────────────────────

export const zIndex = {
  base: 0,
  raised: 10,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  toast: 500,
} as const;
