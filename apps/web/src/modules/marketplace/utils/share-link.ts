import type { ShareLinkInput, ShareLinkResult } from '../types/share-link'

const touchPointerQuery = '(pointer: coarse)'

function canUseNativeShare() {
  return (
    typeof navigator.share === 'function' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(touchPointerQuery).matches
  )
}

function isShareCancellation(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}

export async function shareLink({ title, url }: ShareLinkInput): Promise<ShareLinkResult> {
  if (canUseNativeShare()) {
    try {
      await navigator.share({ title, url })
      return 'shared'
    } catch (error) {
      if (isShareCancellation(error)) return 'cancelled'
    }
  }

  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    return 'failed'
  }
}
