'use client'

import { Alert, Box, Chip, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'

import { useApproveUserMembership } from '@modules/auth/hooks/use-approve-user-membership'
import { useUsers } from '@modules/auth/hooks/use-users'
import { DashboardHeaderActionButton } from '@shared/components/layout'
import { DashboardPanel } from '@shared/components/ui/DashboardPanel'
import { extractErrorMessage } from '@shared/utils/error-message'

import { styles } from '../styles/team-membership-requests.styles'
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
    <Box component="section" aria-label={t('title')}>
      <DashboardPanel>
        <Box sx={styles.panel}>
          <Typography variant="h6" component="h2">
            {t('title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={styles.description}>
            {t('description', { count: pendingUsers.length })}
          </Typography>

          <Stack component="ul" sx={styles.list}>
            {pendingUsers.map((user) => (
              <Stack
                component="li"
                key={user.id}
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.2}
                sx={styles.item}
              >
                <Box sx={styles.identity}>
                  <Typography variant="body1" noWrap>
                    {user.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {user.email}
                  </Typography>
                  <Stack direction="row" spacing={0.8} sx={styles.chips}>
                    <Chip label={roleT(user.role)} variant="outlined" size="small" />
                    <Chip label={t('pending')} color="warning" size="small" />
                  </Stack>
                </Box>
                <DashboardHeaderActionButton
                  disabled={approveMembership.isPending}
                  onClick={() => approve(user.id, user.name)}
                  aria-label={t('approveAriaLabel', { name: user.name })}
                >
                  {t('approve')}
                </DashboardHeaderActionButton>
              </Stack>
            ))}
          </Stack>
        </Box>
      </DashboardPanel>
    </Box>
  )
}
