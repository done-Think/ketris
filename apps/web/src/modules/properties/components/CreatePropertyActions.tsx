import { Button, Stack } from '@mui/material'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import { useTranslations } from 'next-intl'

import { alpha, iconSize, radius, surface, zIndex } from '@shared/theme/tokens'

import type { CreatePropertyActionsProps } from '../types/dashboard-property'

export function CreatePropertyActions({
  firstStep,
  lastStep,
  isSubmitting,
  onPreviousStep,
  onNextStep,
  submitLabel,
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
        // A key própria (não só `type` dinâmico) força o React a desmontar/remontar em vez de
        // mutar o atributo `type` do <button> existente no meio do próprio evento de clique —
        // sem isso, um clique em "Próximo" no penúltimo passo pode virar submit nativo antes do
        // navegador terminar de processar esse mesmo clique (mesma causa raiz já corrigida em
        // AgendaEventDetailDialog e CreateLeadDialog).
        key={lastStep ? 'submit' : 'next'}
        type={lastStep ? 'submit' : 'button'}
        variant="contained"
        endIcon={!lastStep ? <ChevronRightRoundedIcon sx={{ fontSize: iconSize.sm }} /> : null}
        onClick={lastStep ? undefined : onNextStep}
        disabled={lastStep && isSubmitting}
        sx={{
          flex: { xs: 1, md: 'initial' },
          minHeight: { xs: 44, md: 40 },
          px: 2.4,
          borderRadius: `${radius.sm}px`,
          fontWeight: 900,
        }}
      >
        {lastStep ? (submitLabel ?? t('publish')) : t('next')}
      </Button>
    </Stack>
  )
}
