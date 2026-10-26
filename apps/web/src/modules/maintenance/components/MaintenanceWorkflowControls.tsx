'use client'

import * as maintenanceStyles from '../styles/maintenance-workflow-controls.styles'

import type {
  MaintenanceWorkflowControl,
  MaintenanceWorkflowControlsProps,
  MaintenanceWorkflowSelection,
} from '../types/maintenance'

import AssignmentIndOutlinedIcon from '@mui/icons-material/AssignmentIndOutlined'
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined'
import RestoreFromTrashOutlinedIcon from '@mui/icons-material/RestoreFromTrashOutlined'
import UndoRoundedIcon from '@mui/icons-material/UndoRounded'
import { Box, Button, Stack, Typography } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { useMaintenanceAction } from '../hooks/use-maintenance'
import { useMaintenanceErrorMessage } from '../hooks/use-maintenance-error-message'
import type { MaintenanceWorkflowFormValues } from '../types/maintenance-workflow'
import { buildMaintenanceWorkflowAction } from '../utils/maintenance-workflow'
import { MaintenanceWorkflowForm } from './MaintenanceWorkflowForm'

export function MaintenanceWorkflowControls({ ticket }: MaintenanceWorkflowControlsProps) {
  const errorMessage = useMaintenanceErrorMessage()
  const t = useTranslations('dashboard.maintenance.workflow')
  const { data: session } = useSession()
  const mutation = useMaintenanceAction(session?.tenantId, ticket.id)
  const { enqueueSnackbar } = useSnackbar()
  const [selection, setSelection] = useState<MaintenanceWorkflowSelection | null>(null)
  const permissions = ticket.permissions
  const controls: MaintenanceWorkflowControl[] = [
    { permission: 'linkContract', action: 'linkContract', icon: <AssignmentIndOutlinedIcon /> },
    { permission: 'assume', action: 'assume', icon: <AssignmentIndOutlinedIcon /> },
    { permission: 'assign', action: 'assign', icon: <AssignmentIndOutlinedIcon /> },
    { permission: 'provider', action: 'provider', icon: <BuildOutlinedIcon /> },
    { permission: 'requestReplacement', action: 'requestReplacement', icon: <UndoRoundedIcon /> },
    { permission: 'start', action: 'start', icon: <PlayArrowRoundedIcon /> },
    { permission: 'complete', action: 'complete', icon: <CheckRoundedIcon /> },
    { permission: 'finish', action: 'finish', icon: <CheckRoundedIcon /> },
    { permission: 'confirm', action: 'confirm', icon: <CheckRoundedIcon /> },
    { permission: 'contest', action: 'contest', icon: <ReportProblemOutlinedIcon /> },
    { permission: 'cancel', action: 'cancel', icon: <CancelOutlinedIcon /> },
    { permission: 'reopen', action: 'reopen', icon: <UndoRoundedIcon /> },
    { permission: 'restore', action: 'restore', icon: <RestoreFromTrashOutlinedIcon /> },
  ]
  function choose(action: MaintenanceWorkflowSelection['action'], requestId?: string) {
    setSelection({ action, requestId })
  }

  async function submit(values: MaintenanceWorkflowFormValues) {
    if (!selection) return
    try {
      await mutation.mutateAsync(buildMaintenanceWorkflowAction(values, selection, session?.role))
      setSelection(null)
      enqueueSnackbar(t('success'), { variant: 'success' })
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('error')), { variant: 'error' })
    }
  }
  return (
    <Box>
      <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1} sx={maintenanceStyles.stackSx}>
        {controls
          .filter((control) => permissions?.[control.permission])
          .map((control) => (
            <Button
              key={control.action}
              size="small"
              variant="outlined"
              startIcon={control.icon}
              onClick={() => choose(control.action)}
              disabled={mutation.isPending}
            >
              {t(control.action)}
            </Button>
          ))}
      </Stack>
      <Stack spacing={0.5} sx={maintenanceStyles.stackSx}>
        <Typography variant="body2">
          {t('responsible')}: {ticket.responsibleName || t('unassigned')}
        </Typography>
        <Typography variant="body2">
          {t('providerLabel')}: {ticket.provider?.name || t('unassigned')}
        </Typography>
        {ticket.provider?.phone && <Typography variant="body2">{ticket.provider.phone}</Typography>}
        {ticket.provider?.email && <Typography variant="body2">{ticket.provider.email}</Typography>}
        {ticket.provider?.notes && (
          <Typography variant="body2" sx={maintenanceStyles.typographySx}>
            {ticket.provider.notes}
          </Typography>
        )}
      </Stack>
      {(ticket.replacementRequests ?? []).map((request) => (
        <Box key={request.id} sx={maintenanceStyles.boxSx}>
          <Typography variant="body2">
            {t('replacement')}: {t(`requestStatuses.${request.status}`)}
          </Typography>
          <Typography variant="body2" sx={maintenanceStyles.typographySx2}>
            {request.requestedByName}: {request.reason}
          </Typography>
          {request.decisionReason && (
            <Typography variant="body2">
              {request.decidedByName}: {request.decisionReason}
            </Typography>
          )}
          {request.status === 'PENDENTE' &&
            session?.role === 'OWNER' &&
            permissions?.collaborate && (
              <Stack direction="row" spacing={1}>
                <Button
                  startIcon={<CheckRoundedIcon />}
                  onClick={() => choose('approveReplacement', request.id)}
                >
                  {t('approveReplacement')}
                </Button>
                <Button
                  startIcon={<CancelOutlinedIcon />}
                  onClick={() => choose('rejectReplacement', request.id)}
                >
                  {t('rejectReplacement')}
                </Button>
              </Stack>
            )}
        </Box>
      ))}
      {selection && (
        <MaintenanceWorkflowForm
          ticket={ticket}
          selection={selection}
          role={session?.role}
          isPending={mutation.isPending}
          onSubmit={submit}
          onClose={() => setSelection(null)}
        />
      )}
    </Box>
  )
}
