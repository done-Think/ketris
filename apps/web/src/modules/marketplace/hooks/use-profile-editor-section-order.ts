'use client'

import { type PointerEvent, useCallback, useEffect, useRef, useState } from 'react'

import type {
  UseProfileEditorSectionOrderParams,
  UseProfileEditorSectionOrderResult,
} from '../types/profile-editor'

export function useProfileEditorSectionOrder<TSectionSlot extends string>({
  sectionOrder,
  setSectionOrder,
}: UseProfileEditorSectionOrderParams<TSectionSlot>): UseProfileEditorSectionOrderResult<TSectionSlot> {
  const [draggedPosition, setDraggedPosition] = useState<number | null>(null)
  const [pressedPosition, setPressedPosition] = useState<number | null>(null)
  const [isTouchLikeDevice, setIsTouchLikeDevice] = useState(false)
  const draggedPositionRef = useRef<number | null>(null)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressStartRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const coarsePointerQuery = window.matchMedia('(pointer: coarse)')
    const updateTouchLikeDevice = () => {
      setIsTouchLikeDevice(coarsePointerQuery.matches || navigator.maxTouchPoints > 0)
    }

    updateTouchLikeDevice()
    coarsePointerQuery.addEventListener('change', updateTouchLikeDevice)

    return () => coarsePointerQuery.removeEventListener('change', updateTouchLikeDevice)
  }, [])

  useEffect(() => {
    draggedPositionRef.current = draggedPosition
  }, [draggedPosition])

  useEffect(() => {
    if (!isTouchLikeDevice || draggedPosition === null) return undefined

    const previousBodyOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousBodyOverflow
    }
  }, [draggedPosition, isTouchLikeDevice])

  const updateSectionOrder = useCallback(
    (position: number, nextSection: TSectionSlot) => {
      const currentOrder = [...sectionOrder]
      const previousSection = currentOrder[position]
      const nextSectionPosition = currentOrder.indexOf(nextSection)

      if (previousSection === undefined) return

      currentOrder[position] = nextSection
      if (nextSection !== 'none' && nextSectionPosition >= 0) {
        currentOrder[nextSectionPosition] = previousSection
      }

      setSectionOrder(currentOrder)
    },
    [sectionOrder, setSectionOrder],
  )

  const swapSectionPositions = useCallback(
    (fromPosition: number, toPosition: number) => {
      if (fromPosition === toPosition) return

      const currentOrder = [...sectionOrder]
      const movedSection = currentOrder[fromPosition]
      const targetSection = currentOrder[toPosition]

      if (movedSection === undefined || targetSection === undefined) return

      currentOrder[fromPosition] = targetSection
      currentOrder[toPosition] = movedSection

      setSectionOrder(currentOrder)
    },
    [sectionOrder, setSectionOrder],
  )

  const clearLongPressTimer = useCallback(() => {
    if (!longPressTimerRef.current) return

    clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = null
  }, [])

  const resetLongPress = useCallback(() => {
    clearLongPressTimer()
    longPressStartRef.current = null
    draggedPositionRef.current = null
    setPressedPosition(null)
    setDraggedPosition(null)
  }, [clearLongPressTimer])

  useEffect(() => {
    window.addEventListener('blur', resetLongPress)
    window.addEventListener('pointercancel', resetLongPress)

    return () => {
      resetLongPress()
      window.removeEventListener('blur', resetLongPress)
      window.removeEventListener('pointercancel', resetLongPress)
    }
  }, [resetLongPress])

  const startLongPress = useCallback(
    (sectionPosition: number) => (event: PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === 'mouse') return

      clearLongPressTimer()
      longPressStartRef.current = { x: event.clientX, y: event.clientY }
      setPressedPosition(sectionPosition)
      event.currentTarget.setPointerCapture(event.pointerId)
      longPressTimerRef.current = setTimeout(() => {
        draggedPositionRef.current = sectionPosition
        setPressedPosition(null)
        setDraggedPosition(sectionPosition)
      }, 2000)
    },
    [clearLongPressTimer],
  )

  const moveLongPress = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === 'mouse') return

      const startPoint = longPressStartRef.current

      if (draggedPositionRef.current === null && startPoint) {
        const movedDistance = Math.hypot(event.clientX - startPoint.x, event.clientY - startPoint.y)

        if (movedDistance > 10) {
          clearLongPressTimer()
          setPressedPosition(null)
        }

        return
      }

      if (draggedPositionRef.current === null) return

      event.preventDefault()
    },
    [clearLongPressTimer],
  )

  const finishLongPress = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === 'mouse') return

      clearLongPressTimer()
      longPressStartRef.current = null
      setPressedPosition(null)

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }

      const activeDraggedPosition = draggedPositionRef.current

      if (activeDraggedPosition === null) return

      const targetElement = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest<HTMLElement>('[data-profile-preview-position]')
      const targetPosition = Number(targetElement?.dataset.profilePreviewPosition)

      if (Number.isInteger(targetPosition)) {
        swapSectionPositions(activeDraggedPosition, targetPosition)
      }

      draggedPositionRef.current = null
      setDraggedPosition(null)
    },
    [clearLongPressTimer, swapSectionPositions],
  )

  return {
    draggedPosition,
    finishLongPress,
    isTouchLikeDevice,
    moveLongPress,
    pressedPosition,
    resetLongPress,
    setDraggedPosition,
    startLongPress,
    swapSectionPositions,
    updateSectionOrder,
  }
}
