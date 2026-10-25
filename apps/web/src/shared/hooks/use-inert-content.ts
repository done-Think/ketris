'use client'

import { useCallback } from 'react'

// React 18 does not forward the boolean inert attribute; set it on the DOM node.
export function useInertContent(blocked: boolean) {
  return useCallback(
    (element: HTMLDivElement | null) => {
      if (blocked) element?.setAttribute('inert', '')
      else element?.removeAttribute('inert')
    },
    [blocked],
  )
}
