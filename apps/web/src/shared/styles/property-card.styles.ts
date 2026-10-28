import { componentText, iconSize, motion, radius, shadows } from '@shared/theme/tokens'

export const styles = {
  card: {
    overflow: 'hidden',
    borderRadius: `${radius.sm}px`,
    color: 'inherit',
    textDecoration: 'none',
    boxShadow: shadows.propertyCard,
    transition: motion.transition.card,
    '&:hover': {
      boxShadow: shadows.propertyCardHover,
      transform: 'translateY(-4px)',
    },
  },
  box: (image: string) =>
    ({
      position: 'relative',
      height: 175,
      backgroundImage: `url("${image}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }) as const,
  box2: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  cardContent: { p: 2.4 },
  typography: {
    color: 'text.secondary',
    ...componentText.cardEyebrow,
    mb: 0.6,
  },
  typography2: { ...componentText.cardTitle, mb: 1 },
  typography3: { ...componentText.cardPrice, mb: 1.5 },
  stack: { mb: 2 },
  icon: { color: 'text.secondary', fontSize: iconSize.xs },
  divider: { mb: 1.6 },
  avatar: { width: 30, height: 30 },
  typography4: {
    color: 'primary.main',
    ...componentText.cardAction,
  },
} as const
