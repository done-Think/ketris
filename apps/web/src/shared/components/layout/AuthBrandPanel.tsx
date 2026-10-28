import { getStyles } from '@shared/styles/auth-brand-panel.styles'
import { Box, Stack, Typography } from '@mui/material'

import { useTranslations } from 'next-intl'

import ketrisLogoFooter from '@shared/assets/ketris-logo-footer.png'
import { AppLogo } from '@shared/components/ui'

import type { AuthBrandPanelProps } from '@shared/types/auth-shell'

export function AuthBrandPanel({ description, mobileBackdrop = false }: AuthBrandPanelProps) {
  const styles = getStyles(mobileBackdrop)

  const t = useTranslations('auth.brand')
  const panelDescription = description ?? t('description')

  return (
    <Box component="section" aria-label={t('ariaLabel')} sx={styles.box}>
      <Stack
        alignItems="center"
        justifyContent="center"
        spacing={{ xs: 0.75, md: 0.75 }}
        sx={styles.stack}
      >
        <AppLogo src={ketrisLogoFooter} width={{ xs: 128, md: 136 }} />

        <Typography sx={styles.typography}>{panelDescription}</Typography>

        <Typography variant="body2" sx={styles.typography2}>
          {t('connectedProperties')}
        </Typography>
      </Stack>
    </Box>
  )
}
