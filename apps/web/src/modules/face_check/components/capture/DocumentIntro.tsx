'use client'

import { Box, Chip, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import type { DocumentIntroProps } from '../../types/capture.types'
import { documentStepStyles as styles, stepStyles } from '../../styles/capture.styles'

export function DocumentIntro({ options, selected, side, onChoose }: DocumentIntroProps) {
  const t = useTranslations('face_check.capture.document')

  return (
    <Box sx={stepStyles.intro}>
      <Typography component="h1" sx={stepStyles.darkTitle}>
        {t(side === 'front' ? 'titleFront' : 'titleBack', { doc: t(`types.${selected}`) })}
      </Typography>
      {side === 'front' ? (
        <Box role="radiogroup" aria-label={t('typeLabel')} sx={styles.typeGroup}>
          {options.map((type) => (
            <Chip
              key={type}
              role="radio"
              aria-checked={type === selected}
              label={t(`types.${type}`)}
              onClick={() => onChoose(type)}
              sx={styles.typeChip(type === selected)}
            />
          ))}
        </Box>
      ) : null}
      <Box sx={styles.sides}>
        <Box component="span" sx={side === 'front' ? styles.activeSide : undefined}>
          {t('sides.front')}
        </Box>
        <span aria-hidden>·</span>
        <Box component="span" sx={side === 'back' ? styles.activeSide : undefined}>
          {t('sides.back')}
        </Box>
      </Box>
      {selected === 'RG' ? (
        <Typography sx={styles.hint}>
          {t(side === 'front' ? 'rgFrontHint' : 'rgBackHint')}
        </Typography>
      ) : null}
    </Box>
  )
}
