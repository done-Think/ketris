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
import { useForm, useWatch, type FieldErrors } from 'react-hook-form'

import {
  agencyBrandColorFields,
  agencyBrandWizardStepFields,
  agencyBrandWizardSteps,
} from '../../config/agency-brand-fields'
import { createAgencyBrandEditorSchema } from '../../schemas/agency-public-profile-editor-schema'
import { styles } from '../../styles/agency-brand-editor.styles'
import type {
  AgencyBrandColorField,
  AgencyBrandDialogContentProps,
  AgencyBrandDialogMode,
  AgencyBrandDialogProps,
  AgencyBrandFormValues,
  AgencyBrandSuggestedPalette,
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

function AgencyBrandDialogContent({
  initialMode,
  initialValues,
  buildPreview,
  onClose,
  onApply,
}: AgencyBrandDialogContentProps) {
  const t = useTranslations('marketplace.agencyProfileEditor')
  const schema = useMemo(() => createAgencyBrandEditorSchema((key) => t(`errors.${key}`)), [t])
  const { control, handleSubmit, setValue, trigger } = useForm<AgencyBrandFormValues>({
    defaultValues: initialValues,
    resolver: zodResolver(schema),
  })
  const values = useWatch({ control }) as AgencyBrandFormValues
  const [mode, setMode] = useState<AgencyBrandDialogMode>(initialMode)
  const [stepIndex, setStepIndex] = useState(0)
  const [highlighted, setHighlighted] = useState<AgencyBrandColorField | null>(null)
  const { data: suggestion = null } = useLogoPalette(values.logoUrl)
  const isUploading = useIsUploadingProfileMedia()
  const isLastStep = stepIndex === agencyBrandWizardSteps.length - 1
  const apply = handleSubmit(onApply, showFirstStepWithErrors)

  function applyPalette(palette: AgencyBrandSuggestedPalette) {
    for (const field of agencyBrandColorFields) {
      setValue(field, palette[field], { shouldValidate: true })
    }
  }

  async function goToNextStep() {
    const fields = agencyBrandWizardStepFields[agencyBrandWizardSteps[stepIndex]]
    if (fields && !(await trigger([...fields]))) return
    setStepIndex(stepIndex + 1)
  }

  function showFirstStepWithErrors(errors: FieldErrors<AgencyBrandFormValues>) {
    if (mode !== 'wizard') return
    const index = agencyBrandWizardSteps.findIndex((step) =>
      agencyBrandWizardStepFields[step]?.some((field) => errors[field]),
    )
    if (index >= 0) setStepIndex(index)
  }

  return (
    <>
      <DialogContent dividers sx={styles.dialogContent}>
        <Box sx={styles.controls}>
          {mode === 'wizard' ? (
            <>
              <Stepper activeStep={stepIndex} alternativeLabel sx={styles.stepper}>
                {agencyBrandWizardSteps.map((step) => (
                  <Step key={step}>
                    <StepLabel>{t(`brand.wizard.steps.${step}`)}</StepLabel>
                  </Step>
                ))}
              </Stepper>
              <AgencyBrandWizardStep
                step={agencyBrandWizardSteps[stepIndex]}
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
          <AgencyBrandPreview agency={buildPreview(values)} highlightedColor={highlighted} />
        </Box>
      </DialogContent>
      {mode === 'wizard' ? (
        <DialogActions sx={styles.dialogActions}>
          <Button
            color="secondary"
            disabled={isUploading}
            onClick={() => setMode('panel')}
            sx={styles.skipButton}
          >
            {t('brand.wizard.skip')}
          </Button>
          <Box sx={styles.dialogActionsSpacer} />
          <Button color="secondary" onClick={onClose} sx={styles.footerButton}>
            {t('brand.cancel')}
          </Button>
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
            onClick={isLastStep ? apply : () => void goToNextStep()}
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
