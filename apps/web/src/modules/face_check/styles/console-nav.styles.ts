export const consoleNavStyles = {
  shell: { display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, width: '100%' },
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    overflowX: 'auto',
    py: 1,
    px: 0.5,
    width: '100%',
  },
  item: { flexShrink: 0, px: { xs: 1.5, sm: 2 }, whiteSpace: 'nowrap', minHeight: 44 },
} as const
