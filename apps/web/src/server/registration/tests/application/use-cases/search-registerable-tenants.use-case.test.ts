import { describe, expect, it } from 'vitest'

import { RENTER_TENANT_SLUG } from '@server/shared/domain/system-tenants'
import { SearchRegisterableTenantsUseCase } from '../../../application/use-cases/search-registerable-tenants.use-case'
import { createDeps, tenant } from './fixtures'

describe('SearchRegisterableTenantsUseCase', () => {
  it('searches agencies by name while excluding the shared renter tenant', async () => {
    const { accounts } = createDeps()
    expect(
      await new SearchRegisterableTenantsUseCase(accounts).execute({ query: 'Imobiliária' }),
    ).toEqual([tenant])
    expect(accounts.searchByName).toHaveBeenCalledWith('Imobiliária', [RENTER_TENANT_SLUG])
  })

  it.each(['', ' ', '   ', 'a', ' a ', 'a   ', '\t\n'])(
    'refuses to list agencies for the too-short query %j without touching the repository',
    async (query) => {
      const { accounts } = createDeps()
      expect(await new SearchRegisterableTenantsUseCase(accounts).execute({ query })).toEqual([])
      expect(accounts.searchByName).not.toHaveBeenCalled()
    },
  )

  it('searches with two non-space characters, trimmed', async () => {
    const { accounts } = createDeps()
    await new SearchRegisterableTenantsUseCase(accounts).execute({ query: '  Im ' })
    expect(accounts.searchByName).toHaveBeenCalledWith('Im', [RENTER_TENANT_SLUG])
  })
})
