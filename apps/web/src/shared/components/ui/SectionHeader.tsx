import { styles } from '@shared/styles/section-header.styles'
import { Stack, Typography } from '@mui/material'

import { componentText } from '@shared/theme/tokens'
import type { SectionHeaderProps } from '@shared/types/section-header'

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={styles.stack}>
      <Typography variant="overline" color="text.secondary" sx={componentText.sectionEyebrow}>
        {title}
      </Typography>
      {action}
    </Stack>
  )
}
