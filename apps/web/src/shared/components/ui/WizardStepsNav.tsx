'use client'

import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { Box, Stack, Typography } from '@mui/material'
import type { SxProps, Theme } from '@mui/material'

import { iconSize, motion, radius } from '@shared/theme/tokens'

export interface WizardStepsNavStep {
  key: string
}

export interface WizardStepsNavProps<TStep extends WizardStepsNavStep> {
  steps: readonly TStep[]
  activeStepIndex: number
  /** Highest index the user may jump to. Defaults to `activeStepIndex` (strictly-linear wizard). */
  reachableUpToIndex?: number
  ariaLabel: string
  getStepLabel: (step: TStep, index: number) => string
  onStepSelect: (stepIndex: number) => void
  gridTemplateColumns: string | Record<string, string>
  /**
   * `true`: the active step's circle fills in like a completed one (used while a step is being
   * actively filled and any reachable step counts as "done enough"). `false` (default): only
   * strictly-completed steps (before the active one) are filled.
   */
  fillActiveStep?: boolean
  sx?: SxProps<Theme>
}

export function WizardStepsNav<TStep extends WizardStepsNavStep>({
  steps,
  activeStepIndex,
  reachableUpToIndex = activeStepIndex,
  ariaLabel,
  getStepLabel,
  onStepSelect,
  gridTemplateColumns,
  fillActiveStep = false,
  sx,
}: WizardStepsNavProps<TStep>) {
  return (
    <Box
      aria-label={ariaLabel}
      sx={{
        display: 'grid',
        gridTemplateColumns,
        alignItems: 'center',
        columnGap: { xs: 1.4, md: 2.4 },
        rowGap: 1.2,
        mb: { xs: 2.4, md: 3 },
        ...sx,
      }}
    >
      {steps.map((step, index) => {
        const active = index === activeStepIndex
        const reachable = index <= reachableUpToIndex
        const filled = fillActiveStep ? reachable : index < activeStepIndex
        const connectorFilled = fillActiveStep
          ? index < reachableUpToIndex
          : index < activeStepIndex
        const showCheck = filled && !(fillActiveStep && active)

        return (
          <Stack
            key={step.key}
            component="button"
            type="button"
            direction="row"
            alignItems="center"
            spacing={1}
            disabled={!reachable}
            onClick={() => {
              if (reachable) onStepSelect(index)
            }}
            sx={{
              minWidth: 0,
              border: 0,
              bgcolor: 'transparent',
              color: filled || active ? 'primary.main' : 'text.secondary',
              cursor: reachable ? 'pointer' : 'default',
              opacity: reachable ? 1 : 0.78,
              p: 0,
              textAlign: 'left',
              transition: motion.transition.interactive,
              '&::after': {
                content: index === steps.length - 1 ? 'none' : '""',
                display: { xs: 'none', md: 'block' },
                flex: 1,
                height: 1,
                bgcolor: connectorFilled ? 'primary.main' : 'divider',
                ml: 1,
              },
              '&:hover': {
                color: reachable ? 'primary.main' : 'text.secondary',
              },
            }}
          >
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: radius.full,
                border: '2px solid',
                borderColor: filled || active ? 'primary.main' : 'text.disabled',
                bgcolor: filled ? 'primary.main' : 'transparent',
                color: filled ? 'primary.contrastText' : active ? 'primary.main' : 'text.secondary',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              {showCheck ? <CheckRoundedIcon sx={{ fontSize: iconSize.xs }} /> : index + 1}
            </Box>
            <Typography noWrap sx={{ fontSize: 13, fontWeight: active ? 900 : 700 }}>
              {getStepLabel(step, index)}
            </Typography>
          </Stack>
        )
      })}
    </Box>
  )
}
