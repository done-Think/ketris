import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { Box, Stack, Typography } from '@mui/material'

import { createContractSteps } from '../config/contract-ui'
import type { ContractStepsNavProps } from '../types/contract'
import { alpha, brand, iconSize, motion, radius, surface } from '@shared/theme/tokens'

export function ContractStepsNav({
  activeStepIndex,
  maxStepIndex,
  onStepSelect,
}: ContractStepsNavProps) {
  return (
    <Box
      aria-label="Etapas do contrato"
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, 1fr)' },
        alignItems: 'center',
        columnGap: { xs: 1.4, md: 2.4, xl: 4 },
        rowGap: 1.2,
        mb: { xs: 2.4, md: 3.3 },
      }}
    >
      {createContractSteps.map((step, index) => {
        const active = index === activeStepIndex
        const approved = index <= maxStepIndex
        const completed = approved && !active
        const connectorApproved = index < maxStepIndex

        return (
          <Stack
            key={step.key}
            component="button"
            type="button"
            direction="row"
            alignItems="center"
            spacing={1}
            disabled={!approved}
            onClick={() => {
              if (approved) onStepSelect(index)
            }}
            sx={{
              minWidth: 0,
              border: 0,
              bgcolor: 'transparent',
              color: approved ? brand.magenta[500] : brand.neutral[500],
              cursor: approved ? 'pointer' : 'default',
              opacity: approved ? 1 : 0.78,
              p: 0,
              textAlign: 'left',
              transition: motion.transition.interactive,
              '&::after': {
                content: index === createContractSteps.length - 1 ? 'none' : '""',
                display: { xs: 'none', lg: 'block' },
                flex: 1,
                height: 1,
                bgcolor: connectorApproved ? brand.magenta[500] : alpha.graphite[8],
              },
              '&:hover': {
                color: approved ? brand.magenta[500] : brand.neutral[500],
              },
            }}
          >
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: radius.full,
                border: '1px solid',
                borderColor: approved ? brand.magenta[500] : brand.neutral[300],
                bgcolor: approved ? brand.magenta[500] : surface.paper,
                color: approved ? surface.lightText : brand.neutral[500],
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
              {step.label}
            </Typography>
          </Stack>
        )
      })}
    </Box>
  )
}
