'use client'

import { useCallback } from 'react'

export function useInertContent(blocked: boolean) {
  return useCallback(
    (element: HTMLDivElement | null) => {
      if (blocked) element?.setAttribute('inert', '')
      else element?.removeAttribute('inert')
    },
    [blocked],
  )
}
