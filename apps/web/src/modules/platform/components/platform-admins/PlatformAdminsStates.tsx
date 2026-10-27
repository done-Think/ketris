'use client'

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import { Box, Paper, Skeleton, Stack, Typography } from '@mui/material'

import { DashboardHeaderActionButton } from '@shared/components/layout'

import { styles } from '../../styles/platform-admins-page.styles'
import type { PlatformAdminsEmptyStateProps } from '../../types/platform-admin'

export function PlatformAdminsLoading() {
  return (
    <Paper variant="outlined" sx={styles.tablePanel}>
      <Stack spacing={1.5} sx={styles.stack4}>
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} variant="rounded" height={44} />
        ))}
      </Stack>
    </Paper>
  )
}

export function PlatformAdminsEmptyState({
  actionLabel,
  description,
  icon,
  onAction,
  title,
}: PlatformAdminsEmptyStateProps) {
  return (
    <Paper variant="outlined" sx={styles.paper}>
      <Stack alignItems="center" spacing={1.25}>
        <Box sx={styles.box4}>{icon}</Box>
        <Typography sx={styles.typography2}>{title}</Typography>
        <Typography sx={styles.typography3}>{description}</Typography>
        {onAction ? (
          <DashboardHeaderActionButton startIcon={<AddRoundedIcon />} onClick={onAction}>
            {actionLabel}
          </DashboardHeaderActionButton>
        ) : null}
      </Stack>
    </Paper>
  )
}
