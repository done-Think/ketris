'use client'

import { styles } from '@shared/styles/wizard-steps-nav.styles'
import { combineSx } from '@shared/utils/combine-sx'

import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { Box, Stack, Typography } from '@mui/material'

import type { WizardStepsNavProps, WizardStepsNavStep } from '@shared/types/wizard-steps-nav'

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
      sx={combineSx(styles.box(Boolean(mobileProgressLabel), gridTemplateColumns), sx)}
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
            sx={styles.stack(
              index === steps.length - 1,
              filled,
              active,
              reachable,
              connectorFilled,
            )}
          >
            <Box sx={styles.box2(filled, active)}>
              {showCheck ? <CheckRoundedIcon sx={styles.checkRoundedIcon} /> : index + 1}
            </Box>
            <Typography noWrap sx={styles.typography(active)}>
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
        sx={styles.stack2}
      >
        <Box sx={styles.box3} />
        <Typography sx={styles.typography2}>
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
            sx={styles.box4(index <= reachableUpToIndex)}
          />
        ))}
      </Stack>

      {stepsGrid}
    </>
  )
}
