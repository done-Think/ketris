import { alpha, componentText, radius, shadows } from '@shared/theme/tokens'

export const styles = {
  button: (isHeader: boolean) =>
    ({
      justifyContent: 'flex-start',
      minHeight: 42,
      borderRadius: `${radius.sm}px`,
      color: 'text.primary',
      px: isHeader ? 1.3 : undefined,
      minWidth: isHeader ? 88 : undefined,
      ...componentText.resetButtonText,
      ...componentText.modalAction,
      '& .MuiButton-endIcon': {
        ml: 'auto',
      },
      '&:hover': {
        bgcolor: alpha.magenta[8],
        color: 'primary.main',
      },
    }) as const,
  stack: { width: '100%', minWidth: 0 },
  box: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    objectFit: 'cover',
    boxShadow: `0 0 0 1px ${alpha.graphite[10]}`,
  },
  paper: {
    mt: 0.75,
    borderRadius: `${radius.sm}px`,
    boxShadow: shadows.popover,
    minWidth: 176,
  },
  menuItem: { minHeight: 40, gap: 1.2 },
  box2: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    objectFit: 'cover',
    boxShadow: `0 0 0 1px ${alpha.graphite[10]}`,
  },
} as const
