import { Box } from '@mui/material'
import { useTranslations } from 'next-intl'

import videoLogoChromaUrl from '../assets/videologo-chroma.webm'
import { styles } from '../styles/hero-brand-video.styles'

export function HeroBrandVideo() {
  const t = useTranslations('marketplace.home.hero')

  return (
    <Box sx={styles.box}>
      <Box sx={styles.box2}>
        <Box sx={styles.box3}>
          <Box
            component="video"
            src={videoLogoChromaUrl}
            autoPlay
            muted
            playsInline
            aria-hidden="true"
            sx={styles.box4}
          />
          <Box
            component="video"
            src={videoLogoChromaUrl}
            autoPlay
            muted
            playsInline
            aria-label={t('brandAnimation')}
            sx={styles.box5}
          />
        </Box>
      </Box>
    </Box>
  )
}
