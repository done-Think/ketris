'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export function useLogoOverflow(logoUrl: string | null | undefined, layoutKey: string) {
  const slotRef = useRef<HTMLDivElement | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [overflow, setOverflow] = useState(0)

  const measure = useCallback(() => {
    const slot = slotRef.current
    const image = imageRef.current
    setOverflow(
      slot && image ? Math.max(0, image.getBoundingClientRect().width - slot.clientWidth) : 0,
    )
  }, [])

  useEffect(() => {
    measure()
    if (typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(measure)
    if (slotRef.current) observer.observe(slotRef.current)
    if (imageRef.current) observer.observe(imageRef.current)

    return () => observer.disconnect()
  }, [measure, logoUrl, layoutKey])

  return { slotRef, imageRef, overflow, measure }
}
