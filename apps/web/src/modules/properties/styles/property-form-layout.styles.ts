import type { SxProps, Theme } from '@mui/material'
import { alpha, radius, shadows, surface, zIndex } from '@shared/theme/tokens'

const mobileDashboardHeaderHeight = 64
const mobileCreateHeaderHeight = 104
const mobileActionsHeight = 78
const mobileContentGap = 24

export const styles = {
  page: {
    width: '100%',
    px: { xs: 1.6, md: 3.5 },
    pt: { xs: `${mobileCreateHeaderHeight}px`, md: 3.5 },
    pb: { xs: 10.5, md: 3.5 },
  },
  content: { width: '100%', maxWidth: { xs: 440, md: 'none' }, mx: { xs: 'auto', md: 0 } },
  header: {
    position: { xs: 'fixed', md: 'static' },
    top: { xs: mobileDashboardHeaderHeight, md: 'auto' },
    right: { xs: 0, md: 'auto' },
    left: { xs: 0, md: 'auto' },
    zIndex: { xs: zIndex.content, md: 'auto' },
    height: { xs: mobileCreateHeaderHeight, md: 'auto' },
    minHeight: { xs: mobileCreateHeaderHeight, md: 'auto' },
    maxHeight: { xs: mobileCreateHeaderHeight, md: 'none' },
    bgcolor: { xs: surface.app, md: 'transparent' },
    px: { xs: 1.6, md: 0 },
    overflow: 'hidden',
  },
  headerContent: {
    display: 'grid',
    justifyItems: { xs: 'center', md: 'stretch' },
    alignContent: { xs: 'center', md: 'initial' },
    gap: { xs: 1.2, md: 0 },
    width: '100%',
    maxWidth: { xs: 440, md: 'none' },
    height: { xs: '100%', md: 'auto' },
    mx: { xs: 'auto', md: 0 },
    transform: { xs: 'translateY(8px)', md: 'none' },
  },
  title: {
    fontSize: { xs: 20, md: 24 },
    fontWeight: 800,
    mb: { xs: 0, md: 3 },
    textAlign: { xs: 'center', md: 'left' },
  },
  desktopTitle: { display: { xs: 'none', md: 'inline' } },
  mobileTitle: { display: { xs: 'inline', md: 'none' } },
  form: {
    bgcolor: surface.paper,
    border: '1px solid',
    borderColor: { xs: alpha.graphite[6], md: alpha.graphite[8] },
    borderRadius: `${radius.sm}px`,
    boxShadow: { xs: shadows.crmCardCompact, md: shadows.propertyCard },
    height: {
      xs: `calc(100dvh - ${
        mobileDashboardHeaderHeight +
        mobileCreateHeaderHeight +
        mobileActionsHeight +
        mobileContentGap
      }px)`,
      md: 'auto',
    },
    minHeight: { xs: 0, md: 'auto' },
    overflowY: { xs: 'auto', md: 'visible' },
    px: { xs: 1.8, md: 3.2 },
    py: { xs: 2, md: 3 },
  },
} satisfies Record<string, SxProps<Theme>>
