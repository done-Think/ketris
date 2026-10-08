import { describe, expect, it } from 'vitest'

import {
  createDashboardPropertyDefaultValues,
  createDashboardPropertySchema,
} from '../../schemas/create-dashboard-property-schema'

const schema = createDashboardPropertySchema((key) => key)

describe('createDashboardPropertySchema', () => {
  it('accepts the static dashboard form defaults', () => {
    const result = schema.safeParse(createDashboardPropertyDefaultValues)

    expect(result.success).toBe(true)
  })

  it('rejects missing required listing fields', () => {
    const result = schema.safeParse({
      ...createDashboardPropertyDefaultValues,
      title: '',
      street: '',
      mainValue: '',
    })

    expect(result.success).toBe(false)
  })

  it('routes each validation message through the translator with the right key', () => {
    const translated = createDashboardPropertySchema((key) => `translated:${key}`)
    const result = translated.safeParse({
      ...createDashboardPropertyDefaultValues,
      title: '',
    })

    expect(result.success).toBe(false)
    expect(result.success ? undefined : result.error.issues[0]?.message).toBe(
      'translated:titleRequired',
    )
  })
})
