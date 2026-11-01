import type { Theme } from '@mui/material'
import type { SystemStyleObject } from '@mui/system'

import { capture, motion, radius } from './tokens'

import type { DocumentGuide, FaceRing, ViewportCorner as Corner } from '../types/capture.types'

export const documentGuideColor: Record<DocumentGuide, string> = {
  idle: capture.guideIdle,
  warn: capture.guideWarn,
  ok: capture.guideOk,
}

export const faceRingColor: Record<FaceRing, string> = {
  warn: capture.guideWarn,
  active: capture.guideActive,
  ok: capture.guideOk,
}

const cornerPlacement: Record<Corner, SystemStyleObject<Theme>> = {
  topLeft: {
    left: 10,
    top: 10,
    borderLeft: '4px solid',
    borderTop: '4px solid',
    borderTopLeftRadius: 10,
  },
  topRight: {
    right: 10,
    top: 10,
    borderRight: '4px solid',
    borderTop: '4px solid',
    borderTopRightRadius: 10,
  },
  bottomLeft: {
    left: 10,
    bottom: 10,
    borderLeft: '4px solid',
    borderBottom: '4px solid',
    borderBottomLeftRadius: 10,
  },
  bottomRight: {
    right: 10,
    bottom: 10,
    borderRight: '4px solid',
    borderBottom: '4px solid',
    borderBottomRightRadius: 10,
  },
}

export const documentViewportStyles = {
  frame: {
    position: 'relative',
    width: '100%',
    maxWidth: 340,
    aspectRatio: '340 / 216',
    borderRadius: `${radius.lg}px`,
    bgcolor: capture.viewport,
    overflow: 'hidden',
  },
  card: {
    position: 'absolute',
    inset: '16% 10%',
    borderRadius: '10px',
    bgcolor: capture.documentCard,
    opacity: 0.55,
    transform: 'rotate(-2deg)',
  },
  photo: {
    position: 'absolute',
    left: '5%',
    top: '11%',
    width: '24%',
    height: '57%',
    borderRadius: '6px',
    bgcolor: capture.documentLine,
  },
  line: (top: string, width: string, left = '35%') => ({
    position: 'absolute',
    left,
    top,
    width,
    height: 9,
    borderRadius: '4px',
    bgcolor: capture.documentLine,
  }),
  dashed: {
    position: 'absolute',
    inset: 14,
    border: '2px dashed',
    borderColor: capture.guideIdle,
    borderRadius: `${radius.md}px`,
  },
  corner: (corner: Corner, guide: DocumentGuide): SystemStyleObject<Theme> => ({
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: documentGuideColor[guide],
    transition: motion.transition.guide,
    ...cornerPlacement[corner],
  }),
}

export const corners: Corner[] = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight']

export const faceViewportStyles = {
  media: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: 'scaleX(-1)',
  },
  stage: {
    position: 'relative',
    flex: 1,
    minHeight: 360,
    overflow: 'hidden',
    display: 'grid',
    placeItems: 'center',
    bgcolor: capture.viewport,
    mx: -2.5,
  },
  silhouette: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -44%)',
    color: capture.silhouette,
  },
  mask: {
    position: 'relative',
    width: 236,
    height: 312,
    borderRadius: '50%',
    boxShadow: `0 0 0 600px ${capture.overlay}`,
  },
  ring: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  },
  arrow: (side: 'left' | 'right') => ({
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'common.white',
    fontSize: 48,
    ...(side === 'left' ? { left: 14 } : { right: 14 }),
  }),
}
