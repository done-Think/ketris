import { Box, Skeleton, Stack } from '@mui/material'

export function DetailLoading() {
  return (
    <Box sx={{ p: { xs: 2, md: 3.5 } }} aria-label="Carregando oportunidade">
      <Skeleton width={180} height={24} />
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 1, mb: 3 }}>
        <Skeleton width="42%" height={48} />
        <Skeleton width={150} height={48} />
      </Stack>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 58fr) minmax(320px, 42fr)' },
          gap: 2,
        }}
      >
        <Skeleton variant="rounded" height={310} />
        <Skeleton variant="rounded" height={310} />
      </Box>
    </Box>
  )
}
