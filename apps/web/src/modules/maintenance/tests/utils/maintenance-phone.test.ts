import { describe, expect, it } from 'vitest'
import { formatMaintenancePhone } from '../../utils/maintenance-phone'

describe('formatMaintenancePhone', () => {
  it('masks a mobile number saved with digits only', () => {
    expect(formatMaintenancePhone('11933335555')).toBe('(11) 93333-5555')
  })

  it('masks a landline number saved with digits only', () => {
    expect(formatMaintenancePhone('3536221234')).toBe('(35) 3622-1234')
  })

  it('keeps a number that was already masked', () => {
    expect(formatMaintenancePhone('(11) 93333-5555')).toBe('(11) 93333-5555')
  })

  it('shows any other value as it was typed', () => {
    expect(formatMaintenancePhone('+1 415 555 0100')).toBe('+1 415 555 0100')
    expect(formatMaintenancePhone('ramal 22')).toBe('ramal 22')
  })
})
