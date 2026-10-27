'use client'

import { Alert, Box, Button, CircularProgress } from '@mui/material'

import { styles } from '../../styles/public-profile-editor.styles'
import type { PublicProfileEditorLoaderProps } from '../../types/profile-editor'

export function PublicProfileEditorLoader({
  isPending,
  isError,
  errorLabel,
  retryLabel,
  onRetry,
  children,
}: PublicProfileEditorLoaderProps) {
  if (isPending)
    return (
      <Box sx={styles.loading}>
        <CircularProgress />
      </Box>
    )

  if (isError)
    return (
      <Box sx={styles.page}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={onRetry}>
              {retryLabel}
            </Button>
          }
        >
          {errorLabel}
        </Alert>
      </Box>
    )

  return children
}
