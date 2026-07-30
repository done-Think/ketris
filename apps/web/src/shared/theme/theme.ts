import { createTheme, type Theme } from '@mui/material/styles'
import { brand, radius } from './tokens'

export interface TenantThemeOverride {
  primaryColor?: string
  secondaryColor?: string
  mode?: 'light' | 'dark'
}

// Cria o tema base. Recebe overrides do tenant vindos do backend (white-label).
export function buildTheme(override: TenantThemeOverride = {}): Theme {
  const mode = override.mode ?? 'light'
  const isDark = mode === 'dark'

  return createTheme({
    palette: {
      mode,
      primary: {
        main: override.primaryColor ?? (isDark ? brand.magenta[400] : brand.magenta[500]),
        light: brand.magenta[400],
        dark: brand.magenta[700],
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: override.secondaryColor ?? (isDark ? '#FFFFFF' : brand.graphite[500]),
        light: brand.graphite[400],
        dark: brand.graphite[800],
        contrastText: isDark ? brand.graphite[900] : '#FFFFFF',
      },
      success: { main: brand.semantic.success },
      warning: { main: brand.semantic.warning },
      error: { main: brand.semantic.error },
      info: { main: brand.semantic.info },
      background: {
        default: isDark ? brand.graphite[900] : '#F7F8FA',
        paper: isDark ? brand.graphite[700] : '#FFFFFF',
      },
      text: {
        primary: isDark ? '#F2F3F5' : brand.graphite[500],
        secondary: isDark ? brand.graphite[200] : brand.neutral[600],
        disabled: brand.neutral[400],
      },
      divider: isDark ? '#1E242E' : brand.neutral[100],
    },
    shape: {
      borderRadius: radius.md,
    },
    typography: {
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      h1: { fontFamily: 'Space Grotesk, sans-serif', fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em' },
      h2: { fontFamily: 'Space Grotesk, sans-serif', fontSize: '2rem', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em' },
      h3: { fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.625rem', fontWeight: 600, lineHeight: 1.25, letterSpacing: '-0.01em' },
      h4: { fontWeight: 600, fontSize: '1.3125rem', lineHeight: 1.3 },
      h5: { fontWeight: 600, fontSize: '1.125rem', lineHeight: 1.4 },
      h6: { fontWeight: 600, fontSize: '1rem', lineHeight: 1.4 },
      body1: { fontSize: '1rem', lineHeight: 1.6 },
      body2: { fontSize: '0.875rem', lineHeight: 1.55 },
      overline: { fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em' },
      button: { fontWeight: 600, textTransform: 'none' },
    },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
      },
    },
  })
}

export const theme = buildTheme()
