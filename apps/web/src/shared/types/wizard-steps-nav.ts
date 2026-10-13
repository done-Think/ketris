import type { SxProps, Theme } from '@mui/material'

export interface WizardStepsNavStep {
  key: string
}

export interface WizardStepsNavProps<TStep extends WizardStepsNavStep> {
  steps: readonly TStep[]
  activeStepIndex: number
  reachableUpToIndex?: number
  completedUpToIndex?: number
  ariaLabel: string
  getStepLabel: (step: TStep, index: number) => string
  onStepSelect: (stepIndex: number) => void
  gridTemplateColumns: string | Record<string, string>
  fillActiveStep?: boolean
  mobileProgressLabel?: (current: number, total: number) => string
  sx?: SxProps<Theme>
}
