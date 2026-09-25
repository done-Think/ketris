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
  /** Highest step index rendered as completed. Defaults to the step before the active one. */
  completedUpToIndex?: number
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
  /**
   * Replaces the full step grid with a compact dots + "current/total" bar below `md`. Meant for
   * longer wizards (5+ steps) where the full grid gets cramped on narrow screens.
   */
  mobileProgressLabel?: (current: number, total: number) => string
  sx?: SxProps<Theme>
}

export function WizardStepsNav<TStep extends WizardStepsNavStep>({
  steps,
  activeStepIndex,
  reachableUpToIndex = activeStepIndex,
  completedUpToIndex,
  ariaLabel,
  getStepLabel,
  onStepSelect,
  gridTemplateColumns,
  fillActiveStep = false,
  mobileProgressLabel,
  sx,
}: WizardStepsNavProps<TStep>) {
  const stepsGrid = (
    <Box
      aria-label={ariaLabel}
      sx={{
        display: { xs: mobileProgressLabel ? 'none' : 'grid', md: 'grid' },
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
        const completed = index <= (completedUpToIndex ?? activeStepIndex - 1)
        const filled = fillActiveStep ? reachable : completed
        const connectorFilled = fillActiveStep
          ? index < reachableUpToIndex
          : index <= (completedUpToIndex ?? activeStepIndex - 1)
        const showCheck = filled && !active

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

  if (!mobileProgressLabel) return stepsGrid

  return (
    <>
      <Stack
        aria-label={ariaLabel}
        direction="row"
        alignItems="center"
        justifyContent="center"
        spacing={0.8}
        sx={{ display: { xs: 'flex', md: 'none' }, mb: 0 }}
      >
        <Box sx={{ width: 18, height: 7, borderRadius: radius.full, bgcolor: 'primary.main' }} />
        <Typography sx={{ color: 'primary.main', fontSize: 12, fontWeight: 800 }}>
          {mobileProgressLabel(activeStepIndex + 1, steps.length)}
        </Typography>
        {steps.map((step, index) => (
          <Box
            key={step.key}
            component="button"
            type="button"
            aria-label={getStepLabel(step, index)}
            disabled={index > reachableUpToIndex}
            onClick={() => {
              if (index <= reachableUpToIndex) onStepSelect(index)
            }}
            sx={{
              width: 7,
              height: 7,
              border: 0,
              borderRadius: radius.full,
              bgcolor: index <= reachableUpToIndex ? 'primary.main' : 'text.disabled',
              cursor: index <= reachableUpToIndex ? 'pointer' : 'default',
              p: 0,
            }}
          />
        ))}
      </Stack>

      {stepsGrid}
    </>
  )
}
