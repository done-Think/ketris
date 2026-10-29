'use client'

import { Box, CircularProgress, Stack, Typography } from '@mui/material'

import type { DirectoryLoadMoreStatusProps } from '../../types/directory'
import { styles } from '../../styles/directory-load-more-status.styles'

export function DirectoryLoadMoreStatus({
  emptyLabel,
  hasItems,
  hasMoreItems,
  isLoadingMore,
  loadedLabel,
  loadingLabel,
  loadMoreRef,
}: DirectoryLoadMoreStatusProps) {
  return (
    <Box ref={loadMoreRef} sx={styles.box}>
      {hasMoreItems || isLoadingMore ? (
        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={18} thickness={4} />
          <Typography sx={styles.typography}>{loadingLabel}</Typography>
        </Stack>
      ) : (
        <Typography sx={styles.typography}>{hasItems ? loadedLabel : emptyLabel}</Typography>
      )}
    </Box>
  )
}
