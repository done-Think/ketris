'use client'

import { createContext, useContext } from 'react'

import type {
  CapturePresentationProviderProps,
  CapturePresentationVariant,
} from '../types/capture.types'

const CapturePresentationContext = createContext<CapturePresentationVariant>('standalone')

export function CapturePresentationProvider({
  variant = 'standalone',
  children,
}: CapturePresentationProviderProps) {
  return (
    <CapturePresentationContext.Provider value={variant}>
      {children}
    </CapturePresentationContext.Provider>
  )
}

export function useCapturePresentation() {
  return useContext(CapturePresentationContext)
}
