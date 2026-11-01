import { alpha as colorAlpha, type SxProps, type Theme } from '@mui/material'

import type { StepProgressTone } from '../types'
import type { DocumentRegion } from '../types/document-import.types'
import {
  alpha,
  brand,
  capture,
  fontFamily,
  layout,
  radius,
  semanticInk,
  statusPalette,
  supportColor,
  surface,
} from './tokens'

import type {
  CapturePresentationVariant,
  DocumentOrientation,
  ResultIllustrationProps,
} from '../types/capture.types'

export const documentImportStyles = {
  sides: {
    alignSelf: 'flex-start',
    '& .MuiToggleButton-root': {
      textTransform: 'none',
      px: 2,
      '&.Mui-selected': {
        color: capture.guideActive,
        bgcolor: colorAlpha(capture.guideActive, 0.08),
      },
    },
  },
  loading: { textAlign: 'center', py: 3 },
  preview: (disabled: boolean) => ({
    position: 'relative',
    touchAction: 'none',
    cursor: disabled ? 'default' : 'crosshair',
  }),
  image: { display: 'block', width: '100%' },
  selection: (region: DocumentRegion) => ({
    position: 'absolute',
    pointerEvents: 'none',
    border: '3px solid',
    borderColor: capture.guideActive,
    boxSizing: 'border-box',
    left: `${region.x * 100}%`,
    top: `${region.y * 100}%`,
    width: `${region.width * 100}%`,
    height: `${region.height * 100}%`,
    backgroundColor: colorAlpha(capture.guideActive, 0.08),
  }),
  coordinates: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 },
} satisfies Record<string, SxProps<Theme> | ((...args: never[]) => SxProps<Theme>)>

export function captureLayoutStyles(
  tone: StepProgressTone,
  variant: CapturePresentationVariant = 'standalone',
) {
  const isDark = tone === 'dark'
  const isDashboard = variant === 'dashboard'

  return {
    page: {
      boxSizing: 'border-box',
      minHeight: isDashboard ? 'auto' : '100dvh',
      width: '100%',
      minWidth: 0,
      bgcolor: isDark ? capture.stage : surface.app,
      display: 'flex',
      justifyContent: 'center',
      p: isDashboard ? { xs: 2, sm: 3.5 } : { xs: 0, sm: 3, md: 4 },
    },
    column: {
      boxSizing: 'border-box',
      width: '100%',
      minWidth: 0,
      maxWidth: layout.captureMaxWidth,
      minHeight: isDashboard
        ? 'auto'
        : { xs: '100dvh', sm: 'calc(100dvh - 48px)', md: 'calc(100dvh - 64px)' },
      display: 'flex',
      flexDirection: 'column',
      gap: { xs: 2, md: 2.5 },
      p: { xs: 2, sm: 3, md: 4 },
      bgcolor: isDark ? capture.stage : surface.paper,
      color: isDark ? surface.darkModeText : 'text.primary',
      borderStyle: 'solid',
      borderWidth: { xs: isDashboard ? 1 : 0, sm: 1 },
      borderColor: isDark ? surface.darkDivider : 'divider',
      borderRadius: { xs: isDashboard ? `${radius.lg}px` : 0, sm: `${radius.lg}px` },
    },
    header: {
      minHeight: layout.captureHeaderHeight,
      flexShrink: 0,
      display: 'grid',
      gridTemplateColumns: '44px minmax(0, 1fr) 44px',
      alignItems: 'center',
      borderBottom: '1px solid',
      borderColor: isDark ? surface.darkDivider : 'divider',
    },
    dashboardHeading: { display: 'flex', alignItems: 'center', gap: 1, minHeight: 44 },
    dashboardTitle: { fontFamily: fontFamily.display, fontSize: 16, fontWeight: 700, m: 0 },
    backButton: { color: 'inherit', width: 44, height: 44, flexShrink: 0 },
    brand: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 },
    brandName: { fontFamily: fontFamily.display, fontSize: 16, fontWeight: 700 },
    main: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } },
    footer: {
      flexShrink: 0,
      position: 'static',
      pt: { xs: 2, md: 2.5 },
      display: 'flex',
      flexDirection: { xs: 'column', sm: 'row' },
      flexWrap: 'wrap',
      alignItems: { xs: 'stretch', sm: 'center' },
      justifyContent: 'flex-start',
      gap: 1.25,
      pb: 'env(safe-area-inset-bottom, 0px)',
      borderTop: '1px solid',
      borderColor: isDark ? surface.darkDivider : 'divider',
      '& > .MuiButton-root': {
        width: { xs: '100%', sm: 'auto' },
        minHeight: 44,
        minWidth: { sm: 160 },
      },
      '& > .MuiTypography-root, & > .MuiAlert-root': { flexBasis: '100%' },
    },
  } satisfies Record<string, SxProps<Theme>>
}

export const consentStyles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 0.9fr) minmax(0, 1.1fr)' },
    gap: { xs: 2.5, md: 4 },
    alignItems: 'start',
    minWidth: 0,
  },
  summary: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 },
  information: { minWidth: 0 },
} satisfies Record<string, SxProps<Theme>>

export const stepStyles = {
  intro: { display: 'flex', flexDirection: 'column', gap: 0.75, pt: 1 },
  title: {
    fontFamily: fontFamily.display,
    fontSize: 24,
    fontWeight: 700,
    lineHeight: 1.2,
  },
  darkTitle: {
    fontFamily: fontFamily.display,
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 1.2,
    color: surface.darkModeText,
  },
  body: { fontSize: 14, lineHeight: 1.55, color: 'text.secondary', maxWidth: '76ch' },
  card: {
    bgcolor: surface.paper,
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: `${radius.lg}px`,
    p: 2,
    display: 'flex',
    flexDirection: 'column',
    gap: 1.75,
  },
  infoRow: { display: 'flex', gap: 1.5 },
  infoIcon: {
    width: 36,
    height: 36,
    flexShrink: 0,
    borderRadius: '10px',
    bgcolor: brand.magenta[50],
    color: brand.magenta[600],
    display: 'grid',
    placeItems: 'center',
  },
  infoTitle: { fontSize: 14, fontWeight: 500 },
  infoBody: { fontSize: 13, lineHeight: 1.5, color: 'text.secondary' },
  link: { fontSize: 13, fontWeight: 500, color: brand.magenta[600] },
  secondaryAction: { minHeight: 44, color: brand.magenta[600], fontSize: 14 },
  darkSecondaryAction: { minHeight: 44, color: capture.accentText, fontSize: 14 },
  checkList: { m: 0, p: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 1.25 },
  checkItem: { display: 'flex', gap: 1.25, alignItems: 'center', fontSize: 14 },
  checkIcon: { color: brand.semantic.success, fontSize: 18 },
  spacer: { flex: 1 },
  consentLabel: {
    m: 0,
    mt: 1,
    alignItems: 'center',
    '& .MuiCheckbox-root': { p: 1, ml: -1 },
    '& .MuiFormControlLabel-label': { fontSize: 14, lineHeight: 1.5 },
  },
  errorText: { fontSize: 12, color: semanticInk.errorText },
} satisfies Record<string, SxProps<Theme>>

export const cameraStepStyles = {
  preview: {
    height: { xs: 180, md: 240 },
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    borderRadius: `${radius.lg}px`,
    bgcolor: brand.graphite[700],
    color: brand.magenta[400],
    display: 'grid',
    placeItems: 'center',
  },
  previewIcon: { fontSize: 56 },
  deniedIcon: {
    width: 64,
    height: 64,
    borderRadius: `${radius.lg}px`,
    bgcolor: supportColor.errorSoft,
    color: brand.semantic.error,
    display: 'grid',
    placeItems: 'center',
  },
  deniedSteps: {
    m: 0,
    py: 2,
    pr: 2,
    pl: 4.5,
    bgcolor: surface.paper,
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: `${radius.lg}px`,
    display: 'flex',
    flexDirection: 'column',
    gap: 1.25,
    fontSize: 14,
    lineHeight: 1.5,
  },
  promptEyebrow: { color: brand.neutral[500] },
  promptTitle: { display: 'block' },
  promptActions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 1.25,
    p: 2.5,
    pt: 0,
  },
} satisfies Record<string, SxProps<Theme>>

export const documentStepStyles = {
  typeGroup: { display: 'flex', gap: 1, flexWrap: 'wrap' },
  typeChip: (selected: boolean) => ({
    height: 36,
    px: 0.5,
    fontSize: 13,
    color: selected ? brand.graphite[500] : brand.graphite[100],
    bgcolor: selected ? surface.paper : capture.chipBg,
    border: '1px solid',
    borderColor: selected ? surface.paper : capture.chipBorder,
    '&:hover': { bgcolor: selected ? surface.paper : alpha.white[12] },
  }),
  sides: { display: 'flex', gap: 0.75, fontSize: 13, color: capture.mutedText },
  activeSide: {
    color: surface.lightText,
    fontWeight: 500,
    textDecoration: 'underline',
    textUnderlineOffset: '4px',
  },
  stage: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2.25,
  },
  guidance: {
    minHeight: 40,
    px: 2,
    borderRadius: `${radius.full}px`,
    bgcolor: capture.chipBg,
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    fontSize: 14,
    fontWeight: 500,
  },
  guidanceDot: (color: string) => ({
    width: 8,
    height: 8,
    borderRadius: `${radius.full}px`,
    bgcolor: color,
  }),
  checks: {
    m: 0,
    p: 0,
    listStyle: 'none',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 2,
    fontSize: 12,
    color: brand.graphite[100],
  },
  check: { display: 'flex', alignItems: 'center', gap: 0.75 },
  checkIcon: (passed: boolean) => ({
    fontSize: 15,
    color: passed ? brand.semantic.success : brand.graphite[400],
  }),
  hint: { fontSize: 12, color: capture.mutedText, textAlign: 'center' },
  shutterRow: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'center',
    gap: 2,
  },
  shutter: {
    width: 72,
    height: 72,
    p: 0,
    border: '4px solid',
    borderColor: surface.lightText,
    '&:hover': { bgcolor: alpha.white[8] },
    '&.Mui-disabled': { borderColor: alpha.white[50] },
  },
  shutterCore: { width: 56, height: 56, borderRadius: `${radius.full}px`, bgcolor: 'primary.main' },
} satisfies Record<string, SxProps<Theme> | ((...args: never[]) => SxProps<Theme>)>

export const documentReviewStyles = {
  preview: {
    position: 'relative',
    height: 176,
    borderRadius: `${radius.md}px`,
    bgcolor: brand.graphite[50],
    overflow: 'hidden',
  },
  card: {
    position: 'absolute',
    inset: 14,
    borderRadius: '10px',
    bgcolor: brand.graphite[100],
  },
  photo: (tone: string) => ({
    position: 'absolute',
    left: 14,
    top: 16,
    width: 64,
    height: 82,
    borderRadius: '6px',
    bgcolor: tone,
  }),
  line: (left: number, top: number, width: string) => ({
    position: 'absolute',
    left,
    top,
    width,
    height: 9,
    borderRadius: '4px',
    bgcolor: brand.graphite[200],
  }),
  footerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 },
  sideLabel: { fontSize: 14, fontWeight: 500 },
  quality: {
    display: 'flex',
    alignItems: 'center',
    gap: 0.75,
    fontSize: 12,
    color: 'text.secondary',
  },
  qualityIcon: { fontSize: 15, color: brand.semantic.success },
  photoPreview: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    bgcolor: capture.viewport,
  },
} satisfies Record<string, SxProps<Theme> | ((...args: never[]) => SxProps<Theme>)>

export const liveCaptureStyles = {
  orientationControl: { alignSelf: 'center' },
  orientationOption: {
    minHeight: 44,
    color: capture.mutedText,
    borderColor: capture.chipBorder,
    '&.Mui-selected': {
      bgcolor: surface.darkModeText,
      color: capture.stage,
      '&:hover': { bgcolor: surface.darkModeText },
    },
  },
  documentFrame: (aspectRatio: number | null) => ({
    position: 'relative',
    width: '100%',
    maxWidth: Math.min(640, 560 * (aspectRatio ?? 4 / 3)),
    aspectRatio: aspectRatio ?? 4 / 3,
    borderRadius: `${radius.lg}px`,
    bgcolor: capture.viewport,
    overflow: 'hidden',
  }),
  documentGuide: (orientation: DocumentOrientation, aspectRatio: number | null) => ({
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: `${84 * Math.min(1, (orientation === 'portrait' ? 1 / 1.55 : 1.55) / (aspectRatio ?? 4 / 3))}%`,
    aspectRatio: orientation === 'portrait' ? 1 / 1.55 : 1.55,
    border: '3px solid',
    borderColor: capture.guideIdle,
    borderRadius: `${radius.sm}px`,
    boxShadow: `0 0 0 100vmax ${alpha.graphite[52]}`,
    pointerEvents: 'none',
  }),
  selfieBackgroundAlert: {
    bgcolor: supportColor.errorSoft,
    color: semanticInk.errorText,
    borderColor: brand.semantic.error,
    '& .MuiAlert-icon': { color: semanticInk.errorText },
  },
  video: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  notice: {
    position: 'relative',
    minHeight: 300,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1.25,
    p: 2.5,
    textAlign: 'center',
    bgcolor: capture.viewport,
    color: surface.lightText,
  },
  noticeIcon: { fontSize: 36, color: capture.mutedText },
  inactiveFrame: { aspectRatio: 'auto', minHeight: 300 },
  noticeTitle: { fontSize: 16, fontWeight: 500 },
  noticeText: { fontSize: 13, color: capture.mutedText, maxWidth: 300 },
  galleryButton: {
    minHeight: 44,
    color: surface.darkModeText,
    borderColor: alpha.white[50],
    fontSize: 13,
    '&:hover': { borderColor: surface.lightText, bgcolor: alpha.white[8] },
  },
  shutterSide: { justifySelf: 'start' },
  challengeNote: { fontSize: 12, color: capture.mutedText, textAlign: 'center' },
  selfieNotice: { position: 'relative', minHeight: 220, borderRadius: `${radius.lg}px` },
} satisfies Record<string, SxProps<Theme> | ((...args: never[]) => SxProps<Theme>)>

export const selfieStepStyles = {
  segments: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 0.75 },
  segment: (state: 'done' | 'current' | 'pending') => ({
    height: 4,
    borderRadius: `${radius.full}px`,
    bgcolor:
      state === 'done'
        ? brand.semantic.success
        : state === 'current'
          ? 'primary.main'
          : capture.chipBorder,
  }),
  segmentLabel: { fontSize: 12, color: capture.mutedText },
  hintRow: { display: 'flex', justifyContent: 'center', pt: 2 },
  hint: (variant: 'warn' | 'active' | 'ok') => ({
    minHeight: 44,
    px: 2.25,
    borderRadius: `${radius.full}px`,
    display: 'flex',
    alignItems: 'center',
    fontSize: 15,
    fontWeight: 500,
    bgcolor:
      variant === 'warn'
        ? supportColor.warningSoft
        : variant === 'ok'
          ? supportColor.successSoft
          : alpha.white[12],
    color: variant === 'active' ? surface.lightText : brand.graphite[500],
  }),
  outlinedDark: {
    color: surface.darkModeText,
    borderColor: alpha.white[50],
    '&:hover': { borderColor: surface.lightText, bgcolor: alpha.white[8] },
  },
} satisfies Record<string, SxProps<Theme> | ((...args: never[]) => SxProps<Theme>)>

export const submitStepStyles = {
  progress: {
    height: 8,
    borderRadius: `${radius.full}px`,
    bgcolor: brand.neutral[100],
    '& .MuiLinearProgress-bar': { borderRadius: `${radius.full}px` },
  },
  list: {
    m: 0,
    p: 2,
    listStyle: 'none',
    bgcolor: surface.paper,
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: `${radius.lg}px`,
    display: 'flex',
    flexDirection: 'column',
    gap: 1.75,
  },
  item: { display: 'flex', alignItems: 'center', gap: 1.5, minHeight: 32 },
  dot: (state: 'done' | 'active' | 'waiting') => ({
    width: 28,
    height: 28,
    flexShrink: 0,
    borderRadius: `${radius.full}px`,
    border: '2px solid',
    borderColor:
      state === 'done'
        ? brand.semantic.success
        : state === 'active'
          ? 'primary.main'
          : brand.neutral[200],
    bgcolor: state === 'done' ? brand.semantic.success : surface.paper,
    color: surface.lightText,
    display: 'grid',
    placeItems: 'center',
  }),
  dotIcon: { fontSize: 15 },
  itemLabel: { fontSize: 14, fontWeight: 500 },
  itemStatus: { fontSize: 12, color: 'text.secondary' },
} satisfies Record<string, SxProps<Theme> | ((...args: never[]) => SxProps<Theme>)>

const resultToneColor: Record<ResultIllustrationProps['tone'], { soft: string; ink: string }> = {
  success: { soft: statusPalette.success.soft, ink: brand.semantic.success },
  warning: { soft: statusPalette.warning.soft, ink: semanticInk.warningIcon },
  error: { soft: statusPalette.error.soft, ink: brand.semantic.error },
  info: { soft: statusPalette.info.soft, ink: brand.semantic.info },
}

export const resultStepStyles = {
  root: {
    flex: 1,
    pt: 6,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 2,
  },
  illustration: (tone: ResultIllustrationProps['tone']) => ({
    width: 88,
    height: 88,
    borderRadius: `${radius.full}px`,
    bgcolor: resultToneColor[tone].soft,
    color: resultToneColor[tone].ink,
    display: 'grid',
    placeItems: 'center',
    '& svg': { fontSize: 44 },
  }),
  title: { fontFamily: fontFamily.display, fontSize: 26, fontWeight: 700, lineHeight: 1.2 },
  body: { fontSize: 15, lineHeight: 1.55, color: 'text.secondary', maxWidth: 640 },
  card: {
    width: '100%',
    maxWidth: 720,
    bgcolor: surface.paper,
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: `${radius.lg}px`,
    p: 2,
    display: 'flex',
    flexDirection: 'column',
    gap: 1.25,
    textAlign: 'left',
  },
  cardTitle: { fontSize: 14, fontWeight: 500 },
  list: {
    m: 0,
    pl: 2.5,
    display: 'flex',
    flexDirection: 'column',
    gap: 0.75,
    fontSize: 13,
    lineHeight: 1.5,
    color: brand.neutral[700],
  },
  protocolRow: { display: 'flex', justifyContent: 'space-between', gap: 1.5, fontSize: 13 },
  protocolValue: { fontFamily: fontFamily.mono, fontWeight: 500 },
  muted: { fontSize: 13, color: 'text.secondary' },
  attempts: {
    minHeight: 28,
    px: 1.5,
    borderRadius: `${radius.full}px`,
    bgcolor: surface.paper,
    border: '1px solid',
    borderColor: 'divider',
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: 13,
    fontWeight: 500,
  },
} satisfies Record<string, SxProps<Theme> | ((...args: never[]) => SxProps<Theme>)>

export const alternativeStepStyles = {
  reasonOption: (checked: boolean) => ({
    m: 0,
    minHeight: 48,
    px: 1,
    bgcolor: surface.paper,
    border: '1px solid',
    borderColor: checked ? 'primary.main' : 'divider',
    borderRadius: `${radius.md}px`,
    '& .MuiFormControlLabel-label': { fontSize: 14 },
  }),
  reasonGroup: { gap: 1.25 },
  legend: { fontSize: 14, fontWeight: 500, color: 'text.primary', mb: 1.25 },
} satisfies Record<string, SxProps<Theme> | ((...args: never[]) => SxProps<Theme>)>
