import { describe, expect, it } from 'vitest'

import type { PlatformAdminAccount } from '../../types/platform-admin'
import {
  adminInitials,
  filterPlatformAdmins,
  toPlatformAdminRoleFilter,
  toPlatformAdminStatusFilter,
} from '../../utils/platform-admins'

const base: PlatformAdminAccount = {
  id: 'a1',
  name: 'Ana Souza',
  email: 'ana@ketris.dev',
  role: 'ADMIN',
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  lastAccessAt: null,
}
const admins = [
  base,
  { ...base, id: 'a2', name: 'Bruno', email: 'b@k.dev', role: 'AGENT' as const, active: false },
]
const all = { search: '', status: 'all' as const, role: 'all' as const }

describe('platform admin utils', () => {
  it('filtra por nome ou e-mail sem diferenciar maiúsculas', () => {
    expect(filterPlatformAdmins(admins, { ...all, search: '  ANA ' }).map((a) => a.id)).toEqual([
      'a1',
    ])
    expect(filterPlatformAdmins(admins, { ...all, search: 'b@k' }).map((a) => a.id)).toEqual(['a2'])
  })

  it('filtra por situação e por função', () => {
    expect(filterPlatformAdmins(admins, { ...all, status: 'inactive' }).map((a) => a.id)).toEqual([
      'a2',
    ])
    expect(filterPlatformAdmins(admins, { ...all, role: 'ADMIN' }).map((a) => a.id)).toEqual(['a1'])
  })

  it('converte valores desconhecidos dos selects em "todos"', () => {
    expect(toPlatformAdminStatusFilter('active')).toBe('active')
    expect(toPlatformAdminStatusFilter('x')).toBe('all')
    expect(toPlatformAdminRoleFilter('ADMIN_AGENT')).toBe('ADMIN_AGENT')
    expect(toPlatformAdminRoleFilter('ROOT')).toBe('all')
  })

  it('gera as iniciais com até duas letras', () => {
    expect(adminInitials('ana maria souza')).toBe('AM')
    expect(adminInitials('Bruno')).toBe('B')
  })
})
