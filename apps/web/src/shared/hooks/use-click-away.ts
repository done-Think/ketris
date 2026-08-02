'use client'

import { useEffect, type RefObject } from 'react'

type UseClickAwayOptions = {
  enabled?: boolean
  onEscape?: () => void
}

export function useClickAway<T extends HTMLElement>(
  refs: Array<RefObject<T>>,
  onClickAway: () => void,
  options: UseClickAwayOptions = {},
) {
  const { enabled = true, onEscape = onClickAway } = options

  useEffect(() => {
    if (!enabled) return

    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node
      const clickedInside = refs.some((ref) => ref.current?.contains(target))

      if (!clickedInside) onClickAway()
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onEscape()
    }

    document.addEventListener('click', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('click', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [enabled, onClickAway, onEscape, refs])
}
