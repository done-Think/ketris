'use client'

import type { MaintenanceLinksDialogProps } from '../types/maintenance'

import { useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'
import { useMaintenanceOptions } from '../hooks/use-maintenance'
import { maintenanceService } from '../services/maintenance-service'
import { errorMessage } from '../utils/error-message'

export function MaintenanceLinksDialog({ open, onClose }: MaintenanceLinksDialogProps) {
  const t = useTranslations('dashboard.maintenance.links')
  const { data: options } = useMaintenanceOptions()
  const client = useQueryClient()
  const { enqueueSnackbar } = useSnackbar()
  const [contractId, setContractId] = useState('')
  const [ownerId, setOwnerId] = useState('')
  const [partyId, setPartyId] = useState('')
  const [renterId, setRenterId] = useState('')
  const [saving, setSaving] = useState(false)
  const contract = options?.contracts.find((item) => item.id === contractId)
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      await maintenanceService.linkUsers({
        contractId,
        ownerId: ownerId || undefined,
        partyId: partyId || undefined,
        renterId: renterId || undefined,
      })
      await client.invalidateQueries({ queryKey: ['maintenance-options'] })
      await client.invalidateQueries({ queryKey: ['maintenance'] })
      enqueueSnackbar(t('success'), { variant: 'success' })
      onClose()
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('error')), { variant: 'error' })
    } finally {
      setSaving(false)
    }
  }
  return (
    <Dialog open={open} onClose={() => !saving && onClose()} fullWidth maxWidth="sm">
      <form onSubmit={submit}>
        <DialogTitle>{t('title')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label={t('contract')}
              select
              value={contractId}
              onChange={(event) => {
                setContractId(event.target.value)
                setOwnerId('')
                setPartyId('')
                setRenterId('')
              }}
              required
            >
              {(options?.contracts ?? []).map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.code} - {item.propertyTitle}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={t('owner')}
              select
              value={ownerId}
              onChange={(event) => setOwnerId(event.target.value)}
            >
              <MenuItem value="">{t('unchanged')}</MenuItem>
              {(options?.users ?? [])
                .filter((user) => user.role === 'PROPERTY_OWNER')
                .map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name}
                  </MenuItem>
                ))}
            </TextField>
            <TextField
              label={t('party')}
              select
              value={partyId}
              onChange={(event) => {
                setPartyId(event.target.value)
                setRenterId('')
              }}
            >
              <MenuItem value="">{t('unchanged')}</MenuItem>
              {(contract?.parties ?? [])
                .filter((party) => party.role === 'LOCATARIO')
                .map((party) => (
                  <MenuItem key={party.id} value={party.id}>
                    {party.name}
                  </MenuItem>
                ))}
            </TextField>
            {partyId && (
              <TextField
                label={t('renter')}
                select
                value={renterId}
                onChange={(event) => setRenterId(event.target.value)}
                required
              >
                {(options?.users ?? [])
                  .filter((user) => user.role === 'RENTER')
                  .map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name}
                    </MenuItem>
                  ))}
              </TextField>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={saving} onClick={onClose}>
            {t('back')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving || !contractId || !(ownerId || (partyId && renterId))}
          >
            {t('save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
