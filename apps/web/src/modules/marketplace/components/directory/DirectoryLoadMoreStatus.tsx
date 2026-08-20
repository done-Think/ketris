'use client'

import { Box, CircularProgress, Stack, Typography } from '@mui/material'

import type { DirectoryLoadMoreStatusProps } from '../../types/directory'

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
    <Box
      ref={loadMoreRef}
      sx={{
        minHeight: 72,
        display: 'grid',
        placeItems: 'center',
        mt: 2,
      }}
    >
      {hasMoreItems || isLoadingMore ? (
        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={18} thickness={4} />
          <Typography sx={{ color: 'text.secondary', fontSize: 13, fontWeight: 500 }}>
            {loadingLabel}
          </Typography>
        </Stack>
      ) : (
        <Typography sx={{ color: 'text.secondary', fontSize: 13, fontWeight: 500 }}>
          {hasItems ? loadedLabel : emptyLabel}
        </Typography>
      )}
    </Box>
  )
}
