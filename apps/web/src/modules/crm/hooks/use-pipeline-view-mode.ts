import { useSyncExternalStore } from 'react'
import type { SalesPipelineViewMode } from '../types/sales-pipeline'

const storageKey = 'ketris.crm.pipeline.viewMode'
const changeEvent = 'ketris.crm.pipeline.viewModeChanged'
let fallbackViewMode: SalesPipelineViewMode = 'kanban'

function getSnapshot(): SalesPipelineViewMode {
  try {
    return window.localStorage.getItem(storageKey) === 'list' ? 'list' : 'kanban'
  } catch {
    return fallbackViewMode
  }
}

function getServerSnapshot(): SalesPipelineViewMode {
  return 'kanban'
}

function subscribe(listener: () => void) {
  window.addEventListener('storage', listener)
  window.addEventListener(changeEvent, listener)
  return () => {
    window.removeEventListener('storage', listener)
    window.removeEventListener(changeEvent, listener)
  }
}

function setViewMode(viewMode: SalesPipelineViewMode) {
  fallbackViewMode = viewMode
  try {
    window.localStorage.setItem(storageKey, viewMode)
  } catch {}
  window.dispatchEvent(new Event(changeEvent))
}

export function usePipelineViewMode() {
  const viewMode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return [viewMode, setViewMode] as const
}
