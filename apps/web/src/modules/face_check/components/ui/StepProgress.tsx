import { Box, Typography } from '@mui/material'

import type { StepProgressProps } from '../../types'

import { stepProgressStyles } from '../../styles/shared-ui.styles'

export function StepProgress({ current, total, label, tone = 'light' }: StepProgressProps) {
  const styles = stepProgressStyles(tone)

  return (
    <Box sx={styles.root} aria-label={label}>
      <Box component="span" sx={styles.pill} />
      <Typography component="span" sx={styles.label}>
        {label}
      </Typography>
      {Array.from({ length: total }, (_, index) => (
        <Box key={index} component="span" sx={styles.dot(index < current)} />
      ))}
    </Box>
  )
}
