'use client'

import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'
import { useMemo, useState } from 'react'

import { useRouter } from '@/i18n/navigation'
import {
  DashboardHeaderActionButton,
  DashboardNotificationsButton,
  DashboardPageHeader,
} from '@shared/components/layout'
import { useListState } from '@shared/hooks/use-list-state'

import { useActivateBroker, useResendInvitation, useTeamOverview } from '../hooks/use-team'
import { styles } from '../styles/team-dashboard-page.styles'
import type {
  BrokerTeamDialog,
  BrokerTeamListState,
  BrokerTeamMenuAction,
  BrokerTeamMenuState,
  TeamMember,
  BrokerTeamDashboardPageProps,
} from '../types/team'
import { matchesTeamSearch, transferDestinations } from '../utils/team-member'
import { BrokerTeamCard } from './BrokerTeamCard'
import { BrokerTeamMenu } from './BrokerTeamMenu'
import { BrokerDeactivateDialog } from './dialogs/BrokerDeactivateDialog'
import { BrokerGoalDialog } from './dialogs/BrokerGoalDialog'
import { BrokerInviteDialog } from './dialogs/BrokerInviteDialog'
import { BrokerPerformanceDialog } from './dialogs/BrokerPerformanceDialog'
import { BrokerTransferDialog } from './dialogs/BrokerTransferDialog'
import { CancelInvitationDialog } from './dialogs/CancelInvitationDialog'
import { TeamKpis } from './TeamKpis'
import { TeamMembershipRequests } from './TeamMembershipRequests'

export function BrokerTeamDashboardPage({ renderMeetingDialog }: BrokerTeamDashboardPageProps) {
  const router = useRouter()
  const t = useTranslations('dashboard.team')
  const { enqueueSnackbar } = useSnackbar()
  const { data: session } = useSession()
  const isOwner = session?.role === 'OWNER'
  const overview = useTeamOverview()
  const activate = useActivateBroker()
  const resend = useResendInvitation()
  const { filters, setFilter } = useListState<BrokerTeamListState>({ search: '' })
  const [menu, setMenu] = useState<BrokerTeamMenuState | null>(null)
  const [dialog, setDialog] = useState<BrokerTeamDialog | null>(null)
  const members = useMemo(() => overview.data?.members ?? [], [overview.data])
  const filteredMembers = useMemo(
    () => members.filter((member) => matchesTeamSearch(member, filters.search)),
    [members, filters.search],
  )
  const pendingInvitations = members.filter((member) => member.invitation).length
  const userId = session?.user?.id
  const selfDestination = userId
    ? { id: userId, label: t('dialogs.selfDestination', { name: session?.user?.name ?? '' }) }
    : null
  const closeDialog = () => setDialog(null)

  const openProfile = (member: TeamMember) => {
    router.push({ pathname: '/brokers/[id]', params: { id: member.id } })
  }

  const selectAction = async (action: BrokerTeamMenuAction) => {
    if (!menu) return
    const { member } = menu
    setMenu(null)
    if (action === 'activate') {
      try {
        await activate.mutateAsync(member.id)
        enqueueSnackbar(t('dialogs.activated', { name: member.name }), { variant: 'success' })
      } catch {
        enqueueSnackbar(t('dialogs.activateError'), { variant: 'error' })
      }
      return
    }
    if (action === 'resendInvitation') {
      try {
        const result = await resend.mutateAsync(member.id)
        enqueueSnackbar(
          result.emailDelivered
            ? t('dialogs.invitationResent', { email: member.email })
            : t('dialogs.invitedEmailFailed'),
          { variant: result.emailDelivered ? 'success' : 'warning' },
        )
      } catch {
        enqueueSnackbar(t('dialogs.invitationResendError'), { variant: 'error' })
      }
      return
    }
    setDialog({ type: action, member })
  }

  const oneOnOneMember = dialog?.type === 'scheduleOneOnOne' ? dialog.member : null
  const destinations =
    dialog && dialog.type !== 'invite'
      ? transferDestinations(members, dialog.member.id, selfDestination)
      : []

  return (
    <Box sx={styles.page}>
      <Stack spacing={2.2}>
        <DashboardPageHeader
          title={t('title')}
          subtitle={t('subtitle')}
          actions={
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ sm: 'center' }}
              spacing={1.2}
              sx={styles.headerActions}
            >
              <TextField
                value={filters.search}
                onChange={(event) => setFilter('search', event.target.value)}
                placeholder={t('searchPlaceholder')}
                size="small"
                sx={styles.search}
                slotProps={{
                  htmlInput: { 'aria-label': t('searchPlaceholder') },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon sx={styles.searchIcon} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              {isOwner ? (
                <DashboardHeaderActionButton
                  startIcon={<PersonAddAlt1OutlinedIcon sx={styles.inviteIcon} />}
                  onClick={() => setDialog({ type: 'invite' })}
                >
                  {t('inviteBroker')}
                </DashboardHeaderActionButton>
              ) : null}
              <Box sx={styles.notifications}>
                <DashboardNotificationsButton />
              </Box>
            </Stack>
          }
        />

        <Stack spacing={2.2} sx={styles.body}>
          <TeamMembershipRequests enabled={isOwner} />

          {overview.isPending ? (
            <Paper variant="outlined" sx={styles.emptyPanel}>
              <CircularProgress size={28} aria-label={t('title')} />
            </Paper>
          ) : overview.isError ? (
            <Paper variant="outlined" sx={styles.emptyPanel}>
              <Typography sx={styles.emptyText}>{t('loadError')}</Typography>
              <Button variant="outlined" onClick={() => overview.refetch()}>
                {t('retry')}
              </Button>
            </Paper>
          ) : (
            <>
              <TeamKpis summary={overview.data.summary} pendingInvitations={pendingInvitations} />
              {filteredMembers.length ? (
                <Box sx={styles.grid}>
                  {filteredMembers.map((member) => (
                    <BrokerTeamCard
                      key={member.id}
                      member={member}
                      isMenuOpen={menu?.member.id === member.id}
                      onOpenProfile={openProfile}
                      onOpenMenu={(anchorEl, target) => setMenu({ anchorEl, member: target })}
                    />
                  ))}
                </Box>
              ) : (
                <Paper variant="outlined" sx={styles.emptyPanel}>
                  <Typography sx={styles.emptyText}>
                    {members.length ? t('empty') : t('emptyTeam')}
                  </Typography>
                </Paper>
              )}
            </>
          )}

          <BrokerTeamMenu menu={menu} onClose={() => setMenu(null)} onSelect={selectAction} />

          {dialog?.type === 'invite' ? <BrokerInviteDialog onClose={closeDialog} /> : null}
          {dialog?.type === 'performance' ? (
            <BrokerPerformanceDialog member={dialog.member} onClose={closeDialog} />
          ) : null}
          {dialog?.type === 'editGoal' ? (
            <BrokerGoalDialog member={dialog.member} onClose={closeDialog} />
          ) : null}
          {dialog?.type === 'transferPortfolio' ? (
            <BrokerTransferDialog
              member={dialog.member}
              destinations={destinations}
              onClose={closeDialog}
            />
          ) : null}
          {dialog?.type === 'deactivate' ? (
            <BrokerDeactivateDialog
              member={dialog.member}
              destinations={destinations}
              onClose={closeDialog}
            />
          ) : null}
          {dialog?.type === 'cancelInvitation' ? (
            <CancelInvitationDialog member={dialog.member} onClose={closeDialog} />
          ) : null}
          {oneOnOneMember
            ? renderMeetingDialog({ member: oneOnOneMember, onClose: closeDialog })
            : null}
        </Stack>
      </Stack>
    </Box>
  )
}
