'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// How many pixels the content is wider than its container (0 when it fits). Re-measures when
// either element resizes, when `deps` change (for example, a new image source) and whenever the
// caller invokes `measure`, such as after an image finishes loading.
export function useElementOverflow<
  TContainer extends HTMLElement = HTMLDivElement,
  TContent extends HTMLElement = HTMLElement,
>(deps: readonly unknown[] = []) {
  const containerRef = useRef<TContainer | null>(null)
  const contentRef = useRef<TContent | null>(null)
  const [overflow, setOverflow] = useState(0)

  const measure = useCallback(() => {
    const container = containerRef.current
    const content = contentRef.current

    setOverflow(
      container && content
        ? Math.max(0, content.getBoundingClientRect().width - container.clientWidth)
        : 0,
    )
  }, [])

  useEffect(() => {
    measure()

    if (!window.ResizeObserver) return

    const resizeObserver = new ResizeObserver(measure)

    if (containerRef.current) resizeObserver.observe(containerRef.current)
    if (contentRef.current) resizeObserver.observe(contentRef.current)

    return () => resizeObserver.disconnect()
    // The caller decides which values should trigger a new measurement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measure, ...deps])

  return { containerRef, contentRef, overflow, measure }
}
