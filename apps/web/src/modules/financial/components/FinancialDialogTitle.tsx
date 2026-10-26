import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { DialogTitle, IconButton, Stack, Typography } from '@mui/material'

import { styles } from '../styles/financial-dialog.styles'
import type { FinancialDialogTitleProps } from '../types/charge'

export function FinancialDialogTitle({ title, closeLabel, onClose }: FinancialDialogTitleProps) {
  return (
    <DialogTitle sx={styles.title}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography component="span" sx={styles.titleText}>
          {title}
        </Typography>
        <IconButton aria-label={closeLabel} onClick={onClose}>
          <CloseRoundedIcon sx={styles.closeIcon} />
        </IconButton>
      </Stack>
    </DialogTitle>
  )
}
