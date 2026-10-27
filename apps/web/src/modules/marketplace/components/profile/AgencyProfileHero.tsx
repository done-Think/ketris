'use client'

import { Box, Chip, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import type { AgencyProfileHeroProps } from '../../types/agency'
import { AgencyBrandBanner } from '../AgencyBrandBanner'
import {
  styles,
  getBoxStyles,
  getBoxStyles2,
  getChipStyles,
} from '../../styles/agency-profile-hero.styles'

export function AgencyProfileHero({ agency }: AgencyProfileHeroProps) {
  const t = useTranslations('marketplace.publicProfile')
  return (
    <Box sx={styles.box}>
      <Box sx={getBoxStyles({ agency })}>
        <Typography sx={styles.typography}>
          {agency.headline ?? t('agencyDefaultHeadline')}
        </Typography>
      </Box>

      <Box sx={getBoxStyles2({ agency })}>
        <AgencyBrandBanner agency={agency} size="hero" />
      </Box>

      <Box sx={styles.box2}>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={styles.stack}>
          {agency.segments.map((segment) => (
            <Chip key={segment} label={segment} size="small" sx={getChipStyles({ agency })} />
          ))}
        </Stack>
        <Typography component="h1" sx={styles.typography2}>
          {agency.name}
        </Typography>
        <Typography sx={styles.typography3}>
          {[agency.legalCreci, agency.headquarters].filter(Boolean).join(' / ')}
        </Typography>
        <Typography sx={styles.typography4}>{agency.summary}</Typography>
      </Box>
    </Box>
  )
}
