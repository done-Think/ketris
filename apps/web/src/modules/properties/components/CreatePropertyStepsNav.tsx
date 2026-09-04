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
    <Box
      aria-label={t('ariaLabel')}
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(6, minmax(0, 1fr))' },
        alignItems: 'center',
        gap: { xs: 1, md: 0 },
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
                display: { xs: 'none', md: 'block' },
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
            <Typography noWrap sx={{ fontSize: 13, fontWeight: active ? 900 : 700 }}>
              {t(step.key)}
            </Typography>
          </Stack>
        )
      })}
    </Box>
  )
}
