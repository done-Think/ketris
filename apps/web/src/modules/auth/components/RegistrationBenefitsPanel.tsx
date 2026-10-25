import { styles } from '../styles/registration-benefits-panel.styles'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { Box, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import ketrisLogoTransparent from '@shared/assets/ketris-logo-transparent.png'
import { AppLogo } from '@shared/components/ui'

import { REGISTRATION_BENEFITS } from '../config/registration-benefits'

export function RegistrationBenefitsPanel() {
  const t = useTranslations('auth.register')

  return (
    <Box component="aside" sx={styles.box}>
      <AppLogo src={ketrisLogoTransparent} variant="transparent" width={{ xs: 92, md: 112 }} />

      <Box sx={styles.box2}>
        <Box aria-hidden="true" sx={styles.box3} />

        <Stack spacing={2.5} sx={styles.stack}>
          {REGISTRATION_BENEFITS.map((benefit) => (
            <Stack key={benefit} direction="row" alignItems="center" spacing={1.5}>
              <Box aria-hidden="true" sx={styles.box4}>
                <CheckRoundedIcon sx={styles.checkRoundedIcon} />
              </Box>
              <Typography sx={styles.typography}>{t(`benefits.${benefit}`)}</Typography>
            </Stack>
          ))}
        </Stack>
      </Box>

      <Typography color="text.secondary" variant="caption" sx={styles.typography2}>
        {t('copyright')}
      </Typography>
    </Box>
  )
}
