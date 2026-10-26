'use client'

import { useState } from 'react'
import { Box, Button, Dialog, Stack, Typography } from '@mui/material'
import AssignmentIndOutlinedIcon from '@mui/icons-material/AssignmentIndOutlined'
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import UndoRoundedIcon from '@mui/icons-material/UndoRounded'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined'
import RestoreFromTrashOutlinedIcon from '@mui/icons-material/RestoreFromTrashOutlined'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import { useMaintenanceAction } from '../hooks/use-maintenance'
import type {
  MaintenanceWorkflowControl,
  MaintenanceWorkflowControlsProps,
  MaintenanceWorkflowSelection,
} from '../types/maintenance'
import { MaintenanceWorkflowForm } from './MaintenanceWorkflowForm'

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

export function MaintenanceWorkflowControls({ ticket }: MaintenanceWorkflowControlsProps) {
  const t = useTranslations('dashboard.maintenance.workflow')
  const { data: session } = useSession()
  const mutation = useMaintenanceAction(session?.tenantId, ticket.id)
  const [selection, setSelection] = useState<MaintenanceWorkflowSelection | null>(null)
  const permissions = ticket.permissions
  const choose = (action: MaintenanceWorkflowSelection['action'], requestId?: string) =>
    setSelection({ action, requestId })
  return (
    <Box>
      <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1} sx={{ mb: 2 }}>
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
      <Stack spacing={0.5} sx={{ mb: 2 }}>
        <Typography variant="body2">
          {t('responsible')}: {ticket.responsibleName || t('unassigned')}
        </Typography>
        <Typography variant="body2">
          {t('providerLabel')}: {ticket.provider?.name || t('unassigned')}
        </Typography>
        {ticket.provider?.phone && <Typography variant="body2">{ticket.provider.phone}</Typography>}
        {ticket.provider?.email && <Typography variant="body2">{ticket.provider.email}</Typography>}
        {ticket.provider?.notes && (
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
            {ticket.provider.notes}
          </Typography>
        )}
      </Stack>
      {(ticket.replacementRequests ?? []).map((request) => (
        <Box key={request.id} sx={{ borderTop: '1px solid', borderColor: 'divider', py: 1 }}>
          <Typography variant="body2">
            {t('replacement')}: {t(`requestStatuses.${request.status}`)}
          </Typography>
          <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>
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
      <Dialog
        open={Boolean(selection)}
        onClose={() => !mutation.isPending && setSelection(null)}
        fullWidth
        maxWidth="sm"
      >
        {selection && (
          <MaintenanceWorkflowForm
            key={`${selection.action}:${selection.requestId ?? ''}`}
            ticket={ticket}
            selection={selection}
            onDone={() => setSelection(null)}
          />
        )}
      </Dialog>
    </Box>
  )
}
