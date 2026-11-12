import { describe, expect, it, vi } from 'vitest'
import type { HttpClient } from '@shared/lib/api/http-client'
import { PropertyHistoryService } from '../../services/property-history-service'

describe('property history event requests', () => {
  it('requests the exact selected event', async () => {
    const event = { id: 'selected-event', changes: [] }
    const http = { get: vi.fn().mockResolvedValue({ event }) }
    const signal = new AbortController().signal
    const service = new PropertyHistoryService(http as unknown as HttpClient)
    expect(await service.get('property', event.id, signal)).toBe(event)
    expect(http.get).toHaveBeenCalledWith('/properties/property/history/selected-event', { signal })
  })
  it('rejects a response belonging to a different event', async () => {
    const http = { get: vi.fn().mockResolvedValue({ event: { id: 'other-event', changes: [] } }) }
    const service = new PropertyHistoryService(http as unknown as HttpClient)
    await expect(
      service.get('property', 'selected-event', new AbortController().signal),
    ).rejects.toThrow('PROPERTY_HISTORY_EVENT_MISMATCH')
  })
})
