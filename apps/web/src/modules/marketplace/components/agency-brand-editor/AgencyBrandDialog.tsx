'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { createAgencyBrandEditorSchema } from '../../schemas/agency-public-profile-editor-schema'
import { brandPreviewHighlightColor, styles } from '../../styles/agency-brand-editor.styles'
import type {
  AgencyBrandColorField,
  AgencyBrandDialogContentProps,
  AgencyBrandDialogProps,
  AgencyBrandFormValues,
  AgencyBrandPalette,
} from '../../types/agency-brand-editor'
import { SingleImageUploadField } from '../public-profile-editor/SingleImageUploadField'
import { AgencyBrandColorFields } from './AgencyBrandColorFields'
import { AgencyBrandPreview } from './AgencyBrandPreview'

export function AgencyBrandDialog({ open, onClose, ...contentProps }: AgencyBrandDialogProps) {
  const t = useTranslations('marketplace.agencyProfileEditor.brand')
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'))

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="lg"
      aria-labelledby="agency-brand-dialog-title"
      slotProps={{ paper: { sx: styles.dialogPaper } }}
    >
      <DialogTitle id="agency-brand-dialog-title" sx={styles.dialogTitle}>
        <Box component="span" sx={styles.dialogTitleText}>
          {t('dialogTitle')}
        </Box>
        <IconButton aria-label={t('close')} onClick={onClose}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      {open ? <AgencyBrandDialogContent onClose={onClose} {...contentProps} /> : null}
    </Dialog>
  )
}

function AgencyBrandDialogContent({
  initialValues,
  buildPreview,
  onClose,
  onApply,
}: AgencyBrandDialogContentProps) {
  const t = useTranslations('marketplace.agencyProfileEditor')
  const schema = useMemo(() => createAgencyBrandEditorSchema((key) => t(`errors.${key}`)), [t])
  const { control, handleSubmit, setValue } = useForm<AgencyBrandFormValues>({
    defaultValues: initialValues,
    resolver: zodResolver(schema),
  })
  const values = useWatch({ control }) as AgencyBrandFormValues
  const [highlighted, setHighlighted] = useState<AgencyBrandColorField | null>(null)
  const previewValues = highlighted
    ? { ...values, [highlighted]: brandPreviewHighlightColor }
    : values

  function applyPalette(palette: AgencyBrandPalette) {
    setValue('backgroundColor', palette.backgroundColor, { shouldValidate: true })
    setValue('primaryColor', palette.primaryColor, { shouldValidate: true })
    setValue('secondaryColor', palette.secondaryColor, { shouldValidate: true })
  }

  return (
    <>
      <DialogContent dividers sx={styles.dialogContent}>
        <Box sx={styles.controls}>
          <Box sx={styles.section}>
            <Typography sx={styles.sectionTitle}>{t('fields.images')}</Typography>
            <SingleImageUploadField
              control={control}
              name="logoUrl"
              label={t('fields.logoUrl')}
              hint={t('brand.logoHint')}
              target="agency-logo"
              variant="avatar"
            />
            <SingleImageUploadField
              control={control}
              name="bannerUrl"
              label={t('fields.bannerUrl')}
              hint={t('brand.bannerHint')}
              target="agency-banner"
              variant="banner"
            />
          </Box>
          <AgencyBrandColorFields
            control={control}
            values={values}
            onApplyPalette={applyPalette}
            onHighlight={setHighlighted}
          />
        </Box>
        <Box sx={styles.previewSide}>
          <AgencyBrandPreview agency={buildPreview(previewValues)} />
        </Box>
      </DialogContent>
      <DialogActions sx={styles.dialogActions}>
        <Box sx={styles.dialogActionsSpacer} />
        <Button color="secondary" variant="outlined" onClick={onClose} sx={styles.footerButton}>
          {t('brand.cancel')}
        </Button>
        <Button variant="contained" onClick={handleSubmit(onApply)} sx={styles.footerButton}>
          {t('brand.apply')}
        </Button>
      </DialogActions>
    </>
  )
}
