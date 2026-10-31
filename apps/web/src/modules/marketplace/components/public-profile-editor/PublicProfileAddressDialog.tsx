'use client'

import { useId, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'
import {
  isReservedPublicProfileHandle,
  isValidPublicProfileHandle,
  normalizePublicProfileHandle,
} from '@shared/utils/public-profile-handle'
import { getApiErrorCode } from '@shared/utils/error-message'
import {
  useProfileAddressAvailability,
  useSaveProfileAddress,
} from '../../hooks/use-profile-address'
import type { ProfileAddressDialogProps } from '../../types/profile-address'
import { styles } from '../../styles/profile-address.styles'

export function PublicProfileAddressDialog({
  kind,
  handle: currentHandle,
  onClose,
}: ProfileAddressDialogProps) {
  const t = useTranslations('marketplace.profileAddress')
  const titleId = useId()
  const { enqueueSnackbar } = useSnackbar()
  const [value, setValue] = useState(currentHandle ?? '')
  const [checkedHandle, setCheckedHandle] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)
  const handle = normalizePublicProfileHandle(value)
  const valid = isValidPublicProfileHandle(handle)
  const reserved = isReservedPublicProfileHandle(handle)
  const availability = useProfileAddressAvailability(
    kind,
    valid && !reserved ? checkedHandle : null,
  )
  const save = useSaveProfileAddress(kind)
  const taken =
    availability.data?.available === false ||
    getApiErrorCode(save.error) === 'PUBLIC_PROFILE_ADDRESS_TAKEN'
  const invalid = touched && (!valid || reserved)
  const helper = invalid
    ? t(reserved ? 'reserved' : 'format')
    : taken
      ? t('taken')
      : save.isError
        ? t('saveError')
        : availability.isFetching
          ? t('checking')
          : availability.isError
            ? t('checkError')
            : availability.data?.available
              ? t('available')
              : t('format')

  return (
    <Dialog
      open
      onClose={save.isPending ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby={titleId}
    >
      <Box
        component="form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setTouched(true)
          if (!valid || reserved || taken || save.isPending) return
          save.mutate(handle, {
            onSuccess: () => {
              enqueueSnackbar(t('saved'), { variant: 'success' })
              onClose()
            },
          })
        }}
      >
        <DialogTitle id={titleId}>{t('edit')}</DialogTitle>
        <DialogContent>
          <Typography>{t('description')}</Typography>
          <TextField
            fullWidth
            autoFocus
            label={t('label')}
            value={value}
            sx={styles.field}
            disabled={save.isPending}
            error={invalid || taken || save.isError}
            helperText={helper}
            onChange={(event) => {
              setValue(event.target.value)
              setCheckedHandle(null)
              setTouched(false)
              save.reset()
            }}
            onBlur={() => {
              setTouched(true)
              setValue(handle)
              if (valid && !reserved) setCheckedHandle(handle)
            }}
            slotProps={{
              input: { startAdornment: <InputAdornment position="start">/@</InputAdornment> },
              htmlInput: {
                autoCapitalize: 'none',
                autoCorrect: 'off',
                spellCheck: false,
                maxLength: 40,
              },
            }}
          />
          <Typography variant="body2" sx={styles.hint}>
            {t('renameWarning')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button type="button" disabled={save.isPending} onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            loading={save.isPending}
            disabled={!valid || reserved || taken || save.isPending || handle === currentHandle}
          >
            {t('save')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
