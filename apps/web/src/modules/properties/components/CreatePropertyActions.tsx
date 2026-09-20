import { Button, Stack } from '@mui/material'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import { useTranslations } from 'next-intl'

import { alpha, iconSize, radius, surface, zIndex } from '@shared/theme/tokens'

import type { CreatePropertyActionsProps } from '../types/dashboard-property'

export function CreatePropertyActions({
  firstStep,
  lastStep,
  onPreviousStep,
  onNextStep,
}: CreatePropertyActionsProps) {
  const t = useTranslations('properties.create')

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      spacing={1.2}
      sx={{
        position: { xs: 'fixed', md: 'static' },
        right: { xs: 0, md: 'auto' },
        bottom: { xs: 0, md: 'auto' },
        left: { xs: 0, md: 'auto' },
        zIndex: { xs: zIndex.header, md: 'auto' },
        bgcolor: { xs: surface.paper, md: 'transparent' },
        borderTop: { xs: '1px solid', md: 0 },
        borderColor: { xs: alpha.graphite[8], md: 'transparent' },
        p: { xs: 1.6, md: 0 },
      }}
    >
      <Button
        type="button"
        variant="outlined"
        color="secondary"
        startIcon={<ChevronLeftRoundedIcon sx={{ fontSize: iconSize.sm }} />}
        disabled={firstStep}
        onClick={onPreviousStep}
        sx={{
          display: { xs: firstStep ? 'none' : 'inline-flex', md: 'inline-flex' },
          minHeight: 40,
          px: 2.4,
          borderRadius: `${radius.sm}px`,
          fontWeight: 900,
        }}
      >
        {t('back')}
      </Button>
      <Button
        type={lastStep ? 'submit' : 'button'}
        variant="contained"
        endIcon={!lastStep ? <ChevronRightRoundedIcon sx={{ fontSize: iconSize.sm }} /> : null}
        onClick={lastStep ? undefined : onNextStep}
        sx={{
          flex: { xs: 1, md: 'initial' },
          minHeight: { xs: 44, md: 40 },
          px: 2.4,
          borderRadius: `${radius.sm}px`,
          fontWeight: 900,
        }}
      >
        {lastStep ? t('publish') : t('next')}
      </Button>
    </Stack>
  )
}
