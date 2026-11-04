'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useStore } from 'zustand'

import type {
  CaptureFlowProviderProps,
  CaptureFlowState,
  CaptureFlowStore,
} from '../types/capture.types'
import { createCaptureFlowStore } from './capture-flow-store'

const CaptureFlowContext = createContext<CaptureFlowStore | null>(null)
const CaptureRequestsContext = createContext<(() => AbortSignal) | null>(null)

export function CaptureFlowProvider({ children }: CaptureFlowProviderProps) {
  const [store] = useState(createCaptureFlowStore)
  const requests = useRef<AbortController | null>(null)
  const getRequestSignal = useCallback(() => {
    if (!requests.current || requests.current.signal.aborted)
      requests.current = new AbortController()
    return requests.current.signal
  }, [])
  useEffect(
    () => () => {
      requests.current?.abort()
      store.getState().clearImages()
    },
    [store],
  )

  return (
    <CaptureFlowContext.Provider value={store}>
      <CaptureRequestsContext.Provider value={getRequestSignal}>
        {children}
      </CaptureRequestsContext.Provider>
    </CaptureFlowContext.Provider>
  )
}

export function useCaptureRequestSignal() {
  const getSignal = useContext(CaptureRequestsContext)
  if (!getSignal) throw new Error('useCaptureRequestSignal must be used inside CaptureFlowProvider')
  return getSignal
}

export function useCaptureFlow<T>(selector: (state: CaptureFlowState) => T): T {
  const store = useContext(CaptureFlowContext)
  if (!store) throw new Error('useCaptureFlow must be used inside CaptureFlowProvider')

  return useStore(store, selector)
}
