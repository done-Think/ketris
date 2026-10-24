'use client'

import { Alert, Button, Paper, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'

import { useApproveUserMembership } from '@modules/auth/hooks/use-approve-user-membership'
import { useUsers } from '@modules/auth/hooks/use-users'
import { alpha, radius, shadows, surface } from '@shared/theme/tokens'
import { extractErrorMessage } from '@shared/utils/error-message'

import type { TeamMembershipRequestsProps } from '../types/broker-team'

export function TeamMembershipRequests({ enabled }: TeamMembershipRequestsProps) {
  const t = useTranslations('dashboard.team.membershipRequests')
  const roleT = useTranslations('marketplace.profile.roles')
  const { enqueueSnackbar } = useSnackbar()
  const usersQuery = useUsers(enabled)
  const approveMembership = useApproveUserMembership()
  const pendingUsers = (usersQuery.data ?? []).filter((user) => user.pendingApproval)

  if (!enabled) return null

  if (usersQuery.isError) {
    return <Alert severity="error">{t('loadError')}</Alert>
  }

  if (pendingUsers.length === 0) return null

  const approve = async (userId: string, name: string) => {
    try {
      await approveMembership.mutateAsync(userId)
      enqueueSnackbar(t('approveSuccess', { name }), { variant: 'success' })
    } catch (error) {
      enqueueSnackbar(extractErrorMessage(error, t('approveError')), { variant: 'error' })
    }
  }

  return (
    <Paper
      component="section"
      aria-label={t('title')}
      variant="outlined"
      sx={{
        p: { xs: 1.5, md: 2 },
        borderColor: alpha.graphite[8],
        borderRadius: `${radius.sm}px`,
        bgcolor: surface.paper,
        boxShadow: shadows.crmListPanel,
      }}
    >
      <Stack spacing={1.5}>
        <Stack spacing={0.4}>
          <Typography variant="h6" component="h2">
            {t('title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('description', { count: pendingUsers.length })}
          </Typography>
        </Stack>
        {pendingUsers.map((user) => (
          <Stack
            key={user.id}
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.2}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            justifyContent="space-between"
            sx={{
              p: 1.2,
              borderRadius: `${radius.sm}px`,
              bgcolor: surface.app,
            }}
          >
            <Stack spacing={0.2} sx={{ minWidth: 0 }}>
              <Typography variant="body1" noWrap>
                {user.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {user.email} · {roleT(user.role)}
              </Typography>
            </Stack>
            <Button
              variant="contained"
              size="small"
              disabled={approveMembership.isPending}
              onClick={() => approve(user.id, user.name)}
              aria-label={t('approveAriaLabel', { name: user.name })}
            >
              {t('approve')}
            </Button>
          </Stack>
        ))}
      </Stack>
    </Paper>
  )
}
