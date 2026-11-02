import type { CaptureDraftState } from '../types/capture-draft.types'

export function hasCompleteSelfieDrafts(
  draft: Pick<CaptureDraftState, 'selfieImage' | 'movementImages'>,
) {
  return Boolean(
    draft.selfieImage &&
    (['turnLeft', 'turnRight', 'closer'] as const).every((pose) => draft.movementImages[pose]),
  )
}
