import { Box, Stack, Typography } from '@mui/material'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { useTranslations } from 'next-intl'

import { brand, iconSize, motion, radius, surface } from '@shared/theme/tokens'

import { createPropertySteps } from '../config/dashboard-property-ui'
import type { CreatePropertyStepsNavProps } from '../types/dashboard-property'

export function CreatePropertyStepsNav({
  activeStepIndex,
  maxVisitedStepIndex,
  onStepSelect,
}: CreatePropertyStepsNavProps) {
  const t = useTranslations('properties.create.steps')

  return (
    <>
      <Stack
        aria-label={t('ariaLabel')}
        direction="row"
        alignItems="center"
        justifyContent="center"
        spacing={0.8}
        sx={{ display: { xs: 'flex', md: 'none' }, mb: 0 }}
      >
        <Box
          sx={{
            width: 18,
            height: 7,
            borderRadius: radius.full,
            bgcolor: 'primary.main',
          }}
        />
        <Typography sx={{ color: 'primary.main', fontSize: 12, fontWeight: 800 }}>
          {t('progress', { current: activeStepIndex + 1, total: createPropertySteps.length })}
        </Typography>
        {createPropertySteps.map((step, index) => (
          <Box
            key={step.key}
            component="button"
            type="button"
            aria-label={t(step.key)}
            disabled={index > maxVisitedStepIndex}
            onClick={() => {
              if (index <= maxVisitedStepIndex) onStepSelect(index)
            }}
            sx={{
              width: 7,
              height: 7,
              border: 0,
              borderRadius: radius.full,
              bgcolor: index <= maxVisitedStepIndex ? 'primary.main' : brand.neutral[100],
              cursor: index <= maxVisitedStepIndex ? 'pointer' : 'default',
              p: 0,
            }}
          />
        ))}
      </Stack>

      <Box
        aria-label={t('ariaLabel')}
        sx={{
          display: { xs: 'none', md: 'grid' },
          gridTemplateColumns: { md: 'repeat(6, minmax(0, 1fr))' },
          alignItems: 'center',
          gap: 0,
          mb: 3,
        }}
      >
        {createPropertySteps.map((step, index) => {
          const active = index === activeStepIndex
          const completed = index <= maxVisitedStepIndex && !active
          const reached = index <= maxVisitedStepIndex
          const reachable = reached

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
                color: active || completed ? 'primary.main' : 'text.secondary',
                cursor: reachable ? 'pointer' : 'default',
                opacity: reachable ? 1 : 0.76,
                p: 0,
                textAlign: 'left',
                transition: motion.transition.interactive,
                '&::after': {
                  content: index === createPropertySteps.length - 1 ? 'none' : '""',
                  display: 'block',
                  flex: 1,
                  height: 1,
                  bgcolor: index < maxVisitedStepIndex ? 'primary.main' : 'divider',
                  ml: 1,
                },
                '&:hover': {
                  color: reachable ? 'primary.main' : 'text.secondary',
                },
              }}
            >
              <Box
                sx={{
                  width: 25,
                  height: 25,
                  borderRadius: radius.full,
                  border: '2px solid',
                  borderColor: reached ? 'primary.main' : brand.neutral[400],
                  color: completed ? surface.lightText : active ? 'primary.main' : 'text.secondary',
                  bgcolor: completed ? 'primary.main' : 'transparent',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  fontSize: 12,
                  fontWeight: 900,
                }}
              >
                {completed ? <CheckRoundedIcon sx={{ fontSize: iconSize.xs }} /> : index + 1}
              </Box>
              <Typography
                noWrap
                sx={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: active ? 900 : 700,
                }}
              >
                {t(step.key)}
              </Typography>
            </Stack>
          )
        })}
      </Box>
    </>
  )
}
