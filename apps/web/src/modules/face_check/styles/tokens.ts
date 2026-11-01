export const brand = {
  magenta: {
    50: '#FEEBF4',
    100: '#FDD1E6',
    200: '#FBA4CD',
    300: '#F976B4',
    400: '#F63F95',
    500: '#F30274',
    600: '#CC0261',
    700: '#A5014F',
    800: '#83013F',
    900: '#61012E',
  },
  graphite: {
    50: '#EDEEEF',
    100: '#D7D8DA',
    200: '#AFB1B5',
    300: '#878A90',
    400: '#565A62',
    500: '#212631',
    600: '#1C2029',
    700: '#161A21',
    800: '#12151A',
    900: '#0D0F14',
  },
  neutral: {
    50: '#EEEFF0',
    100: '#E5E7EA',
    200: '#D4D7DC',
    300: '#BCC2CB',
    400: '#9CA5B3',
    500: '#617086',
    600: '#505C6F',
    700: '#404B5A',
    800: '#333B47',
    900: '#262C35',
  },
  semantic: {
    success: '#12A150',
    warning: '#E0A11B',
    error: '#E5484D',
    info: '#3B82F6',
  },
} as const

export const supportColor = {
  infoSoft: '#EAF2FF',
  warningSoft: '#FFF7DD',
  successSoft: '#E7F7EE',
  errorSoft: '#FDEBEC',
  orange: '#F97316',
  orangeSoft: '#FFF0E6',
} as const

export const semanticInk = {
  errorText: '#C4242A',
  warningIcon: '#B07D0F',
} as const

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const

export const motion = {
  transition: {
    interactive: 'background-color 160ms ease, color 160ms ease, transform 160ms ease',
    card: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
    progressStep: 'width 280ms cubic-bezier(0.22, 1, 0.36, 1), background-color 220ms ease',
    guide: 'stroke 220ms ease, border-color 220ms ease, background-color 220ms ease',
  },
} as const

export const iconSize = {
  xs: 15,
  sm: 16,
  md: 17,
  lg: 18,
  xl: 22,
} as const

export const surface = {
  app: '#F7F8FA',
  paper: '#FFFFFF',
  dark: brand.graphite[500],
  darkDeep: brand.graphite[900],
  lightText: '#FFFFFF',
  darkText: brand.graphite[500],
  darkModeText: '#F2F3F5',
  darkDivider: '#1E242E',
} as const

export const alpha = {
  white: {
    8: 'rgba(255,255,255,0.08)',
    12: 'rgba(255,255,255,0.12)',
    18: 'rgba(255,255,255,0.18)',
    50: 'rgba(255,255,255,0.5)',
    62: 'rgba(255,255,255,0.62)',
    72: 'rgba(255,255,255,0.72)',
  },
  graphite: {
    6: 'rgba(33, 38, 49, 0.06)',
    8: 'rgba(33,38,49,0.08)',
    10: 'rgba(33,38,49,0.1)',
    16: 'rgba(33,38,49,0.16)',
    52: 'rgba(13,15,20,0.52)',
    72: 'rgba(13,15,20,0.72)',
  },
} as const

export const shadows = {
  none: 'none',
  crmCard: `0 8px 24px ${alpha.graphite[6]}`,
  crmListPanel: `0 2px 8px ${alpha.graphite[6]}`,
  crmMobileHeader: `0 5px 22px ${alpha.graphite[16]}`,
  popover: '0 18px 48px rgba(13,15,20,0.18)',
  modal: '0 24px 70px rgba(13,15,20,0.32)',
} as const

export const fontFamily = {
  primary: 'var(--font-primary), system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  display: 'var(--font-space-grotesk), system-ui, sans-serif',
  mono: "'Roboto Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
} as const

export const statusPalette = {
  neutral: { soft: brand.neutral[50], dot: brand.neutral[400] },
  info: { soft: supportColor.infoSoft, dot: brand.semantic.info },
  redo: { soft: supportColor.orangeSoft, dot: supportColor.orange },
  warning: { soft: supportColor.warningSoft, dot: brand.semantic.warning },
  success: { soft: supportColor.successSoft, dot: brand.semantic.success },
  error: { soft: supportColor.errorSoft, dot: brand.semantic.error },
} as const

export const chartSeriesColor = {
  approved: brand.semantic.success,
  rejected: brand.semantic.error,
  redo: brand.semantic.info,
} as const

export const capture = {
  stage: brand.graphite[900],
  viewport: brand.graphite[600],
  overlay: alpha.graphite[72],
  silhouette: brand.graphite[400],
  documentCard: brand.graphite[400],
  documentLine: brand.graphite[300],
  guideIdle: alpha.white[50],
  guideOk: brand.semantic.success,
  guideWarn: brand.semantic.warning,
  guideActive: brand.magenta[500],
  accentText: brand.magenta[300],
  mutedText: brand.graphite[200],
  chipBorder: alpha.white[18],
  chipBg: alpha.white[8],
} as const

export const layout = {
  sidebarWidth: 240,
  mobileHeaderHeight: 64,
  captureMaxWidth: 480,
  captureHeaderHeight: 56,
} as const
