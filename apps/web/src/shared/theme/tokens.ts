// Design tokens da Ketris — fonte única de verdade para cores da marca.
// Identidade oficial: Magenta/Fúcsia #F30274 + Grafite #212631.

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

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
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
    50: 'rgba(255,255,255,0.5)',
    56: 'rgba(255,255,255,0.56)',
    62: 'rgba(255,255,255,0.62)',
    72: 'rgba(255,255,255,0.72)',
    78: 'rgba(255,255,255,0.78)',
  },
  magenta: {
    6: 'rgba(243, 2, 116, 0.06)',
    8: 'rgba(243, 2, 116, 0.08)',
    10: 'rgba(243, 2, 116, 0.1)',
    14: 'rgba(243, 2, 116, 0.14)',
  },
  graphite: {
    6: 'rgba(33, 38, 49, 0.06)',
    8: 'rgba(33,38,49,0.08)',
    16: 'rgba(33,38,49,0.16)',
    18: 'rgba(33,38,49,0.18)',
  },
  error: {
    6: 'rgba(229, 72, 77, 0.06)',
    10: 'rgba(229, 72, 77, 0.1)',
  },
} as const

export const shadows = {
  propertyCard: `0 16px 44px ${alpha.graphite[8]}`,
  propertyCardHover: `0 24px 58px ${alpha.graphite[16]}`,
  avatarFocus: `0 0 0 2px ${alpha.magenta[14]}`,
  popover: '0 18px 48px rgba(13,15,20,0.18)',
  modal: '0 24px 70px rgba(13,15,20,0.32)',
  heroSearch: {
    md: '0 16px 42px rgba(0,0,0,0.22)',
    xl: '0 24px 70px rgba(0,0,0,0.28)',
  },
  mobileSearch: '0 18px 45px rgba(0,0,0,0.24)',
} as const

export const gradients = {
  heroBackground: (imageUrl: string) =>
    `linear-gradient(100deg, rgba(13, 15, 20, 0.98) 0%, rgba(13, 15, 20, 0.9) 48%, rgba(83, 9, 50, 0.72) 100%), url("${imageUrl}")`,
  miniPropertyImage: (imageUrl: string) =>
    `linear-gradient(180deg, rgba(33,38,49,0.02), ${alpha.graphite[18]}), url("${imageUrl}")`,
  videoEdgeMask:
    'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.06) 10%, rgba(0,0,0,0.42) 24%, #000 34%, #000 66%, rgba(0,0,0,0.42) 76%, rgba(0,0,0,0.06) 90%, transparent 100%), linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.55) 7%, #000 18%, #000 82%, rgba(0,0,0,0.55) 93%, transparent 100%)',
  videoCenterMask:
    'radial-gradient(ellipse at center, #000 38%, rgba(0,0,0,0.68) 52%, rgba(0,0,0,0.18) 66%, transparent 78%)',
} as const
