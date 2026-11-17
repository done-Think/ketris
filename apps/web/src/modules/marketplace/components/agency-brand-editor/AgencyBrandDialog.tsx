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
  Step,
  StepLabel,
  Stepper,
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
  AgencyBrandDialogMode,
  AgencyBrandDialogProps,
  AgencyBrandFormValues,
  AgencyBrandSuggestedPalette,
  AgencyBrandWizardStep as AgencyBrandWizardStepName,
} from '../../types/agency-brand-editor'
import { useLogoPalette } from '../../hooks/use-logo-palette'
import { useIsUploadingProfileMedia } from '../../hooks/use-profile-media'
import { AgencyBrandColorFields } from './AgencyBrandColorFields'
import { AgencyBrandImageField } from './AgencyBrandImageField'
import { AgencyBrandPreview } from './AgencyBrandPreview'
import { AgencyBrandWizardStep } from './AgencyBrandWizardStep'

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

const wizardSteps: readonly AgencyBrandWizardStepName[] = ['logo', 'colors', 'cover', 'review']

function AgencyBrandDialogContent({
  initialMode,
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
  const [mode, setMode] = useState<AgencyBrandDialogMode>(initialMode)
  const [stepIndex, setStepIndex] = useState(0)
  const [highlighted, setHighlighted] = useState<AgencyBrandColorField | null>(null)
  const { data: suggestion = null } = useLogoPalette(values.logoUrl)
  const isUploading = useIsUploadingProfileMedia()
  const previewValues = highlighted
    ? { ...values, [highlighted]: brandPreviewHighlightColor }
    : values
  const isLastStep = stepIndex === wizardSteps.length - 1
  const apply = handleSubmit(onApply)

  function applyPalette(palette: AgencyBrandSuggestedPalette) {
    setValue('backgroundColor', palette.backgroundColor, { shouldValidate: true })
    setValue('primaryColor', palette.primaryColor, { shouldValidate: true })
    setValue('secondaryColor', palette.secondaryColor, { shouldValidate: true })
  }

  return (
    <>
      <DialogContent dividers sx={styles.dialogContent}>
        <Box sx={styles.controls}>
          {mode === 'wizard' ? (
            <>
              <Stepper activeStep={stepIndex} alternativeLabel sx={styles.stepper}>
                {wizardSteps.map((step) => (
                  <Step key={step}>
                    <StepLabel>{t(`brand.wizard.steps.${step}`)}</StepLabel>
                  </Step>
                ))}
              </Stepper>
              <AgencyBrandWizardStep
                step={wizardSteps[stepIndex]}
                control={control}
                values={values}
                suggestion={suggestion}
                onApplyPalette={applyPalette}
                onHighlight={setHighlighted}
              />
            </>
          ) : (
            <>
              <Box sx={styles.section}>
                <Typography sx={styles.sectionTitle}>{t('fields.images')}</Typography>
                <AgencyBrandImageField control={control} name="logoUrl" />
                <AgencyBrandImageField control={control} name="bannerUrl" />
              </Box>
              <AgencyBrandColorFields
                control={control}
                values={values}
                suggestion={suggestion}
                onApplyPalette={applyPalette}
                onHighlight={setHighlighted}
              />
            </>
          )}
        </Box>
        <Box sx={styles.previewSide}>
          <AgencyBrandPreview agency={buildPreview(previewValues)} />
        </Box>
      </DialogContent>
      {mode === 'wizard' ? (
        <DialogActions sx={styles.dialogActions}>
          <Button color="secondary" onClick={() => setMode('panel')} sx={styles.skipButton}>
            {t('brand.wizard.skip')}
          </Button>
          <Box sx={styles.dialogActionsSpacer} />
          <Button
            color="secondary"
            variant="outlined"
            disabled={stepIndex === 0 || isUploading}
            onClick={() => setStepIndex(stepIndex - 1)}
            sx={styles.footerButton}
          >
            {t('brand.wizard.back')}
          </Button>
          <Button
            variant="contained"
            disabled={isUploading}
            onClick={isLastStep ? apply : () => setStepIndex(stepIndex + 1)}
            sx={styles.footerButton}
          >
            {isLastStep ? t('brand.apply') : t('brand.wizard.next')}
          </Button>
        </DialogActions>
      ) : (
        <DialogActions sx={styles.dialogActions}>
          <Box sx={styles.dialogActionsSpacer} />
          <Button color="secondary" variant="outlined" onClick={onClose} sx={styles.footerButton}>
            {t('brand.cancel')}
          </Button>
          <Button
            variant="contained"
            disabled={isUploading}
            onClick={apply}
            sx={styles.footerButton}
          >
            {t('brand.apply')}
          </Button>
        </DialogActions>
      )}
    </>
  )
}
