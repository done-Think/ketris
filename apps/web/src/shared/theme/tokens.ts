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
