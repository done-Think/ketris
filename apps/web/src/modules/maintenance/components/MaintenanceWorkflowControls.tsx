'use client'

import type {
  MaintenanceWorkflowControl,
  MaintenanceWorkflowControlsProps,
  MaintenanceWorkflowSelection,
} from '../types/maintenance'

import { useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
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
import { useSnackbar } from 'notistack'
import { useMaintenanceAction, useMaintenanceOptions } from '../hooks/use-maintenance'
import type { MaintenanceAction } from '../types/service'
import { errorMessage } from '../utils/error-message'

export function MaintenanceWorkflowControls({ ticket }: MaintenanceWorkflowControlsProps) {
  const t = useTranslations('dashboard.maintenance.workflow')
  const { data: session } = useSession()
  const { data: options } = useMaintenanceOptions()
  const mutation = useMaintenanceAction(session?.tenantId, ticket.id)
  const { enqueueSnackbar } = useSnackbar()
  const [selection, setSelection] = useState<MaintenanceWorkflowSelection | null>(null)
  const [reason, setReason] = useState('')
  const [responsibleId, setResponsibleId] = useState('')
  const [contractId, setContractId] = useState('')
  const [status, setStatus] = useState<'ABERTO' | 'EM_ANDAMENTO'>('ABERTO')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
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
    setReason('')
    setStatus('ABERTO')
    setResponsibleId(ticket.responsibleId ?? '')
    setContractId('')
    setName(action === 'approveReplacement' ? '' : (ticket.provider?.name ?? ''))
    setPhone(action === 'approveReplacement' ? '' : (ticket.provider?.phone ?? ''))
    setEmail(action === 'approveReplacement' ? '' : (ticket.provider?.email ?? ''))
    setNotes(action === 'approveReplacement' ? '' : (ticket.provider?.notes ?? ''))
  }
  const providerAction =
    selection?.action === 'provider' || selection?.action === 'approveReplacement'
  const reasonAction =
    selection &&
    (['contest', 'requestReplacement', 'rejectReplacement'].includes(selection.action) ||
      (selection.action === 'reopen' && session?.papel === 'RENTER'))
  const valid =
    (!providerAction || Boolean(name.trim())) &&
    (!reasonAction || Boolean(reason.trim())) &&
    (selection?.action !== 'assign' || Boolean(responsibleId)) &&
    (selection?.action !== 'linkContract' || Boolean(contractId))
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!selection || !valid) return
    let action: MaintenanceAction
    switch (selection.action) {
      case 'linkContract':
        action = { action: 'linkContract', contractId }
        break
      case 'provider':
        action = {
          action: 'provider',
          provider: { name, phone: phone || null, email: email || null, notes: notes || null },
        }
        break
      case 'approveReplacement':
        action = {
          action: 'approveReplacement',
          requestId: selection.requestId!,
          provider: { name, phone: phone || null, email: email || null, notes: notes || null },
        }
        break
      case 'rejectReplacement':
        action = { action: 'rejectReplacement', requestId: selection.requestId!, reason }
        break
      case 'contest':
        action = { action: 'contest', reason }
        break
      case 'requestReplacement':
        action = { action: 'requestReplacement', reason }
        break
      case 'assign':
        action = { action: 'assign', responsibleId }
        break
      case 'reopen':
        action =
          session?.papel === 'RENTER'
            ? { action: 'reopen', status: 'ABERTO', reason }
            : { action: 'reopen', status }
        break
      default:
        action = { action: selection.action }
    }
    try {
      await mutation.mutateAsync(action)
      setSelection(null)
      enqueueSnackbar(t('success'), { variant: 'success' })
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('error')), { variant: 'error' })
    }
  }
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
            session?.papel === 'ADMIN' &&
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
        <Box component="form" onSubmit={submit}>
          <DialogTitle>{selection && t(selection.action)}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              {selection?.action === 'linkContract' && (
                <>
                  <Typography variant="body2">{t('linkContractHelp')}</Typography>
                  <TextField
                    label={t('contract')}
                    value={contractId}
                    onChange={(event) => setContractId(event.target.value)}
                    select
                    required
                  >
                    {(options?.contracts ?? [])
                      .filter((contract) => contract.propertyId === ticket.propertyId)
                      .map((contract) => (
                        <MenuItem key={contract.id} value={contract.id}>
                          {contract.code} - {contract.propertyTitle}
                        </MenuItem>
                      ))}
                  </TextField>
                </>
              )}
              {selection?.action === 'finish' && <Typography>{t('finishConfirmation')}</Typography>}
              {reasonAction && (
                <TextField
                  label={t('reason')}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  required
                  multiline
                  minRows={3}
                  inputProps={{ maxLength: 5000 }}
                />
              )}
              {selection?.action === 'assign' && (
                <TextField
                  label={t('responsible')}
                  value={responsibleId}
                  onChange={(event) => setResponsibleId(event.target.value)}
                  select
                  required
                >
                  {(options?.users ?? [])
                    .filter((user) => user.role !== 'RENTER')
                    .map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.name}
                      </MenuItem>
                    ))}
                </TextField>
              )}
              {selection?.action === 'reopen' && session?.papel !== 'RENTER' && (
                <TextField
                  label={t('reopenStatus')}
                  value={status}
                  onChange={(event) => setStatus(event.target.value as typeof status)}
                  select
                >
                  <MenuItem value="ABERTO">{t('open')}</MenuItem>
                  <MenuItem value="EM_ANDAMENTO">{t('inProgress')}</MenuItem>
                </TextField>
              )}
              {providerAction && (
                <>
                  <TextField
                    label={t('name')}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    inputProps={{ maxLength: 200 }}
                  />
                  <TextField
                    label={t('phone')}
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    inputProps={{ maxLength: 50 }}
                  />
                  <TextField
                    label={t('email')}
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                  <TextField
                    label={t('notes')}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    multiline
                    minRows={2}
                    inputProps={{ maxLength: 5000 }}
                  />
                </>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button disabled={mutation.isPending} onClick={() => setSelection(null)}>
              {t('back')}
            </Button>
            <Button type="submit" variant="contained" disabled={!valid || mutation.isPending}>
              {t('save')}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}
