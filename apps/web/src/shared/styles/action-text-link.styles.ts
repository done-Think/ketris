import { componentText } from '@shared/theme/tokens'

export const styles = {
  muiLink: {
    color: 'primary.main',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0.5,
    ...componentText.sectionAction,
  },
} as const
