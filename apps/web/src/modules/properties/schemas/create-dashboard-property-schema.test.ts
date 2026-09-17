import { describe, expect, it } from 'vitest'

import {
  createDashboardPropertyDefaultValues,
  createDashboardPropertySchema,
} from './create-dashboard-property-schema'

describe('createDashboardPropertySchema', () => {
  it('accepts the static dashboard form defaults', () => {
    const result = createDashboardPropertySchema.safeParse(createDashboardPropertyDefaultValues)

    expect(result.success).toBe(true)
  })

  it('rejects missing required listing fields', () => {
    const result = createDashboardPropertySchema.safeParse({
      ...createDashboardPropertyDefaultValues,
      title: '',
      street: '',
      mainValue: '',
    })

    expect(result.success).toBe(false)
  })
})
