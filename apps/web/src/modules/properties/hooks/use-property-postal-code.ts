import { useEffect, useRef, useState } from 'react'
import type { UseFormGetValues, UseFormSetValue } from 'react-hook-form'

import type { CreateDashboardPropertyFormValues } from '../types/dashboard-property'
import { lookupPostalCode } from '../services/postal-code-service'
import { normalizePostalCode } from '@shared/utils/postal-code'

export function usePropertyPostalCode(
  getValues: UseFormGetValues<CreateDashboardPropertyFormValues>,
  setValue: UseFormSetValue<CreateDashboardPropertyFormValues>,
  onAddressChange: () => void,
) {
  const active = useRef<AbortController | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'notFound' | 'unavailable'>('idle')

  useEffect(
    () => () => {
      active.current?.abort()
      active.current = null
    },
    [],
  )

  function cancel() {
    active.current?.abort()
    active.current = null
    setStatus('idle')
  }

  async function lookup() {
    const zipCode = normalizePostalCode(getValues('zipCode'))
    if (!zipCode) return
    cancel()
    const controller = new AbortController()
    active.current = controller
    const initial = getValues()
    let expired = false
    const timeout = setTimeout(() => {
      expired = true
      controller.abort()
    }, 5000)
    setStatus('loading')
    try {
      const address = await lookupPostalCode(zipCode, controller.signal)
      if (
        active.current !== controller ||
        controller.signal.aborted ||
        normalizePostalCode(getValues('zipCode')) !== zipCode
      )
        return
      if (!address) {
        setStatus('notFound')
        return
      }
      for (const name of ['street', 'neighborhood', 'city', 'state'] as const) {
        if (
          address[name] &&
          getValues(name) === initial[name] &&
          getValues(name) !== address[name]
        ) {
          onAddressChange()
          setValue(name, address[name], { shouldDirty: true, shouldValidate: true })
        }
      }
      setStatus('idle')
    } catch {
      if (active.current === controller && (!controller.signal.aborted || expired))
        setStatus('unavailable')
    } finally {
      clearTimeout(timeout)
      if (active.current === controller) active.current = null
    }
  }

  return { status, lookup, cancel }
}
