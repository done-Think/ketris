import { Box, Typography } from '@mui/material'

import { getEditorPanelStyles, styles } from '../../styles/public-profile-editor.styles'
import type { PublicProfileEditorPanelProps } from '../../types/profile-editor'

export function PublicProfileEditorPanel({
  title,
  children,
  fullRow = false,
}: PublicProfileEditorPanelProps) {
  return (
    <Box sx={getEditorPanelStyles(fullRow)}>
      <Typography variant="h5" sx={styles.panelTitle}>
        {title}
      </Typography>
      {children}
    </Box>
  )
}
