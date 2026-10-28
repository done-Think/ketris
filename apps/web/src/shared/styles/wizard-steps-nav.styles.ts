import { iconSize, motion, radius } from '@shared/theme/tokens'

export const styles = {
  box: (mobileProgress: boolean, gridTemplateColumns: string | Record<string, string>) =>
    ({
      display: { xs: mobileProgress ? 'none' : 'grid', md: 'grid' },
      gridTemplateColumns,
      alignItems: 'center',
      columnGap: { xs: 1.4, md: 2.4 },
      rowGap: 1.2,
      mb: { xs: 2.4, md: 3 },
    }) as const,
  stack: (
    last: boolean,
    filled: boolean,
    active: boolean,
    reachable: boolean,
    connectorFilled: boolean,
  ) =>
    ({
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
        content: last ? 'none' : '""',
        display: { xs: 'none', md: 'block' },
        flex: 1,
        height: 1,
        bgcolor: connectorFilled ? 'primary.main' : 'divider',
        ml: 1,
      },
      '&:hover': {
        color: reachable ? 'primary.main' : 'text.secondary',
      },
    }) as const,
  box2: (filled: boolean, active: boolean) =>
    ({
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
    }) as const,
  checkRoundedIcon: { fontSize: iconSize.xs },
  typography: (active: boolean) => ({ fontSize: 13, fontWeight: active ? 900 : 700 }) as const,
  stack2: { display: { xs: 'flex', md: 'none' }, mb: 0 },
  box3: { width: 18, height: 7, borderRadius: radius.full, bgcolor: 'primary.main' },
  typography2: { color: 'primary.main', fontSize: 12, fontWeight: 800 },
  box4: (reachable: boolean) =>
    ({
      width: 7,
      height: 7,
      border: 0,
      borderRadius: radius.full,
      bgcolor: reachable ? 'primary.main' : 'text.disabled',
      cursor: reachable ? 'pointer' : 'default',
      p: 0,
    }) as const,
} as const
